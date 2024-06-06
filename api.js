const express = require("express");
const router = express.Router();
const BulkMessageController = require("./controllers/BulkMessageController");
const checkAuthKey = require("./middleware/authMiddleware");

const bulkMessageController = new BulkMessageController();

router.post("/send-bulk", checkAuthKey, (req, res) => {
  // Set the client from the request object
  bulkMessageController.setClient(req.whatsappClient);
  bulkMessageController.sendBulkMessage(req, res);
});

module.exports = router;
