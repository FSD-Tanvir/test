const fetch = require('node-fetch');
const config = require("../config/config");

const requestSendToCryptoCloud = async(invoiceData) => {

  const headers = config.cryHeaders;

  const {amount, email, Id} = invoiceData;

  //console.log(config.cryHeaders, "line 6 cryptoCloud.js")// 🔥🔥🔥🔥🔥debugging purpose console only

  //console.log(invoiceData, "line number 8 cryptoCloud.js");//🔥🔥🔥🔥🔥debugging purpose console only

  const body = {
    amount, 
    email,
    shop_id:config.shop_id,
    currency:"USD",
    order_id: Id,
    locale:"en"
  }

  //console.log(body, "crypto.js line 23")  //🔥🔥🔥🔥🔥debugging purpose console only

    const response = await fetch(`${config.cry_base_url}/invoice/create`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    })
    
    const data = await response.json();
    //console.log(data, "line 32 crypto.js") //🔥🔥🔥🔥🔥debugging purpose console only
    return data;
}

module.exports = { requestSendToCryptoCloud };