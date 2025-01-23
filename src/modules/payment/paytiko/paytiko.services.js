// src/services/paytiko.services.js
const fetch = require('node-fetch');
const { generateSignature } = require('../../../helper/paytiko');
const config = require('../../../config/config');
const MPaytikoWebhook = require('./paytiko.schema');

const merchantSecret = config.paytiko_api_secret;
const merchantId = config.paytiko_merchant;
const apiUrl = config.paytiko_api_url;


const createCheckoutRequest = async (data) => {
    const timestamp = Math.floor(Date.now() / 1000);
    
    const requestData = {
        ...data,
        timestamp,
        signature: generateSignature(data.email, timestamp),
        isPayOut: false,
    };

    const headers = {
        'X-Merchant-Secret': merchantSecret,
        'X-Merchant-Id': merchantId,
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': 'application/json; charset=utf-8',
        'User-Agent': 'PaytikoSDK'
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData),
        });

        const responseData = await response.json();
        return responseData;
    } catch (error) {
        throw new Error(`Error in checkout request: ${error.message}`);
    }
};


const savePaytikoWebhookData = async (webhookData) => {


    const data = {
      orderId: webhookData.OrderId,
      accountId: webhookData.AccountId,
      accountDetails: {
        merchantId: webhookData.MerchantId,
        createdDate: webhookData.CreatedDate,
        firstName: webhookData.FirstName,
        lastName: webhookData.LastName,
        email: webhookData.Email,
        currency: webhookData.Currency,
        country: webhookData.Country,
        dob: webhookData.Dob,
        city: webhookData.City,
        zipCode: webhookData.ZipCode,
        region: webhookData.Region,
        street: webhookData.Street,
        phone: webhookData.String,
        },
      transactionType: webhookData.TransactionType,
      transactionStatus: webhookData.TransactionStatus,
        amount: webhookData.Amount,
        currency: webhookData.Currency,
        transactionId: webhookData.TransactionId,
        externalTransactionId: webhookData.ExternalTransactionId,
        paymentProcessor: webhookData.PaymentProcessor,
        paymentProcessorId: webhookData.PaymentProcessorId,
        declineReasonText: webhookData.DeclineReasonText,
        cardType: webhookData.CardType,
        cascadingInfo: webhookData.CascadingInfo,
        issueDate: webhookData.IssueDate,
        internalPspId: webhookData.InternalPspId,
        maskedPan: webhookData.MaskedPan,
        signature: webhookData.Signature
     
    };
    
    const webhook = new MPaytikoWebhook(data);
  return await webhook.save();
};

module.exports = { createCheckoutRequest, savePaytikoWebhookData };
