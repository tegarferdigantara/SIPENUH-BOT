const { Client, LocalAuth, Location } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const MessageController = require("../controllers/MessageController");
const fs = require("fs");
const colors = require("colors");
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

    this.client.on("qr", this.onQrReceived.bind(this));
    this.client.on("ready", this.onReady.bind(this));
    this.client.on("message", this.onMessageReceived.bind(this));
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
        price: null,
        passportNumber: null,
        idNumber: null,
        registrationNumber: null,
        customerServiceNumber: null,
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
      };
    }

    const messageController = new MessageController(
      this.client,
      userNumber,
      this.userStatus
    );
    await messageController.handleMessage(message);
  }
}

module.exports = WhatsAppService;
