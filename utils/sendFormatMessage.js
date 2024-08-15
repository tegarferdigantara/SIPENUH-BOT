const { readFileSync } = require("fs");
const { chatbotLogger } = require("./logger");

async function sendFormatMessage(client, to, filePath) {
  try {
    const message = readFileSync(filePath, "utf8");
    await client.sendMessage(to, message);
  } catch (error) {
    chatbotLogger.error("Failed to send formatted message:", error);
  }
}

module.exports = sendFormatMessage;
