const { sendEmailSingleRecipient } = require("../../../helper/mailing");
const generatePassword = require("../../../helper/utils/generatePasswordForMt5");
const { MOrder } = require("../../orders/orders.schema");
const { updateOrder } = require("../../orders/orders.services");
const MUser = require("../../users/users.schema");
const {
  handleMt5AccountCreate,
  updateUserRole,
  updateUser,
} = require("../../users/users.services");
const {
  createCryptoInvoiceService,
  CryptoCloudNotificationService,
} = require("./cryptoCloud.services");

const createCryptoCloudInvoiceController = async (req, res) => {
  try {
    // console.log(req.body, "crypto controller line number 7"); // 💚💚💚 Debugging purpose console only
    const { amount, Id, email } = req.body;

    if (!amount || !Id || !email) {
      return res.status(400).json({ message: "amount are required" });
    }

    const data = await createCryptoInvoiceService({ amount, Id, email });

    //console.log(data); //🔥🔥🔥🔥🔥debugging purpose console only

    if (data.status === "success") {
      res.status(201).json(data);
    } else {
      res.status(400).json(data);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const CryptoCloudNotificationController = async (req, res) => {
  const { status, invoice_id, amount_crypto, currency, order_id } = req.body;

  try {
    // Pass the data to the service layer
    const result = await CryptoCloudNotificationService({
      status,
      invoice_id,
      amount_crypto,
      currency,
      order_id,
    });

    // Send the appropriate response
    if (result.status === "success") {
      const order = await MOrder.findOne({ orderId: `${result.order_id}` });
      console.log("Order retrieved:", order);

      if (!order) {
        console.error("Order not found:", result.order_id);
        return res.status(404).send("Order not found");
      }

      const { buyerDetails, orderItems, group } = order;
      const challengeData = orderItems[0];

      // Find the user
      const user = await MUser.findOne({ email: buyerDetails?.email });
      console.log("User retrieved:", user);

      // Find the duplicate account
      const duplicateAccount =
        user &&
        (await user.mt5Accounts.find(
          (account) => account.productId === `${order_id}`
        ));

      if (duplicateAccount) {
        console.log("Duplicate account found:", duplicateAccount);
        return res.status(404).send(" Duplicate account found");
      } else {
        const mt5SignUpData = {
          EMail: buyerDetails.email,
          master_pass: generatePassword(),
          investor_pass: generatePassword(),
          amount: challengeData.accountSize,
          FirstName: `summit-strike ${challengeData.challengeName} ${
            challengeData.challengeType === "funded" ? "funded" : "phase1"
          }  ${buyerDetails.first} ${buyerDetails.last} `,
          LastName: buyerDetails.last,
          Country: buyerDetails.country,
          Address: buyerDetails.addr,
          City: buyerDetails.city,
          ZIPCode: buyerDetails.zipCode,
          Phone: buyerDetails.phone,
          Leverage: 30,
          Group: group,
        };

        console.log("MT5 Sign Up Data:", mt5SignUpData);

        const createUser = await handleMt5AccountCreate(mt5SignUpData);
        console.log("MT5 account creation response:", createUser);

        if (createUser?.login) {
          const challengeStage =
            challengeData.challengeType === "funded" ? "funded" : "phase1";
          const challengeStages = {
            ...challengeData.challengeStages,
            phase1:
              challengeStage === "funded"
                ? null
                : challengeData.challengeStages.phase1,
            phase2:
              challengeStage === "funded" || challengeStage === "phase1"
                ? null
                : challengeData.challengeStages.phase2,
            funded:
              challengeStage === "phase1"
                ? null
                : challengeData.challengeStages.funded,
          };

          const mt5Data = {
            account: createUser.login,
            investorPassword: createUser.investor_pass,
            masterPassword: createUser.master_pass,
            productId: `${result.order_id}`,
            challengeStage,
            challengeStageData: { ...challengeData, challengeStages },
            group: mt5SignUpData.Group,
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

          console.log("User roles and order status updated successfully.");
        }
      }
    } else {
      return res.status(403).json({ message: result.message });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
  }
};

module.exports = {
  createCryptoCloudInvoiceController,
  CryptoCloudNotificationController,
};
