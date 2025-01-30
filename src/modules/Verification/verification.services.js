const veriffAPI = require("../../helper/veriff");
const { MVeriffDecision } = require("./verification.decision.schema");
const MVeriffModel = require("./verification.schema");
const { MWebhookEvent } = require("./verification.webhookEvent.schema");

const createVeriffSessionService = async (data) => {
	try {
		const response = await veriffAPI(data);
		console.log(response, "line 8 verification.services");
		return response;
	} catch (error) {
		throw new Error(error.message);
	}
};

const saveDecision = async (decisionData) => {
	console.log(decisionData, "line 17 verification.services");
	const decision = new MVeriffDecision(decisionData);
	return await decision.save();
};

const saveEvent = async (eventData) => {
	try {
		const event = new MWebhookEvent(eventData);
		await event.save();
		return event;
	} catch (error) {
		throw new Error("Error saving webhook event");
	}
};

//get verified user by email
const verifiedUser = async (email) => {
	try {
		// Fetch users based on the provided email
		const userSessions = await MVeriffModel.find({
			"person.email": email,
		});

		// Return null if no userSessions found
		if (!userSessions || userSessions.length === 0) {
			return null;
		}

		// Loop through each user found
		for (const user of userSessions) {
			const sessionId = user?.person?.sessionId;

			// Skip this user if sessionId does not exist
			if (!sessionId) continue;

			// Fetch the verification decision for the sessionId
			const decision = await MVeriffDecision.findOne({
				"verification.id": sessionId,
			});

			// Check if decision exists and meets the success and approved criteria
			if (
				decision?.status === "success" &&
				decision?.verification?.status === "approved"
			) {
				return { user, decision };
			}
		}

		// Return null if no user meets the criteria
		return null;
	} catch (error) {
		console.error("Error fetching verified user:", error.message);
		throw new Error(`Error fetching verified user: ${error.message}`);
	}
};

module.exports = {
	createVeriffSessionService,
	saveDecision,
	saveEvent,
	verifiedUser,
};
