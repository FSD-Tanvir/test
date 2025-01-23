const config = require('../../../config/config');
const { requestSendToCryptoCloud } = require('../../../helper/cryptoCloud');
const MUser = require('../../users/users.schema');
const { MOrder } = require('../../orders/orders.schema');
const MCryptoPaymentNotification = require('./cryptoSuccessFailed.schema');
const MCryptoCloudInvoice = require('./CryptoCloud.Schema');
const jwt = require('jsonwebtoken');


const createCryptoInvoiceService = async (invoiceData) => {
  try {
    const { amount, Id, email } = invoiceData;

    // Ensure you use mongoose.Types.ObjectId to convert string to ObjectId
    // const objectId = new mongoose.Types.ObjectId(Id);
    // const singleChallenge = await MChallenge.findById(Id);
    const order = await MOrder.findOne({ orderId: Id }).exec();
    // console.log(order, "crypto service line number 16");


    if (!order) {
      throw new Error('Order not found');
    }

    //console.log(singleChallenge, "crypto service line number 11"); //❤️❤️❤️ get data Debugging purpose console only
    // const { challenge_price, _id } = singleChallenge;

    const singleUser = await MUser.findOne({ email: email });

    /*
    save data in database
    1. make object according to schema
    2. save object
    order?.orderItems[0]?.challengeName
    */
   const cryptoObject = {
    shop_id:config?.shop_id,
    amount,
    challengeName:order?.orderItems[0]?.challengeName,
    Id,
    email,
   }
   const cryptoInvoice = new MCryptoCloudInvoice(cryptoObject);
   await cryptoInvoice.save();

    if (!singleUser) {
      throw new Error('User not found');
    }

    //console.log(singleUser, "line number 28 crypto service"); //🔥🔥🔥 get data in this line Debugging purpose console only
    // challenge_price === amount
    if (amount) {
      const response = await requestSendToCryptoCloud({amount, email, Id});
      //console.log(response, "line 32 cryptoCloud service.js") //🔥🔥🔥🔥🔥debugging purpose console only

      if (response.status==="success") {
        return response;
        // throw new Error(`Error creating invoice: ${response.statusText}`);
      }
    return response;
    // biome-ignore lint/style/noUselessElse: <explanation>
    } else {
      throw new Error('Amount does not match challenge price');
    }
    
  } catch (error) {
    //console.error(error.message); //🔥🔥🔥🔥🔥debugging purpose console only
    // biome-ignore lint/complexity/noUselessCatch: <explanation>
        throw error; // Re-throw the error to ensure it's handled by the caller
  }
};


const CryptoCloudNotificationService = async (paymentData) => {
    const { status, invoice_id, amount_crypto, currency, order_id } = paymentData;

    try {
        // Verify the JWT token
        // const decoded = jwt.verify(token, config.cry_cloud_api_key);

        // Save payment data to MongoDB
        const paymentStatus = new MCryptoPaymentNotification({
            status,
            invoice_id,
            amount_crypto,
            currency,
            order_id,
        });

        await paymentStatus.save();

        return paymentStatus;
    } catch (error) {
        console.error('Error processing payment:', error.message);
        return { success: false, message: 'Invalid token or database error' };
    }
};


module.exports = { createCryptoInvoiceService, CryptoCloudNotificationService };
