const validAuthKey = process.env.CHATBOT_API_KEY;

const checkAuthKey = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization key is missing" });
  }

  const authKey = authHeader.split(" ")[1];

  if (authKey !== validAuthKey) {
    return res.status(403).json({ error: "Invalid authorization key" });
  }

  next();
};

module.exports = checkAuthKey;
