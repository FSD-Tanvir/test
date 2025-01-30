const fetch = require('node-fetch');
const config = require('../config/config');


const url = config.veriff_api_url;
const authClient = config.veriff_auth_client;

const veriffAPI = async (body) => {
    
    const data = {
  verification: body
}
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AUTH-CLIENT': authClient
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = veriffAPI;
