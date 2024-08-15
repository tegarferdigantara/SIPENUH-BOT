const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const path = require("path");
const fs = require("fs");

const logsPath = path.join(__dirname, "../logs");
const chatbotLogPath = path.join(logsPath, "chatbot");
const webhookLogPath = path.join(logsPath, "webhook");

[logsPath, chatbotLogPath, webhookLogPath].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const createLogger = (name, logPath) => {
  // Info Transport
  const infoTransport = new DailyRotateFile({
    filename: `${logPath}/info-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.prettyPrint(),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message}`;
      })
    ),
  });

  // Error Transport
  const errorTransport = new DailyRotateFile({
    filename: `${logPath}/error/error-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    level: "error",
    format: winston.format.combine(
      winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      winston.format.prettyPrint()
    ),
  });

  return winston.createLogger({
    level: "info",
    transports: [
      infoTransport,
      errorTransport,
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          winston.format.prettyPrint(),
          winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}] ${name.toUpperCase()}: ${message}`;
          })
        ),
      }),
    ],
  });
};

const chatbotLogger = createLogger("chatbot", chatbotLogPath);
const webhookLogger = createLogger("webhook", webhookLogPath);

module.exports = { chatbotLogger, webhookLogger };
