const mongoose = require('mongoose');
const config = require('../../config/config');
const { Schema } = mongoose;

const personSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, select: false },
  sessionId: { type: String, default: "" },
});

const verificationSchema = new Schema({
  callback: { type: String, default: config.veriff_callback_url },
  person: { type: personSchema, required: true },
});

const MVeriffModel = mongoose.model('Veriff', verificationSchema);

module.exports = MVeriffModel;