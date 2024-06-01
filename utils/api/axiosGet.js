const { get } = require("axios");

async function axiosGet(url, apiKey) {
  try {
    const response = await get(url, {
      headers: {
        Authorization: apiKey,
      },
    });
    return response.data;
  } catch (error) {
    console.error("axiosGet error fetching data:", error);
    throw error;
  }
}

module.exports = axiosGet;
