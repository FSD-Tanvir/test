const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  kind: {
    type: String,
    required: true,
  },
  fileId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/ // Basic email validation
  },
  account: {
    type: String,
    required: true,
  }, 
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'], // Enum for status field
    required: true,
    default: 'pending' // Optional: Set default status
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const MContract = mongoose.model('contract', fileSchema);

module.exports = MContract;
