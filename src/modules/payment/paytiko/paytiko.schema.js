const mongoose = require('mongoose');

const cascadingInfoSchema = new mongoose.Schema({
  sessionId: String,
  attemptsVector: [
    {
      paymentSystem: String,
      paymentProcessorId: Number,
      paymentProcessorKey: String,
      declineReason: String,
      externalTransactionId: String,
      internalPspId: String,
      transactionId: Number,
      date: Date,
      status: String
    }
  ]
});

const accountDetailsSchema = new mongoose.Schema({
  merchantId: Number,
  createdDate: Date,
  firstName: String,
  lastName: String,
  email: String,
  currency: String,
  country: String,
  dob: String,
  city: String,
  zipCode: String,
  region: String,
  street: String,
  phone: String
});

const webhookSchema = new mongoose.Schema({
  orderId: String,
  accountId: String,
  accountDetails: accountDetailsSchema,
  transactionType: { type: String, enum: ['PayIn', 'PayOut', 'Refund'] },// PayIn, PayOut, Refund
  transactionStatus: { type: String, enum: ['Success', 'Failed', 'Rejected'] }, // Success, Failed, Rejected
  amount: Number,
  currency: String,
  transactionId: Number,
  externalTransactionId: String,
  paymentProcessor: String,
  declineReasonText: String, // Nullable
  cardType: { type: String, enum: ['Visa', 'MasterCard', 'AMEX', 'JCB', 'UnionPayChina', 'Discover', 'DinersClub', 'MIR', 'None'] }, 
  cascadingInfo: cascadingInfoSchema,
  issueDate: Date,
  internalPspId: String,
  maskedPan: String,
  signature: String
});

const MPaytikoWebhook = mongoose.model('PaytikoWebhook', webhookSchema);

module.exports = MPaytikoWebhook;

//! WEBHOOK RESPONSE DATA EXAMPLE
// Action: 'TRANSACTION_DATA_UPDATE',
// ActionId: '32b71713-ec00-4091-91d9-db497e8a0bf5',
// OrganizationId: 896,
// OrderId: '#325585',
// AccountId: 'zentexx2023@gmail.com-USD',
// AccountDetails: {
//   MerchantId: 21025,
//   CreatedDate: '2024-08-22T12:52:19.03666+00:00',
//   FirstName: 'tuni',
//   LastName: 'tuni',
//   Email: 'zentexx2023@gmail.com',
//   Country: 'MY',
//   Dob: '2000-01-07T00:00:00+00:00',
//   City: 'kedonng',
//   ZipCode: '4646212',
//   Region: 'ASI',
//   Street: 'ha',
//   Currency: 'USD'
// },
// MerchantOrderId: '#325585',
// BinType: null,
// UsdAmount: 3.31,
// TransactionType: 'PayIn',
// TransactionStatus: 'Success',
// Amount: 3.31,
// Currency: 'USD',
// TransactionId: 1710114,
// ExternalTransactionId: '63863378129419971711',
// PaymentProcessor: 'PayPal Card',
// PaymentProcessorId: 41042,
// DeclineReasonText: null,
// CardType: null,
// LastCcDigits: null,
// CascadingInfo: null,
// IssueDate: '2024-10-01T11:16:10.5262279Z',
// ClientIP: '60.49.69.224, 172.31.22.127',
// EncryptedGatewayData: null,
// CreditCardDigest: null,
// CreditCardCountry: null,
// PaymentProcessorTitleForSync: 'PayPal Card',
// CrmPaymentType: 0,
// PlanKey: null,
// Signature: 'd30b46cec1547c197b6fe1b663cda4b462bd21572838c93c2703d8e988c2f001',
// CardIssuer: null,
// DeclineReasonCode: null,
// InternalPspId: '4NB19481TS429831A'
// }