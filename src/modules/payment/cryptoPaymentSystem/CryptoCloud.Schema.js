const mongoose = require('mongoose');
const config = require('../../../config/config');

const cryptoCloudSchema = new mongoose.Schema({
  shop_id: {
    type: String,
    default: config.shop_id
  },
  amount: {
    type: Number,
    required: true
  },
  challengeName: {
    type: String,
    required: true
  },
  Id: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  }
},{
    timestamps:true
}
);

const MCryptoCloudInvoice = mongoose.model('cryptoCloudInvoice', cryptoCloudSchema);

module.exports = MCryptoCloudInvoice;
