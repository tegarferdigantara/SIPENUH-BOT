const { webhookLogger } = require("../utils/logger");

const validAuthKey = process.env.CHATBOT_API_KEY;

const checkAuthKey = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    webhookLogger.error(
      `Authorization key is missing [Request IP: ${
        req.headers["x-forwarded-for"] || req.connection.remoteAddress
      }]`
    );
    return res.status(401).json({ error: "Authorization key is missing" });
  }

  const authKey = authHeader.split(" ")[1];

  if (authKey !== validAuthKey) {
    webhookLogger.error(
      `Invalid authorization key [Request IP: ${
        req.headers["x-forwarded-for"] || req.connection.remoteAddress
      }]`
    );
    return res.status(403).json({ error: "Invalid authorization key" });
  }

  next();
};

module.exports = checkAuthKey;
