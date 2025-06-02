const { google } = require("googleapis");
const fs = require("node:fs");
const config = require("../../config/config");
const {
	uploadContractServices,
	updateContractStatus,
	getAllContractServicesWithEmail,
} = require("./contract.services");
const MContract = require("./contract.schema");

const auth = new google.auth.GoogleAuth({
	keyFile: path.join(__dirname, "./service-account-key.json"),
	scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({
	version: "v3",
	auth: auth,
});

const uploadContractController = async (req, res) => {
	try {
		const { email, account } = req.body;
		const filePath = req.file.path;

		const response = await drive.files.create({
			requestBody: {
				name: req.file.originalname,
				mimeType: req.file.mimetype,
				parents: ["1YOf2VI7mcIX-bjtKIodAZ2KJrzG0-b1U"], // Optional: upload to a specific folder(will save the contracts in specific folder)
			},
			media: {
				mimeType: req.file.mimetype,
				body: fs.createReadStream(filePath),
			},
		});

		// Optionally delete the local file
		fs.unlinkSync(filePath);

		// Save data to the database
		const fileData = {
			email,
			account,
			kind: response?.data?.kind,
			fileId: response?.data?.id,
			name: response?.data?.name,
			mimeType: response?.data?.mimeType,
		};

		const file = await uploadContractServices(fileData);

		res.json(file);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const generateURLContractController = async (req, res) => {
	try {
		const { fileId } = req.body;
		await drive.permissions.create({
			fileId: fileId,
			requestBody: {
				role: "reader",
				type: "anyone",
			},
		});

		const result = await drive.files.get({
			fileId: fileId,
			fields: "webViewLink, webContentLink",
		});
		console.log(result, "result");
		res.status(200).json(result.data);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const getAllContractController = async (req, res) => {
	try {
		const contracts = await MContract.find();
		res.status(200).json(contracts);
	} catch (err) {
		res.status(500).json({ error: "Failed to retrieve contracts" });
	}
};

const updateStatus = async (req, res) => {
	try {
		const { fileId } = req.params;
		const { status } = req.body;

		const updatedContract = await updateContractStatus(fileId, status);

		return res.status(200).json({
			message: "Status updated successfully",
			contract: updatedContract,
		});
	} catch (error) {
		return res.status(400).json({
			message: error.message,
		});
	}
};

const getAllContractControllerWithEmail = async (req, res) => {
	try {
		const { email } = req.params;
		const result = await getAllContractServicesWithEmail(email);
		// const contracts = await MContract.find({ email });
		res.status(200).json(result);
	} catch (err) {
		res.status(500).json({ error: "Failed to retrieve contracts" });
	}
};

const getSingleContractController = async (req, res) => {
	try {
		const { account } = req.params;
		const contract = await MContract.findOne({ account });
		res.status(200).json(contract);
	} catch (err) {
		res.status(500).json({ error: "Failed to retrieve contract" });
	}
};

const deleteSingleContractController = async (req, res) => {
	try {
		const { account } = req.params;
		await MContract.findOneAndDelete({ account });
		res.status(200).json({
			message: "Contract deleted successfully",
		});
	} catch (err) {
		res.status(500).json({ error: "Failed to delete contract" });
	}
};

module.exports = {
	uploadContractController,
	generateURLContractController,
	getAllContractController,
	updateStatus,
	getAllContractControllerWithEmail,
	getSingleContractController,
	deleteSingleContractController,
};
