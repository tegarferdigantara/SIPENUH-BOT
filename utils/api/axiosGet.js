const { get } = require("axios");
const { chatbotLogger } = require("../logger");

async function axiosGet(url, apiKey) {
  try {
    const response = await get(url, {
      headers: {
        Authorization: apiKey,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response.status === 401) {
      chatbotLogger.error(
        "axiosGet error. Unauthorized access (Invalid API Key)",
        error.response.data
      );
    } else {
      chatbotLogger.error("axiosGet error fetching data:", error.response.data);
    }
  }
}

module.exports = axiosGet;
