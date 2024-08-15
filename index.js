require("dotenv").config();
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const WhatsAppService = require("./services/WhatsAppService");
const apiRoutes = require("./api");

const app = express();
const port = process.env.WEBHOOK_PORT || 3500;

app.use(bodyParser.json());
app.use(cors());

// Initialize WhatsAppService
const whatsappService = new WhatsAppService();
whatsappService.initialize();

// Pass the initialized client to the API routes
app.use(
  "/api",
  (req, res, next) => {
    req.whatsappClient = whatsappService.client;
    next();
  },
  apiRoutes
);

app.listen(port, () => {
  console.log(`Initiating Webhook on port ${port}`);
});
