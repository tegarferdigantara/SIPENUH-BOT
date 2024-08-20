const { Client, LocalAuth } = require("whatsapp-web.js");
const { delete: axiosDelete } = require("axios");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
require("moment/locale/id");
const MessageController = require("../controllers/MessageController");
const BulkMessageController = require("../controllers/BulkMessageController");
const fs = require("fs");
const colors = require("colors");
const cron = require("node-cron");
const errorHandler = require("../utils/errorHandler");
const { chatbotLogger, webhookLogger } = require("../utils/logger");
const { setBotStatus } = require("../utils/botStatus");
class WhatsAppService {
  constructor() {
    this.client = new Client({
      restartOnAuthFail: true,
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--single-process",
          "--no-zygote",
        ],
      },
      authStrategy: new LocalAuth({
        clientId: this.id,
        dataPath: this.sessionPath,
      }),
    });

    this.userStatus = {};

    this.bulkMessageController = new BulkMessageController();
    this.bulkMessageController.setClient(this.client);

    this.client.on("qr", this.onQrReceived.bind(this));
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("message", this.onMessageReceived.bind(this));
    this.client.on("disconnected", this.onDisconnected.bind(this));

    // Setup cron job to clear old user statuses
    cron.schedule("* * * * *", this.clearOldUserStatuses.bind(this));
  }

  initialize() {
    this.client.initialize();
  }

  onQrReceived(qr) {
    console.log(`[${moment().format("HH:mm:ss")}] Scan the QR below : `);
    qrcode.generate(qr, { small: true });
  }

  onReady() {
    setBotStatus(true);
    console.clear();
    const consoleText = "./config/console.txt";

    fs.readFile(consoleText, "utf-8", (err, data) => {
      if (err) {
        chatbotLogger.error("Console Text not found!");
      } else {
        console.log(data.yellow);
      }
      chatbotLogger.info(
        `Running on phone number: ${this.client.info.wid.user || null} `
      );
      webhookLogger.info(`Running on port ${process.env.WEBHOOK_PORT}`);
    });
  }

  onDisconnected(reason) {
    setBotStatus(false);
    chatbotLogger.error(`disconnected: ${reason}`);
    webhookLogger.error(`disconnected: ${reason}`);
  }

  async onMessageReceived(message) {
    const userNumber = message.from;
    if (!this.userStatus[userNumber]) {
      this.userStatus[userNumber] = {
        fullName: null,
        placeOfBirth: null,
        dateOfBirth: null,
        gender: null,
        address: null,
        subdistrict: null,
        city: null,
        province: null,
        profession: null,
        umrahPackageNumber: null,
        passportNumber: null,
        idNumber: null,
        whatsappNumber: null,
        registrationNumber: null,
        registrationId: null,
        documentId: null,
        photoUploadStatus: {
          customer_photo: false,
          id_photo: false,
          family_card_photo: false,
          passport_photo: false,
          birth_certificate_photo: false,
        },
        photoUrls: {
          customer_photo: null,
          id_photo: null,
          family_card_photo: null,
          passport_photo: null,
          birth_certificate_photo: null,
        },
        timestamp: null,
      };
    }

    const messageController = new MessageController(
      this.client,
      userNumber,
      this.userStatus
    );
    await messageController.handleMessage(message);
  }

  async clearOldUserStatuses() {
    const now = moment();
    const urlApi = process.env.URL_API;
    const apiKey = process.env.CHATBOT_API_KEY;
    const time = process.env.TIME_SESSION_RESET || 30;

    for (const userNumber of Object.keys(this.userStatus)) {
      const userData = this.userStatus[userNumber];

      if (
        now.diff(userData.timestamp, "minutes") > time &&
        userData.registrationNumber
      ) {
        const registrationNumber =
          this.userStatus[userNumber].registrationNumber;

        delete this.userStatus[userNumber];

        try {
          const response = await axiosDelete(
            `${urlApi}/api/register/bot/${registrationNumber}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `${apiKey}`,
              },
            }
          );

          if (response.data.data) {
            await this.client.sendMessage(
              userNumber,
              `Halo,
Pendaftaran Anda yang belum selesai telah dihapus oleh sistem karena tidak ada aktivitas selama lebih dari ${time} menit. 
Jika Anda ingin melanjutkan pendaftaran, silakan ketik *!daftar-umrah* dan mulai prosesnya dari awal.

Terima kasih.`
            );
            //check data sementara (devmode)
            chatbotLogger.info(
              `Current user status data: ${JSON.stringify(
                this.userStatus,
                null,
                2
              )}`
            );

            chatbotLogger.info(
              `User data for ${userNumber} has been cleared due to inactivity. [END REGISTRATION SESSION]`
            );
          }
        } catch (error) {
          await errorHandler(
            "clearOldUserStatuses",
            error,
            this.client,
            this.userNumber
          );
        }
      }
    }
  }
}

module.exports = WhatsAppService;
