const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullAddress: String,
  parsedAddress: {
    city: String,
    unit: String,
    state: String,
    street: String,
    country: String,
    postcode: String,
    houseNumber: String,
  },
});

const personSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  dateOfBirth: String,
  gender: String,
  nationality: String,
  idNumber: String,
  yearOfBirth: String,
  placeOfBirth: String,
  addresses: [addressSchema],
  occupation: String,
  employer: String,
  foreignerStatus: String,
  extraNames: String,
  pepSanctionMatch: String,
});

const documentSchema = new mongoose.Schema({
  number: String,
  validFrom: String,
  validUntil: String,
  type: String,
  country: String,
  remarks: String,
  state: String,
  placeOfIssue: String,
  firstIssue: String,
  issueNumber: String,
  issuedBy: String,
  nfcValidated: Boolean,
  residencePermitType: String,
  portraitIsVisible: Boolean,
  signatureIsVisible: Boolean,
});

const decisionSchema = new mongoose.Schema({
  status: String,
  verification: {
    id: String,
    vendorData: String,
    endUserId: String,
    status: String,
    code: Number,
    reason: String,
    reasonCode: Number,
    decisionTime: String,
    acceptanceTime: String,
    person: personSchema,
    document: documentSchema,
    additionalVerifiedData: {
      driversLicenseNumber: String,
      driversLicenseCategory: Object,
      driversLicenseCategoryFrom: Object,
      driversLicenseCategoryUntil: Object,
      estimatedAge: Number,
      estimatedGender: Number,
      processNumber: String,
      cpfValidation: Object,
      ineBiometricRegistryValidation: Object,
    },
    riskScore: {
      score: Number,
    },
    riskLabels: [
      {
        label: String,
        category: String,
        sessionIds: [String],
      },
    ],
    biometricAuthentication: {
      matchedSessionId: String,
      matchedSessionEndUserId: String,
      matchedSessionVendorData: String,
      details: Object,
    },
  },
  technicalData: {
    ip: String,
  },
});

const MVeriffDecision = mongoose.model('veriffDecisionStatus', decisionSchema);

module.exports= {MVeriffDecision}