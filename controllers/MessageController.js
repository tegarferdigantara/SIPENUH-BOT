const { post, patch, delete: axiosDelete } = require("axios");
const moment = require("moment");
require("moment/locale/id");
const { writeFile } = require("fs");
const sendFormatMessage = require("../utils/sendFormatMessage");
const axiosGet = require("../utils/api/axiosGet");
const {
  extractPhotoTypeFromCaption,
  extractPhotoTypeFromText,
} = require("../utils/photoTypeExtractor");
const {
  uploadPhoto,
  getNextPhotoType,
} = require("../utils/api/photoUploadStatus");
const {
  outroRegistrationResponse,
} = require("../utils/api/outroRegistrationResponse");
const errorHandler = require("../utils/errorHandler");
const { chatbotLogger } = require("../utils/logger");
const htmlTagConversion = require("../utils/htmlTagConversion");
const NodeCache = require("node-cache");
const urlApi = process.env.URL_API;
const apiKey = process.env.CHATBOT_API_KEY;
const timeSession = process.env.TIME_SESSION_RESET * 60;

const sessionCache = new NodeCache({ stdTTL: timeSession, checkperiod: 120 });

class MessageController {
  constructor(client, userNumber, userStatus) {
    this.client = client;
    this.userNumber = userNumber;
    this.userStatus = userStatus;
  }

  async handleMessage(message) {
    try {
      const isExistingSession = sessionCache.has(message.from);

      if (!isExistingSession) {
        console.log(
          `No session found for ${message.from}. Creating new session.`
        );
        chatbotLogger.info(
          `${message.from} action: Start [NEW WHATSAPP NUMBER]`
        );
        await this.handleStart(message);
        sessionCache.set(message.from, { startTime: Date.now() });
        this.logSessions();
      } else {
        chatbotLogger.info(`Existing session found for ${message.from}`);
        const lowerCaseBody = message.body.toLowerCase();

        switch (true) {
          case lowerCaseBody === "!start":
            chatbotLogger.info(`${message.from} action: Start`);
            await this.handleStart(message);
            break;
          case lowerCaseBody === "!daftar-umrah":
            chatbotLogger.info(`${message.from} action: Registration Start`);
            await this.handleRegistrationStart(message);
            break;
          case lowerCaseBody.startsWith("!batal-umrah"):
            chatbotLogger.info(`${message.from} action: Cancel Registration`);
            await this.handleCancelRegistration(message);
            break;
          case message.body.includes("[Pendaftaran Umrah - Data Diri]"):
            chatbotLogger.info(
              `${message.from} action: Personal Data [START REGISTRATION SESSION]`
            );
            await this.handlePersonalData(message);
            break;
          case message.body.includes("[Pendaftaran Umrah - Nomor Dokumen]"):
            chatbotLogger.info(`${message.from} action: Document Data`);
            await this.handleDocumentData(message);
            break;
          case lowerCaseBody.startsWith("!skip-foto"):
            chatbotLogger.info(`${message.from} action: Skip Photo`);
            await this.handleNoPhoto(message);
            break;
          case message.type === "image":
            chatbotLogger.info(`${message.from} action: Upload Photo`);
            await this.handleImageUpload(message);
            break;
          case lowerCaseBody === "!paket-umrah":
            chatbotLogger.info(`${message.from} action: Umrah Package`);
            await this.handleUmrahPackage(message);
            break;
          case lowerCaseBody.startsWith("!itinerary"):
            chatbotLogger.info(`${message.from} action: Itinerary`);
            await this.handleItineraryUmrahPackage(message);
            break;
          case lowerCaseBody === "!faq":
            chatbotLogger.info(`${message.from} action: FAQ`);
            await this.handleFaq(message);
            break;
          case lowerCaseBody === "!bantuan":
            chatbotLogger.info(`${message.from} action: Customer Service`);
            await this.handleCustomerService(message);
            break;
          default:
            chatbotLogger.info(`${message.from} action: Unknown Command`);
            await this.handleUnknownCommand(message);
            break;
        }
      }

      if (isExistingSession) {
        sessionCache.ttl(message.from, timeSession); // Reset TTL to 30 minutes
      }
    } catch (error) {
      console.error(`Error handling message from ${message.from}:`, error);
      chatbotLogger.error(
        `Error handling message from ${message.from}: ${error.message}`
      );
    }
  }

  logSessions() {
    const keys = sessionCache.keys();
    keys.forEach((sender) => {
      const session = sessionCache.get(sender);
      if (session) {
        const remainingTime = Math.ceil(
          (sessionCache.getTtl(sender) - Date.now()) / 1000
        );
        chatbotLogger.info(
          `Sender: ${sender}, Remaining Time: ${remainingTime} seconds`
        );
      }
    });
  }

  async handleUnknownCommand(message) {
    await message.reply(
      "Maaf, perintah tidak dikenali. Silakan ketik *!start* untuk melihat daftar perintah yang tersedia."
    );
  }

  async handleStart(message) {
    try {
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/menu/main.txt"
      );
    } catch {
      chatbotLogger.error(`Handle Start: Error ${error}`);
      this.client.sendMessage(
        message.from,
        "Something went wrong. Please contact administrator."
      );
    }
  }

  async handleRegistrationStart(message) {
    try {
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/intro.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/personal-data-form-example.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/personal-data-form.txt"
      );

      const datas = await axiosGet(`${urlApi}/api/umrah-packages`, apiKey);
      const packages = datas.data;

      if (packages.length === 0) {
        this.client.sendMessage(
          message.from,
          "Paket Umrah tidak tersedia saat ini."
        );
        return;
      }

      let messageBody = `🕋 List Paket Umrah Tersedia: \n\n`;

      packages.forEach((paket, index) => {
        messageBody += `${index + 1}. Paket *${paket.name}* (Kode Paket: *${
          paket.id
        }*):\n`;
        messageBody += `- Durasi: *${paket.duration} Hari* \n`;
        messageBody += `- Harga: *${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(paket.price)}*\n`;
        messageBody += `- Tanggal Berangkat: *${moment(paket.departure_date)
          .locale("id")
          .format("DD MMMM YYYY")}*\n`;
        messageBody += `- Kuota Tersisa: *${paket.quota}* \n\n`;
      });

      this.client.sendMessage(message.from, messageBody);
    } catch {
      chatbotLogger.error(`Handle Registration Start: Error ${error}`);
      this.client.sendMessage(
        message.from,
        "Something went wrong. Please contact administrator."
      );
    }
  }

  async handlePersonalData(message) {
    try {
      // Periksa apakah pengguna sudah memiliki pendaftaran yang sedang berlangsung
      if (
        this.userStatus[this.userNumber] &&
        this.userStatus[this.userNumber].registrationId
      ) {
        this.client.sendMessage(
          message.from,
          "Anda sudah memiliki pendaftaran yang sedang berlangsung. Harap selesaikan pendaftaran tersebut sebelum memulai yang baru."
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/doc-number-intro.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/doc-number-form.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/doc-number-outro.txt"
        );
        return;
      }

      const lines = message.body.split("\n");
      const dataInput = {};
      lines.forEach((line) => {
        if (line.includes(":")) {
          const [label, value] = line.split(":");
          const trimmedLabel = label.trim().toLowerCase();
          const trimmedValue = value.trim();
          dataInput[trimmedLabel] = trimmedValue;
        }
      });

      const birthDate = moment(
        dataInput["4. tanggal lahir"],
        "DD MMMM YYYY",
        "id"
      );
      const formatDateId = birthDate.format("YYYY-MM-DD");

      const dataPendaftaran = {
        full_name: dataInput["1. nama lengkap"],
        whatsapp_number_sender: message.from.replace("@c.us", ""),
        gender: dataInput["2. jenis kelamin"],
        birth_place: dataInput["3. tempat lahir"],
        birth_date: formatDateId,
        father_name: dataInput["10. nama ayah"],
        mother_name: dataInput["11. nama ibu"],
        profession: dataInput["5. pekerjaan"],
        address: dataInput["6. alamat"],
        province: dataInput["7. provinsi"],
        city: dataInput["8. kota"],
        subdistrict: dataInput["9. kecamatan"],
        whatsapp_number: dataInput["12. nomor hp (whatsapp)"],
        family_number: dataInput["13. nomor hp keluarga (boleh dikosongkan)"],
        email: dataInput["14. email (boleh dikosongkan)"],
        umrah_package_id: parseInt(dataInput["15. kode paket umrah"]),
      };

      //   console.log("Data Pendaftaran Client Output: ", dataPendaftaran);

      const response = await post(`${urlApi}/api/register`, dataPendaftaran, {
        headers: {
          Authorization: apiKey,
        },
      });

      this.userStatus[this.userNumber].registrationId = response.data.data.id;
      this.userStatus[this.userNumber].fullName = response.data.data.full_name;
      this.userStatus[this.userNumber].placeOfBirth =
        response.data.data.birth_place;
      this.userStatus[this.userNumber].dateOfBirth =
        response.data.data.birth_date;
      this.userStatus[this.userNumber].gender = response.data.data.gender;
      this.userStatus[this.userNumber].address = response.data.data.address;
      this.userStatus[this.userNumber].subdistrict =
        response.data.data.subdistrict;
      this.userStatus[this.userNumber].city = response.data.data.city;
      this.userStatus[this.userNumber].province = response.data.data.province;
      this.userStatus[this.userNumber].profession =
        response.data.data.profession;
      this.userStatus[this.userNumber].whatsappNumber =
        response.data.data.whatsapp_number;
      this.userStatus[this.userNumber].umrahPackageNumber =
        response.data.data.umrah_package_id;
      this.userStatus[this.userNumber].registrationNumber =
        response.data.data.registration_number;
      this.userStatus[this.userNumber].timestamp = moment();

      console.log(
        "Data Pendaftaran Server Output: ",
        this.userStatus[this.userNumber]
      );

      const dataPendaftaranNomorDokumen = {
        customer_id: this.userStatus[this.userNumber].registrationId,
        customer_photo: null,
        passport_number: null,
        passport_photo: null,
        id_number: null,
        id_photo: null,
        birth_certificate_photo: null,
        family_card_photo: null,
        id_number_verification: null,
        passport_number_verification: null,
      };

      const responseNomorDokumen = await post(
        `${urlApi}/api/register/document`,
        dataPendaftaranNomorDokumen,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      console.log("Dokumen Data: ", responseNomorDokumen.data.data);

      this.userStatus[this.userNumber].documentId =
        responseNomorDokumen.data.data.id;

      console.log(
        `Data Temporary Keseluruhan ${this.userNumber}:`,
        this.userStatus[this.userNumber]
      );

      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/doc-number-intro.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/doc-number-form.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/doc-number-outro.txt"
      );
    } catch (error) {
      await errorHandler(
        "handlePersonalData",
        error,
        this.client,
        this.userNumber
      );
    }
  }

  async handleDocumentData(message) {
    try {
      if (
        !this.userStatus[this.userNumber] ||
        !this.userStatus[this.userNumber].registrationId
      ) {
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/warn-personal.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/intro.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/personal-data-form-example.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/personal-data-form.txt"
        );
        return;
      }

      const lines = message.body.split("\n");
      const dataInput = {};
      lines.forEach((line) => {
        if (line.includes(":")) {
          const [label, value] = line.split(":");
          const trimmedLabel = label.trim().toLowerCase(); // Mengubah label menjadi huruf kecil
          const trimmedValue = value.trim().toLowerCase(); // Mengubah nilai menjadi huruf kecil
          dataInput[trimmedLabel] = trimmedValue;
        }
      });

      if (!dataInput["2. nomor ktp (nik)"]) {
        await this.client.sendMessage(
          message.from,
          `Nomor KTP (NIK) Wajib diisi.`
        );
        return;
      }

      const dataPendaftaran = {
        customer_id: this.userStatus[this.userNumber].registrationId,
        customer_photo: null,
        passport_number: dataInput["1. nomor paspor"],
        passport_photo: null,
        id_number: dataInput["2. nomor ktp (nik)"],
        id_photo: null,
        birth_certificate_photo: null,
        family_card_photo: null,
        id_number_verification: `${dataInput["2. nomor ktp (nik)"]}${parseInt(
          this.userStatus[this.userNumber].umrahPackageNumber
        )}`,
        passport_number_verification: `${
          dataInput["1. nomor paspor"]
        }${parseInt(this.userStatus[this.userNumber].umrahPackageNumber)}`,
      };

      const response = await patch(
        `${urlApi}/api/register/document/${
          this.userStatus[this.userNumber].documentId
        }`,
        dataPendaftaran,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      this.userStatus[this.userNumber].passportNumber =
        response.data.data.passport_number;
      this.userStatus[this.userNumber].idNumber = response.data.data.id_number;

      console.log(
        "Data Dokumen Server Output:",
        this.userStatus[this.userNumber]
      );

      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/doc-file-form.txt"
      );
    } catch (error) {
      await errorHandler(
        "handleDocumentData",
        error,
        this.client,
        this.userNumber
      );
    }
  }

  async handleNoPhoto(message) {
    // Periksa apakah pengguna sudah memiliki pendaftaran yang sedang berlangsung
    if (
      !this.userStatus[this.userNumber] ||
      !this.userStatus[this.userNumber].documentId
    ) {
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/warn-number.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/doc-number-intro.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/doc-number-form.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/doc-number-outro.txt"
      );
      return;
    }

    const [command, caption] = message.body.split(" ");

    // Handle jika pesan !skip-foto tidak memiliki caption
    if (!caption) {
      await this.client.sendMessage(
        message.from,
        "Harap sertakan jenis foto yang mau di skip. Contoh: *!skip-foto paspor*"
      );
      return;
    }

    const photoType = extractPhotoTypeFromCaption(caption.toLowerCase());

    if (photoType in this.userStatus[this.userNumber].photoUploadStatus) {
      this.userStatus[this.userNumber].photoUploadStatus[photoType] = true;

      const allPhotosHandled = Object.values(
        this.userStatus[this.userNumber].photoUploadStatus
      ).every((status) => status === true);
      console.log(this.userStatus[this.userNumber]);
      if (allPhotosHandled) {
        await outroRegistrationResponse(
          this.client,
          this.userStatus,
          this.userNumber,
          photoType,
          urlApi,
          apiKey
        );
        delete this.userStatus[this.userNumber];
      } else {
        const nextPhotoType = await getNextPhotoType(
          this.userStatus,
          this.userNumber
        );
        const typeConvert = extractPhotoTypeFromText(photoType);
        const skipMessage = `Anda telah meng-skip *${typeConvert}*. Mohon unggah *${nextPhotoType}* berikutnya.`;
        this.client.sendMessage(message.from, skipMessage);
      }
    } else {
      this.client.sendMessage(
        message.from,
        "Jenis foto tidak valid harus berupa (PNG, JPEG)."
      );
    }
  }

  async handleImageUpload(message) {
    const media = await message.downloadMedia();
    const caption = message.body.toLowerCase();
    const photoType = extractPhotoTypeFromCaption(caption);

    if (
      !this.userStatus[this.userNumber] ||
      !this.userStatus[this.userNumber].documentId
    ) {
      // Kirim pesan hanya jika ada caption
      if (photoType !== null) {
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/warn-number.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/doc-number-intro.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/doc-number-form.txt"
        );
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/doc-number-outro.txt"
        );
      }
      return;
    }

    if (photoType !== null) {
      const fileName = `${message.from}-${photoType}.jpg`;
      const filePath = `media/photos/${fileName}`;
      writeFile(filePath, media.data, "base64", (err) => {
        if (err) {
          chatbotLogger.error(`Gagal menyimpan foto: ${err}`);
        } else {
          uploadPhoto(
            this.client,
            this.userStatus,
            this.userNumber,
            filePath,
            urlApi,
            apiKey,
            photoType
          );
          //set status photo upload => true in whatsappservice.js
          this.userStatus[message.from].photoUploadStatus[photoType] = true;
        }
      });
    } else {
      chatbotLogger.info(
        `${message.from}: Keterangan tidak mencantumkan jenis foto yang dikirim.`
      );
    }
  }

  async handleCancelRegistration(message) {
    const registrationNumber = message.body.split(" ")[1];

    if (!registrationNumber) {
      this.client.sendMessage(
        message.from,
        "Harap sertakan Nomor Registrasi Pendaftaran. \nContoh: *!batal-umrah 2024-1TFLFIWIP*"
      );
      return;
    }

    try {
      const response = await axiosDelete(
        `${urlApi}/api/register/user/${registrationNumber}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `${apiKey}`,
          },
        }
      );

      if (response.data.data) {
        this.client.sendMessage(
          message.from,
          `Pendaftaran Anda dengan Nomor Registrasi ${registrationNumber} telah berhasil dibatalkan.
Seluruh data pribadi Anda terkait pendaftaran ini telah dihapus secara permanen dari database kami.`
        );
      }
    } catch (error) {
      await errorHandler(
        "handleCancelRegistration",
        error,
        this.client,
        this.userNumber
      );
    }
  }

  async handleUmrahPackage(message) {
    try {
      const datas = await axiosGet(`${urlApi}/api/umrah-packages`, apiKey);
      const packages = datas.data;

      let messageBody = `🕋 Selamat Datang di Layanan Paket Umrah Kami! 🕋\n\nMari Memilih Paket Umrah yang Cocok untuk Anda:\n\n`;

      packages.forEach((paket, index) => {
        messageBody += `${index + 1}. ${paket.name} (Kode Paket: ${
          paket.id
        })\n`;
        messageBody += `- Deskripsi: ${paket.description}\n`;
        messageBody += `- Durasi: ${paket.duration} hari\n`;
        messageBody += `- Harga: ${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(paket.price)}\n`;
        messageBody += `- Tanggal Keberangkatan: ${moment(
          paket.departure_date
        ).format("dddd, DD MMMM YYYY")}\n`;
        messageBody += `- Fasilitas: ${htmlTagConversion(paket.facility)}\n`;
        messageBody += `- Tujuan: ${paket.destination}\n`;
        messageBody += `- Kuota: ${paket.quota}\n\n`;
      });

      messageBody += `Untuk melakukan pemesanan anda dapat dengan mudah mengetik *!daftar-umrah*.\n\n`;
      messageBody += `Informasi lebih lanjut hubungi `;

      this.client.sendMessage(message.from, messageBody);
    } catch (error) {
      await errorHandler(
        "handleUmrahPackage",
        error,
        this.client,
        message.from
      );
    }
  }

  async handleItineraryUmrahPackage(message) {
    const umrahPackageNumber = message.body.split(" ")[1];

    if (!umrahPackageNumber) {
      this.client.sendMessage(
        message.from,
        "Harap sertakan ID/Nomor paket. Contoh: *!itinerary 1*"
      );
      return;
    }

    try {
      const datas = await axiosGet(
        `${urlApi}/api/itineraries/${umrahPackageNumber}`,
        apiKey
      );
      const itineraries = datas.data;

      if (!itineraries || itineraries.length === 0) {
        this.client.sendMessage(
          message.from,
          "Itinerary belum tersedia untuk paket ini."
        );
        return;
      }

      const umrahPackageName = itineraries[0].umrah_package_name;
      let messageBody = `*Jadwal Perjalanan/Itinerary untuk Paket ${umrahPackageName} [Kode Paket: ${umrahPackageNumber}]*\n\n`;

      itineraries.forEach((itinerary) => {
        messageBody += `Tanggal: *${moment(itinerary.date).format("LLLL")}*\n`;
        messageBody += `Kegiatan: ${itinerary.title}\n`;
        messageBody += `Aktivitas: ${htmlTagConversion(
          itinerary.activity
        )}\n\n`;
      });

      this.client.sendMessage(message.from, messageBody);
    } catch (error) {
      await errorHandler(
        "handleItineraryUmrahPackage",
        error,
        this.client,
        message.from
      );
    }
  }

  async handleFaq(message) {
    try {
      const datas = await axiosGet(`${urlApi}/api/faq`, apiKey);
      const faqs = datas.data;

      let messageBody = `*Frequently Asked Questions (FAQ)*\n\n`;
      faqs.forEach((faq, index) => {
        messageBody += `${index + 1}. *${faq.question}*\n`;
        messageBody += `- Jawaban: ${htmlTagConversion(faq.answer)}\n\n`;
      });
      this.client.sendMessage(message.from, messageBody);
    } catch (error) {
      chatbotLogger.error(`FAQ tidak tersedia. ${error}`);
      this.client.sendMessage(message.from, "FAQ tidak tersedia.");
    }
  }

  async handleCustomerService(message) {
    try {
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/help-form.txt"
      );
    } catch (error) {
      chatbotLogger.error(`Handle Customer Service: Error ${error}`);
      this.client.sendMessage(
        message.from,
        "Nomor Customer Service tidak tersedia."
      );
    }
  }
}

module.exports = MessageController;
