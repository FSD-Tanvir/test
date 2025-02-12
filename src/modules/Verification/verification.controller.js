const {
  removeIds,
  resolveNestedPromises,
} = require("../../helper/cleanerFunctionVeriff");
const MVeriffModel = require("./verification.schema");
const {
  createVeriffSessionService,
  saveDecision,
  saveEvent,
  verifiedUser,
} = require("./verification.services");

const createVeriffSessionController = async (req, res) => {
  // console.log(req.body)
  try {
    // Validate the request body against the Mongoose schema
    const verificationData = await MVeriffModel.create(req.body);
    const documentId = verificationData._id;
    // const projectedData = await MVeriffModel.findById(documentId).select('-person.email').exec();
    const projectedData = await MVeriffModel.findById(documentId)
      .select("-person.email -person.sessionId")
      .exec();
    const plainData = projectedData.toObject();
    const resolvedData = await resolveNestedPromises(plainData);
    // Remove the _id field from the object
    const clearData = await removeIds(resolvedData);
    // Call the service to create a Veriff session
    const response = await createVeriffSessionService(clearData);
    //Find and update the document with the sessionId
    await MVeriffModel.findByIdAndUpdate(documentId, {
      "person.sessionId": response.verification.id,
    });

    // Send the response back to the client
    res.status(201).json(response);
  } catch (error) {
    // Handle validation or service errors
    res.status(400).json({ error: error.message });
  }
};

const handleVeriffWebhook = async (req, res) => {
  console.log("handleVeriffWebhook-decision-controller", req.body);

  try {
    const decisionData = req.body;
    const savedDecision = await saveDecision(decisionData);
    res.status(201).json(savedDecision);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const handleEventWebhook = async (req, res) => {
  console.log("handleEventWebhook- handleEvent-controller", req.body);
  try {
    const eventData = req.body;
    const savedEvent = await saveEvent(eventData);
    res
      .status(200)
      .json({ message: "Webhook event received", event: savedEvent });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Failed to process webhook event",
        error: error.message,
      });
  }
};

const verifiedUserController = async (req, res) => {
  const { email } = req.params; // Assuming email is sent in the request body

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  try {
    const result = await verifiedUser(email);

    if (result) {
      return res.status(200).json({
        message: "User verified successfully.",
        data: result,
      });
    } else {
      return res
        .status(404)
        .json({ message: "User not found or not verified." });
    }
  } catch (error) {
    console.error(error); // Log the error for debugging
    return res
      .status(500)
      .json({ message: "Internal server error.", error: error.message });
  }
};

module.exports = {
  createVeriffSessionController,
  handleVeriffWebhook,
  handleEventWebhook,
  verifiedUserController,
};
