const axios = require("axios");

class BulkMessageController {
  constructor() {
    this.client = null; // Client WhatsApp akan diset di luar controller ini
  }

  setClient(client) {
    this.client = client;
  }

  async sendBulkMessage(req, res) {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    try {
      const sendMessagesPromises = messages.map(async (msg) => {
        await this.client.sendMessage(msg.to, msg.message);
      });

      await Promise.all(sendMessagesPromises);

      res
        .status(200)
        .json({ success: true, message: "Messages sent successfully" });
    } catch (error) {
      console.error("Error sending bulk messages:", error);
      res
        .status(500)
        .json({ success: false, error: "Failed to send messages" });
    }
  }
}

module.exports = BulkMessageController;
