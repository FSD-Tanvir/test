const fetch = require('node-fetch');
const config = require("../config/config");

const requestSendToCryptoCloud = async (invoiceData) => {

  const headers = config.cryHeaders;

  const { amount, email, Id } = invoiceData;
  const body = {
    amount,
    email,
    shop_id: config.shop_id,
    currency: "USD",
    order_id: Id,
    locale: "en"
  }

  const response = await fetch(`${config.cry_base_url}/invoice/create`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body)
  })

  const data = await response.json();
  return data;
}

module.exports = { requestSendToCryptoCloud };