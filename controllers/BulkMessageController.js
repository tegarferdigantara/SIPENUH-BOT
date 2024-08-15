const { webhookLogger } = require("../utils/logger");

class BulkMessageController {
  constructor() {
    this.client = null;
  }

  setClient(client) {
    this.client = client;
  }

  async sendBulkMessage(req, res) {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    res.status(200).json({
      success: true,
      message: `${messages.length} pesan berhasil di antrikan untuk dikirim.`,
    });

    // Proses pengiriman pesan setelah response dikirim
    this.processBulkMessages(messages, req);
  }

  async processBulkMessages(messages, req) {
    for (const msg of messages) {
      await this.sendMessageWithDelay(msg, req);
    }
  }

  async sendMessageWithDelay(msg, req) {
    const delayTime = msg.delay ?? 15;
    const delay = delayTime * 1000; // Konversi detik ke milidetik

    try {
      // Kirim pesan
      await this.client.sendMessage(msg.to, msg.message);
      webhookLogger.info(
        `Message sent to ${msg.to} [Request IP: ${[
          req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        ]}]`
      );

      // Tunggu sesuai delay yang ditentukan
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      webhookLogger.error(
        `Failed to send message to ${msg.to}: ${error.message} [Request IP: ${[
          req.headers["x-forwarded-for"] || req.connection.remoteAddress,
        ]}]`
      );
    }
  }
}

module.exports = BulkMessageController;
