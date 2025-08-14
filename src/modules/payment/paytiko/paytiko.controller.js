// src/controllers/paytiko.controller.js
const { mt5Constant, matchTraderConstant } = require("../../../constants/commonConstants");
const { offerUUIDConstants } = require("../../../constants/MatchTraderConstants");
const { generateSignatureForPaytikoWebhook } = require("../../../helper/paytiko");
const generatePassword = require("../../../helper/utils/generatePasswordForMt5");
const retryAsync = require("../../../helper/utils/retryAsync");
const { sendToZapier } = require("../../../helper/utils/sendToZapier");
const { MOrder } = require("../../orders/orders.schema");
const { updateOrder } = require("../../orders/orders.services");
const MUser = require("../../users/users.schema");
const {
	handleMt5AccountCreate,
	updateUser,
	updateUserRole,
	handleMatchTraderAccountCreate,
} = require("../../users/users.services");
const { createCheckoutRequest, savePaytikoWebhookData } = require("./paytiko.services");

const startCheckout = async (req, res) => {
	// const data = {
	//     firstName: 'John',
	//     lastName: 'Doe',
	//     email: 'john.doe@example.com',
	//     currency: 'USD',
	//     countryCode: 'US',
	//     lockedAmount: 100.0,
	//     phone: '+1234567890',
	//     orderId: 'order_123',
	//     city: 'New York',
	//     street: '123 Main St',
	//     region: 'NY',
	//     zipCode: '10001',
	//     dateOfBirth: '01/01/1990',
	// };

	const data = req.body;

	try {
		const responseData = await createCheckoutRequest(data);

		if (responseData.cashierSessionToken) {
			res.json({
				sessionToken: responseData.cashierSessionToken,
				orderId: data.orderId,
			});
		} else {
			res.status(500).json({ error: "Failed to create checkout request." });
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const controllerPaytikoWebhook = async (req, res) => {
	const { OrderId, Signature, TransactionStatus } = req.body;

	console.log("Received webhook:", { OrderId, Signature, TransactionStatus });

	// Validate the signature
	const expectedSignature = generateSignatureForPaytikoWebhook(OrderId);
	console.log("Expected Signature:", expectedSignature);

	if (Signature !== expectedSignature || TransactionStatus !== "Success") {
		console.warn("Invalid signature:", Signature);
		return res.status(401).send("Invalid signature");
	}

	try {
		// Save the webhook data to the database in a new collection
		const savedPaytikoTransactionData = await savePaytikoWebhookData(req.body);
		console.log("Webhook data saved:", savedPaytikoTransactionData);

		if (!savedPaytikoTransactionData) {
			console.error("Failed to save transaction data");
			return res.status(400).send("Failed to save transaction data");
		}
		// find the order in the database
		const order = await MOrder.findOne({ orderId: `${OrderId}` });
		console.log("Order retrieved:", order);

		if (!order) {
			console.error("Order not found:", OrderId);
			return res.status(404).send("Order not found");
		}

		// destructure the order data for buyer details, order items, and group also challenge data
		const { buyerDetails, orderItems, group, addOns, platform } = order;
		const challengeData = orderItems[0];

		// Validate if addons is a valid array
		const isValidAddonsArray = Array.isArray(addOns) && addOns.length > 0;

		// Find the user
		const user = await MUser.findOne({ email: buyerDetails?.email });

		// Find the duplicate account
		const duplicateAccount =
			user && user.mt5Accounts.find((account) => account.productId === `${OrderId}`);

		if (duplicateAccount) {
			console.log("Duplicate account found:", duplicateAccount);
			return res.status(404).send(" Duplicate account found");
		} else {
			// prepare data for mt5 account
			const mt5SignUpData = {
				EMail: buyerDetails.email,
				master_pass: generatePassword(),
				investor_pass: generatePassword(),
				amount: challengeData.accountSize,
				FirstName: `Foxx Funded -  ${challengeData.challengeName} ${
					challengeData.challengeType === "funded" ? "funded" : "phase1"
				}  ${buyerDetails.first} ${buyerDetails.last} `,
				LastName: buyerDetails.last,
				Country: buyerDetails.country,
				Address: buyerDetails.addr,
				City: buyerDetails.city,
				ZIPCode: buyerDetails.zipCode,
				Phone: buyerDetails.phone,
				Leverage: challengeData.challengeType === "funded" ? 50 : 100,
				Group: group,
				noStopLoss: false, // Default value
				noConsistency: false, // Default value
				noNewsTrading: false, // Default value
			};

			// Update mt5SignUpData based on addOns array
			if (isValidAddonsArray) {
				mt5SignUpData.noStopLoss = addOns.includes("noStopLoss");
				mt5SignUpData.noConsistency = addOns.includes("noConsistency");
				mt5SignUpData.noNewsTrading = addOns.includes("noNewsTrading");
			}

			console.log("MT5 Sign Up Data:", mt5SignUpData);

			// create mt5 account
			const createUser = await retryAsync(handleMt5AccountCreate, [mt5SignUpData], 5, 3000);
			console.log("MT5 account creation response:", createUser);

			if (createUser?.login) {
				const challengeStage = challengeData.challengeType === "funded" ? "funded" : "phase1";
				const challengeStages = {
					...challengeData.challengeStages,
					phase1: challengeStage === "funded" ? null : challengeData.challengeStages.phase1,
					phase2:
						challengeStage === "funded" || challengeStage === "phase1"
							? null
							: challengeData.challengeStages.phase2,
					funded: challengeStage === "phase1" ? null : challengeData.challengeStages.funded,
				};

				const mt5Data = {
					account: createUser.login,
					investorPassword: createUser.investor_pass,
					masterPassword: createUser.master_pass,
					productId: `${OrderId}`,
					challengeStage,
					challengeStageData: { ...challengeData, challengeStages },
					group: mt5SignUpData.Group,
					noStopLoss: mt5SignUpData.noStopLoss,
					noConsistency: mt5SignUpData.noConsistency,
					noNewsTrading: mt5SignUpData.noNewsTrading,
				};

				console.log("MT5 Data prepared for update:", mt5Data);

				await updateUser(order.buyerDetails?.userId, {
					mt5Accounts: [mt5Data],
				});

				await Promise.all([
					updateOrder(order._id, {
						orderStatus: "Delivered",
						paymentStatus: "Paid",
					}),
					updateUserRole(buyerDetails.email, "trader"),
				]);

				const zapierPayload = {
					Date: new Date().toLocaleDateString("en-US"), // e.g., "4/20/2025"
					OrderId: OrderId,
					Email: buyerDetails?.email,
					Challenge: challengeData.challengeName,
					Amount: order.totalPrice ? order.totalPrice.toString().replace(".", ",") : null,
					PaymentMethod: "Paytiko",
				};

				await sendToZapier(zapierPayload);

				console.log("User roles and order status updated successfully.");
			}
		}
		res.status(200).send("Webhook received successfully");

		// if (platform === mt5Constant) {
		// 	// Find the duplicate account
		// 	const duplicateAccount =
		// 		user && user.mt5Accounts.find((account) => account.productId === `${OrderId}`);

		// 	if (duplicateAccount) {
		// 		console.log("Duplicate account found:", duplicateAccount);
		// 		return res.status(404).send(" Duplicate account found");
		// 	} else {
		// 		// prepare data for mt5 account
		// 		const mt5SignUpData = {
		// 			EMail: buyerDetails.email,
		// 			master_pass: generatePassword(),
		// 			investor_pass: generatePassword(),
		// 			amount: challengeData.accountSize,
		// 			FirstName: `Foxx Funded -  ${challengeData.challengeName} ${
		// 				challengeData.challengeType === "funded" ? "funded" : "phase1"
		// 			}  ${buyerDetails.first} ${buyerDetails.last} `,
		// 			LastName: buyerDetails.last,
		// 			Country: buyerDetails.country,
		// 			Address: buyerDetails.addr,
		// 			City: buyerDetails.city,
		// 			ZIPCode: buyerDetails.zipCode,
		// 			Phone: buyerDetails.phone,
		// 			Leverage: challengeData.challengeType === "funded" ? 50 : 100,
		// 			Group: group,
		// 			noStopLoss: false, // Default value
		// 			noConsistency: false, // Default value
		// 			noNewsTrading: false, // Default value
		// 		};

		// 		// Update mt5SignUpData based on addOns array
		// 		if (isValidAddonsArray) {
		// 			mt5SignUpData.noStopLoss = addOns.includes("noStopLoss");
		// 			mt5SignUpData.noConsistency = addOns.includes("noConsistency");
		// 			mt5SignUpData.noNewsTrading = addOns.includes("noNewsTrading");
		// 		}

		// 		console.log("MT5 Sign Up Data:", mt5SignUpData);

		// 		// create mt5 account
		// 		const createUser = await retryAsync(handleMt5AccountCreate, [mt5SignUpData], 5, 3000);
		// 		console.log("MT5 account creation response:", createUser);

		// 		if (createUser?.login) {
		// 			const challengeStage = challengeData.challengeType === "funded" ? "funded" : "phase1";
		// 			const challengeStages = {
		// 				...challengeData.challengeStages,
		// 				phase1: challengeStage === "funded" ? null : challengeData.challengeStages.phase1,
		// 				phase2:
		// 					challengeStage === "funded" || challengeStage === "phase1"
		// 						? null
		// 						: challengeData.challengeStages.phase2,
		// 				funded: challengeStage === "phase1" ? null : challengeData.challengeStages.funded,
		// 			};

		// 			const mt5Data = {
		// 				account: createUser.login,
		// 				investorPassword: createUser.investor_pass,
		// 				masterPassword: createUser.master_pass,
		// 				productId: `${OrderId}`,
		// 				challengeStage,
		// 				challengeStageData: { ...challengeData, challengeStages },
		// 				group: mt5SignUpData.Group,
		// 				noStopLoss: mt5SignUpData.noStopLoss,
		// 				noConsistency: mt5SignUpData.noConsistency,
		// 				noNewsTrading: mt5SignUpData.noNewsTrading,
		// 			};

		// 			console.log("MT5 Data prepared for update:", mt5Data);

		// 			await updateUser(order.buyerDetails?.userId, {
		// 				mt5Accounts: [mt5Data],
		// 			});

		// 			await Promise.all([
		// 				updateOrder(order._id, {
		// 					orderStatus: "Delivered",
		// 					paymentStatus: "Paid",
		// 				}),
		// 				updateUserRole(buyerDetails.email, "trader"),
		// 			]);

		// 			const zapierPayload = {
		// 				Date: new Date().toLocaleDateString("en-US"), // e.g., "4/20/2025"
		// 				OrderId: OrderId,
		// 				Email: buyerDetails?.email,
		// 				Challenge: challengeData.challengeName,
		// 				Amount: order.totalPrice ? order.totalPrice.toString().replace(".", ",") : null,
		// 				PaymentMethod: "Paytiko",
		// 			};

		// 			await sendToZapier(zapierPayload);

		// 			console.log("User roles and order status updated successfully.");
		// 		}
		// 	}
		// 	res.status(200).send("Webhook received successfully");
		// } else if (platform === matchTraderConstant) {
		// 	// Find the duplicate account for matchTrader
		// 	const duplicateAccount =
		// 		user && user.matchTraderAccounts.find((account) => account.productId === `${OrderId}`);

		// 	if (duplicateAccount) {
		// 		console.log("Duplicate account found:", duplicateAccount);
		// 		return res.status(404).send(" Duplicate account found");
		// 	} else {
		// 		const modifiedEmail = user?.email.toLowerCase();

		// 		const matchTraderSignUpData = {
		// 			email: modifiedEmail,
		// 			password: buyerDetails?.password,
		// 			firstname: buyerDetails?.first,
		// 			lastname: buyerDetails?.last,
		// 			phoneNumber: buyerDetails?.phone || "N/A",
		// 			country: buyerDetails?.country || "N/A",
		// 			city: buyerDetails?.city || "N/A",
		// 			address: buyerDetails?.addr || "N/A",
		// 			postCode: buyerDetails?.zipCode || "N/A",
		// 			offerUuid:
		// 				challengeData.challengeType === "funded"
		// 					? offerUUIDConstants.funded
		// 					: offerUUIDConstants.phase1,
		// 			depositAmount: challengeData?.accountSize,
		// 			noStopLoss: false, // Default value
		// 			noConsistency: false, // Default value
		// 			noNewsTrading: false, // Default value
		// 		};

		// 		// Update matchTraderSignUpData based on addOns array
		// 		if (isValidAddonsArray) {
		// 			matchTraderSignUpData.noStopLoss = addOns.includes("noStopLoss");
		// 			matchTraderSignUpData.noConsistency = addOns.includes("noConsistency");
		// 			matchTraderSignUpData.noNewsTrading = addOns.includes("noNewsTrading");
		// 		}

		// 		const createUser = await retryAsync(
		// 			handleMatchTraderAccountCreate,
		// 			[matchTraderSignUpData],
		// 			3,
		// 			3000
		// 		);

		// 		if (!createUser?.accountDetails?.normalAccount?.uuid) {
		// 			await updateOrder(order?._id, {
		// 				orderStatus: "Processing",
		// 			});
		// 			return;
		// 		}

		// 		if (createUser?.accountDetails?.normalAccount?.uuid) {
		// 			const challengeStage = challengeData.challengeType === "funded" ? "funded" : "phase1";
		// 			const challengeStages = {
		// 				...challengeData.challengeStages,
		// 				phase1: challengeStage === "funded" ? null : challengeData.challengeStages.phase1,
		// 				phase2:
		// 					challengeStage === "funded" || challengeStage === "phase1"
		// 						? null
		// 						: challengeData.challengeStages.phase2,
		// 				funded: challengeStage === "phase1" ? null : challengeData.challengeStages.funded,
		// 			};

		// 			const matchTraderData = {
		// 				account: Number(createUser?.accountDetails?.tradingAccount?.login),
		// 				masterPassword: user.password,
		// 				productId: `${OrderId}`,
		// 				challengeStage,
		// 				challengeStageData: {
		// 					...challengeData,
		// 					challengeStages,
		// 				},
		// 				offerUUID: createUser.accountDetails.tradingAccount.offerUuid,
		// 				noStopLoss: matchTraderSignUpData.noStopLoss,
		// 				noConsistency: matchTraderSignUpData.noConsistency,
		// 				noNewsTrading: matchTraderSignUpData.noNewsTrading,
		// 			};

		// 			console.log("Match Trader Data prepared for update:", matchTraderData);

		// 			await updateUser(order.buyerDetails?.userId, {
		// 				matchTraderAccounts: [matchTraderData],
		// 				role: "trader",
		// 			});

		// 			await Promise.all([
		// 				updateOrder(order._id, {
		// 					orderStatus: "Delivered",
		// 					paymentStatus: "Paid",
		// 				}),
		// 			]);

		// 			const zapierPayload = {
		// 				Date: new Date().toLocaleDateString("en-US"), // e.g., "4/20/2025"
		// 				OrderId: OrderId,
		// 				Email: buyerDetails?.email,
		// 				Challenge: challengeData.challengeName,
		// 				Amount: order.totalPrice ? order.totalPrice.toString().replace(".", ",") : null,
		// 				PaymentMethod: "Paytiko",
		// 			};

		// 			await sendToZapier(zapierPayload);

		// 			console.log("User roles and order status updated successfully.");
		// 		}
		// 	}
		// }
	} catch (error) {
		console.error("Error processing webhook:", error);
		res.status(500).send("Internal Server Error");
	}
};

module.exports = { startCheckout, controllerPaytikoWebhook };
