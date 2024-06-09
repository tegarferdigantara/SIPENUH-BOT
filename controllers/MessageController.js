const { post, patch, delete: axiosDelete } = require("axios");
const moment = require("moment");
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
const { MessageMedia } = require("whatsapp-web.js");

const urlApi = process.env.URL_API;
const apiKey = process.env.CHATBOT_API_KEY;

class MessageController {
  constructor(client, userNumber, userStatus) {
    this.client = client;
    this.userNumber = userNumber;
    this.userStatus = userStatus;
  }

  async handleMessage(message) {
    if (message.body.toLowerCase() == "!start") {
      await this.handleStart(message);
    } else if (message.body.toLowerCase() == "!daftar-umrah") {
      await this.handleRegistrationStart(message);
    } else if (message.body.toLowerCase().startsWith("!batal-umrah")) {
      await this.handleCancelRegistration(message);
    } else if (message.body.includes("[Pendaftaran Umrah - Data Diri]")) {
      await this.handlePersonalData(message);
    } else if (message.body.includes("[Pendaftaran Umrah - Nomor Dokumen]")) {
      await this.handleDocumentData(message);
    } else if (message.body.toLowerCase().startsWith("!skip-foto")) {
      await this.handleNoPhoto(message);
    } else if (message.type == "image") {
      await this.handleImageUpload(message);
    } else if (message.body.toLowerCase() == "!paket-umrah") {
      await this.handleUmrahPackage(message);
    } else if (message.body.toLowerCase().startsWith("!itinerary")) {
      await this.handleItineraryUmrahPackage(message);
    } else if (message.body.toLowerCase() == "!faq") {
      await this.handleFaq(message);
    } else if (message.body.toLowerCase() == "!bantuan") {
      await this.handleCustomerService(message);
    }
  }

  async handleStart(message) {
    try {
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/menu/main.txt"
      );

      // let url =
      //   "http://localhost:8000/storage/photos/Jamaah%20Umrah%20Januari/Tegar%20Ferdigantara/birth_certificate_photo_1717921287.jpg";
      // const media = await MessageMedia.fromUrl(url);
      // await this.client.sendMessage(this.userNumber, media, {
      //   caption: "Test",
      // });
    } catch {
      this.client.sendMessage(message.from, "error");
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

      const datas = await axiosGet(`${urlApi}/umrah-packages`, apiKey);
      const packages = datas.data;

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
        messageBody += `- Tanggal Berangkat: *${moment(paket.depature_date)
          .locale("id")
          .format("DD MMMM YYYY")}*\n`;
        messageBody += `- Kuota Tersisa: *${paket.quota}* \n`;
      });

      this.client.sendMessage(message.from, messageBody);
    } catch {
      this.client.sendMessage(message.from, "error");
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

      console.log(dataPendaftaran);

      const response = await post(`${urlApi}/register`, dataPendaftaran, {
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

      console.log(this.userStatus[this.userNumber]);

      const dataPendaftaranNomorDokumen = {
        consumer_id: this.userStatus[this.userNumber].registrationId,
        consumer_photo: null,
        passport_number: null,
        passport_photo: null,
        id_number: null,
        id_photo: null,
        birth_certificate_photo: null,
        family_card_photo: null,
      };

      const responseNomorDokumen = await post(
        `${urlApi}/register/document`,
        dataPendaftaranNomorDokumen,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      console.log(responseNomorDokumen.data.data);

      this.userStatus[this.userNumber].documentId =
        responseNomorDokumen.data.data.id;

      console.log(this.userStatus);

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
        consumer_id: this.userStatus[this.userNumber].registrationId,
        consumer_photo: null,
        passport_number: dataInput["1. nomor paspor"],
        passport_photo: null,
        id_number: dataInput["2. nomor ktp (nik)"],
        id_photo: null,
        birth_certificate_photo: null,
        family_card_photo: null,
      };

      const response = await patch(
        `${urlApi}/register/document/${
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

      console.log(this.userStatus[this.userNumber]);

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

    const media = await message.downloadMedia();
    const caption = message.body.toLowerCase();

    const photoType = extractPhotoTypeFromCaption(caption);
    if (photoType !== null) {
      const fileName = `${message.from}-${photoType}.jpg`;
      const filePath = `media/photos/${fileName}`;
      writeFile(filePath, media.data, "base64", (err) => {
        if (err) {
          console.error("Gagal menyimpan foto:", err);
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
          this.userStatus[message.from].photoUploadStatus[photoType] = true;
        }
      });
    } else {
      console.log(
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
        `${urlApi}/register/user/${registrationNumber}`,
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
    const datas = await axiosGet(`${urlApi}/umrah-packages`, apiKey);
    const packages = datas.data;

    let messageBody = `🕋 Selamat Datang di Layanan Paket Umrah Kami! 🕋\n\nMari Memilih Paket Umrah yang Cocok untuk Anda:\n\n`;

    packages.forEach((paket, index) => {
      messageBody += `${index + 1}. Paket ${paket.name} (Kode Paket: ${
        paket.id
      })\n`;
      messageBody += `- Deskripsi: ${paket.description}\n`;
      messageBody += `- Durasi: ${paket.duration} hari\n`;
      messageBody += `- Harga: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(paket.price)}\n`;
      messageBody += `- Tanggal Keberangkatan: ${moment(paket.depature_date)
        .locale("id")
        .format("DD MMMM YYYY")}\n`;
      messageBody += `- Fasilitas: ${paket.facility}\n`;
      messageBody += `- Tujuan: ${paket.destination}\n`;
      messageBody += `- Kuota: ${paket.quota}\n`;
    });

    messageBody += `Untuk melakukan pemesanan anda dapat dengan mudah mengetik *!daftar-umrah*.\n\n`;
    messageBody += `Informasi lebih lanjut hubungi `;

    this.client.sendMessage(message.from, messageBody);
  }

  async handleItineraryUmrahPackage(message) {
    const umrahPackageNumber = message.body.split(" ")[1];
    console.log(umrahPackageNumber);

    if (!umrahPackageNumber) {
      this.client.sendMessage(
        message.from,
        "Harap sertakan ID/Nomor paket. Contoh: *!itinerary 1*"
      );
      return;
    }

    try {
      const datas = await axiosGet(
        `${urlApi}/itineraries/${umrahPackageNumber}`,
        apiKey
      );
      const itineraries = datas.data;

      if (itineraries.length === 0) {
        this.client.sendMessage(
          message.from,
          "Itinerary belum tersedia untuk paket ini."
        );
        return;
      }

      let messageBody = `*Itinerary untuk Paket Umrah Nomor ${umrahPackageNumber}*\n\n`;
      itineraries.forEach((itinerary) => {
        messageBody += `Tanggal: *${itinerary.date}*\n`;
        messageBody += `Kegiatan: ${itinerary.activity}\n\n`;
      });

      this.client.sendMessage(message.from, messageBody);
    } catch (error) {
      console.log(error);
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
      const datas = await axiosGet(`${urlApi}/faq`, apiKey);
      const faqs = datas.data;

      let messageBody = `*Frequently Asked Questions (FAQ)*\n\n`;
      faqs.forEach((faq, index) => {
        messageBody += `${index + 1}. *${faq.question}*\n`;
        messageBody += `- Jawaban: ${faq.answer}\n`;
      });
      this.client.sendMessage(message.from, messageBody);
    } catch (error) {
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
      this.client.sendMessage(
        message.from,
        "Nomor Customer Service tidak tersedia."
      );
    }
  }
}

module.exports = MessageController;
