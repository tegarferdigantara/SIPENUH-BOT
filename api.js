const express = require("express");
const router = express.Router();
const BulkMessageController = require("./controllers/BulkMessageController");
const checkAuthKey = require("./middleware/authMiddleware");
const { getBotStatus } = require("./utils/botStatus");

const bulkMessageController = new BulkMessageController();

router.post("/send-message", checkAuthKey, (req, res) => {
  // Set the client from the request object
  bulkMessageController.setClient(req.whatsappClient);
  bulkMessageController.sendBulkMessage(req, res);
});

router.get("/status", checkAuthKey, (req, res) => {
  // Set the client from the request object
  res.json({ status: getBotStatus() });
});

module.exports = router;
