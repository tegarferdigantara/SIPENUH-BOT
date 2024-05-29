const axios = require("axios");

async function axiosGet(url, apiKey) {
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

module.exports = axiosGet;
