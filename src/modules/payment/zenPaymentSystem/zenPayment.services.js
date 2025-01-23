const fetch = require("node-fetch");
const config = require("../../../config/config");
const { ZenpayCallbackResponseSave } = require("./zenPayment.schema");

const callZenPayAPI = async (type, bcode, hkey) => {
  const url = `${config.zenPayBaseUrl}?type=${type}&bcode=${bcode}&hkey=${hkey}`;

  console.log("I am in callZenPayAPI", type, bcode, hkey);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

const redirectToBankLoginService = async (queries) => {
  console.log("I am in redirectToBankLoginService", queries);

  // Clean the query parameter values by removing semicolons
  const cleanedQueries = Object.keys(queries).reduce((acc, key) => {
    acc[key] = queries[key].replace(/;/g, ""); // Remove semicolons
    return acc;
  }, {});
  const queryString = Object.keys(cleanedQueries)
    .map(
      (key) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(cleanedQueries[key])}`
    )
    .join("&");
  const dynamicURL = `${config.zenpay_bankredirect_url}?${queryString}`;
  console.log("dynamicURL", dynamicURL);
  const decodedURL = decodeURIComponent(dynamicURL);
  console.log("decodedURL", decodedURL);
  return decodedURL;
};

const saveZenpayWebhookData = async (webhookData) => {
  try {
    const data = ({
      rsp_appln_id,
      rsp_billercode,
      rsp_fpxmode,
      rsp_orderid,
      rsp_sessionpayid,
      rsp_amount,
      rsp_trxstatus,
      rst_stcode,
      rsp_bankid,
      rsp_bankname,
      rsp_fpxid,
      rsp_fpxorderno,
      rsp_trxdatetime,
      rsp_process_mode,
      rsp_hash,
    } = webhookData);

    const webhookSaveResponse = new ZenpayCallbackResponseSave(data);
    return await webhookSaveResponse.save();
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

module.exports = {
  callZenPayAPI,
  redirectToBankLoginService,
  saveZenpayWebhookData,
};
