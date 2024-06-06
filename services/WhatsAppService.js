const { Client, LocalAuth, Location } = require("whatsapp-web.js");
const { delete: axiosDelete } = require("axios");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const MessageController = require("../controllers/MessageController");
const BulkMessageController = require("../controllers/BulkMessageController");
const fs = require("fs");
const colors = require("colors");
const cron = require("node-cron");
const appName = process.env.APP_NAME;
const timeZone = process.env.TIME_ZONE;

class WhatsAppService {
  constructor() {
    this.client = new Client({
      restartOnAuthFail: true,
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
      webVersionCache: {
        type: "remote",
        remotePath:
          "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
      },
      authStrategy: new LocalAuth({ clientId: "client" }),
    });

    this.userStatus = {};

    this.bulkMessageController = new BulkMessageController();
    this.bulkMessageController.setClient(this.client);

    this.client.on("qr", this.onQrReceived.bind(this));
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("message", this.onMessageReceived.bind(this));

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
    console.clear();
    const consoleText = "./config/console.txt";

    fs.readFile(consoleText, "utf-8", (err, data) => {
      const timestamp = `[${moment().tz(timeZone).format("HH:mm:ss")}]`;

      if (err) {
        console.log(`${timestamp} Console Text not found!`.red);
      } else {
        console.log(data.yellow);
      }

      console.log(`${timestamp} ${appName} is Running!`.white);
    });
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
          consumer_photo: false,
          id_photo: false,
          family_card_photo: false,
          passport_photo: false,
          birth_certificate_photo: false,
        },
        photoUrls: {
          consumer_photo: null,
          id_photo: null,
          family_card_photo: null,
          passport_photo: null,
          birth_certificate_photo: null,
        },
        timestamp: moment(), // Add timestamp for the received message
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
    const urlApi = process.env.URL_API; // Atur URL API dari environment variable
    const apiKey = process.env.CHATBOT_API_KEY; //  Atur API key dari environment variable
    const time = 1;

    for (const userNumber of Object.keys(this.userStatus)) {
      const userData = this.userStatus[userNumber];

      if (now.diff(userData.timestamp, "minutes") > time) {
        // Store the registration number before deleting the user data
        const registrationNumber =
          this.userStatus[userNumber].registrationNumber;

        delete this.userStatus[userNumber];

        try {
          const response = await axiosDelete(
            `${urlApi}/register/${registrationNumber}`,
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
Jika Anda ingin melanjutkan pendaftaran, silakan mulai prosesnya dari awal.

Terima kasih.`
            );

            console.log(
              `User data for ${userNumber} has been cleared due to inactivity.`
            );
            console.log("Current user status data:");
            console.log(JSON.stringify(this.userStatus, null, 2));
          }
        } catch (error) {
          console.error(
            `Failed to delete registration for ${userNumber}:`,
            error.message
          );
        }
      }
    }
  }
}

module.exports = WhatsAppService;
