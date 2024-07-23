require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const WhatsAppService = require("./services/WhatsAppService");
const apiRoutes = require("./api");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

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
  console.log(`Server is running on port ${port}`);
});
