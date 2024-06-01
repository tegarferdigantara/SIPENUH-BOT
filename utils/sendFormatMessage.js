const { readFileSync } = require("fs");

async function sendFormatMessage(client, to, filePath) {
  try {
    const message = readFileSync(filePath, "utf8");
    await client.sendMessage(to, message);
  } catch (error) {
    console.error("Failed to send formatted message:", error);
  }
}

module.exports = sendFormatMessage;
