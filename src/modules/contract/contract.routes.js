const express = require("express");
const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');

const router = express.Router();

const { uploadContractController, generateURLContractController, getAllContractController,updateStatus, getAllContractControllerWithEmail, getSingleContractController, deleteSingleContractController } = require("./contract.controller");


// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../../src/modules/contract/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const upload = multer({ dest: uploadDir });


router.post('/uploads', upload.single('file'), uploadContractController);

router.post('/generate-public-url', generateURLContractController);

// only for admin


router.put('/:fileId/status', updateStatus)

router.get('/single/:account', getSingleContractController);
router.delete("/:account", deleteSingleContractController);

router.get('/', getAllContractController);
router.get('/email/:email', getAllContractControllerWithEmail);



module.exports = router;
