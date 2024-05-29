const axios = require("axios");
const moment = require("moment");
const fs = require("fs");
const FormData = require("form-data");
const sendFormatMessage = require("../utils/sendFormatMessage");
const axiosGet = require("../utils/axiosGet");
const extractPhotoTypeFromCaption = require("../utils/extractPhotoTypeFromCaption");
const urlApi = process.env.URL_API;
const apiKey = process.env.CHATBOT_API_KEY;

class MessageController {
  constructor(client, userId, userStatus) {
    this.client = client;
    this.userId = userId;
    this.userStatus = userStatus;
  }

  async handleMessage(message) {
    if (message.body == "!start") {
      await this.handleStart(message);
    } else if (message.body == "!daftar-umrah") {
      await this.handleRegistrationStart(message);
    } else if (message.body.includes("[Pendaftaran Umrah - Data Diri]")) {
      await this.handlePersonalData(message);
    } else if (message.body.includes("[Pendaftaran Umrah - Nomor Dokumen]")) {
      await this.handleDocumentData(message);
    } else if (message.body.startsWith("!skip-foto")) {
      await this.handleNoPhoto(message);
    } else if (message.type == "image") {
      await this.handleImageUpload(message);
    } else if (message.body == "!paket-umrah") {
      await this.handleUmrahPackage(message);
    } else if (message.body.startsWith("!itinerary")) {
      await this.handleItineraryUmrahPackage(message);
    } else if (message.body == "!faq") {
      await this.handleFaq(message);
    } else if (message.body == "!bantuan") {
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
        "./messages/registration/registration-personal-data-form.txt"
      );

      const datas = await axiosGet(`${urlApi}/umrah-package`, apiKey);
      const packages = datas.data;

      let messageBody = `🕋 List Paket Umrah Tersedia: \n\n`;

      packages.forEach((paket) => {
        messageBody += `*${paket.id}.* Paket *${paket.name}* (${paket.duration} Hari):\n`;
        messageBody += `- Harga: *${new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(paket.price)}*\n`;
        messageBody += `- Tanggal Berangkat: *${moment(
          paket.depature_date
        ).format("DD MMMM YYYY")}*\n`;
      });

      this.client.sendMessage(message.from, messageBody);
    } catch {
      this.client.sendMessage(message.from, "error");
    }
  }

  async handlePersonalData(message) {
    try {
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

      const birthDate = moment(
        dataInput["4. tanggal lahir"],
        "DD MMMM YYYY",
        "id"
      );
      const formatDateId = birthDate.format("YYYY-MM-DD");

      const dataPendaftaran = {
        full_name: dataInput["1. nama lengkap"],
        whatsapp_number: message.from.replace("@c.us", ""),
        gender: dataInput["2. jenis kelamin"],
        birth_place: dataInput["3. tempat lahir"],
        birth_date: formatDateId, // Kirimkan tanggal lahir sebagaimana adanya
        father_name: dataInput["10. nama ayah"],
        mother_name: dataInput["11. nama ibu"],
        profession: dataInput["5. pekerjaan"],
        address: dataInput["6. alamat"],
        province: dataInput["7. provinsi"],
        city: dataInput["8. kota"],
        subdistrict: dataInput["9. kecamatan"],
        family_number: dataInput["12. nomor hp keluarga (boleh dikosongkan)"],
        email: dataInput["13. email (boleh dikosongkan)"],
        umrah_package_id: parseInt(
          dataInput["14. pilih nomor paket umrah dibawah ini (cth isi = 1)"]
        ),
      };

      console.log(dataPendaftaran);
      const response = await axios.post(`${urlApi}/register`, dataPendaftaran, {
        headers: {
          Authorization: apiKey,
        },
      });

      this.userStatus[this.userId].registrationId = response.data.data.id;
      this.userStatus[this.userId].fullName = response.data.data.full_name;
      this.userStatus[this.userId].placeOfBirth =
        response.data.data.birth_place;
      this.userStatus[this.userId].dateOfBirth = response.data.data.birth_date;
      this.userStatus[this.userId].gender = response.data.data.gender;
      this.userStatus[this.userId].address = response.data.data.address;
      this.userStatus[this.userId].subdistrict = response.data.data.subdistrict;
      this.userStatus[this.userId].city = response.data.data.city;
      this.userStatus[this.userId].province = response.data.data.province;
      this.userStatus[this.userId].profession = response.data.data.profession;
      this.userStatus[this.userId].profession = response.data.data.profession;
      this.userStatus[this.userId].umrahPackageType =
        response.data.data.umrah_package_id;
      this.userStatus[this.userId].registrationNumber =
        response.data.data.registration_number;

      console.log(this.userStatus[this.userId]);
      const dataPendaftaranNomorDokumen = {
        consumer_id: this.userStatus[this.userId].registrationId,
        consumer_photo: null,
        passport_number: null,
        passport_photo: null,
        id_number: null,
        id_photo: null,
        birth_certificate_photo: null,
        family_card_photo: null,
      };

      const responseNomorDokumen = await axios.post(
        `${urlApi}/register/document`,
        dataPendaftaranNomorDokumen,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      console.log(responseNomorDokumen.data.data);

      this.userStatus[this.userId].documentId =
        responseNomorDokumen.data.data.id;

      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/registration-document-number-form-intro.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/registration-document-number-form.txt"
      );
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/registration-document-number-form-outro.txt"
      );
    } catch (error) {
      console.error(error);
      const errors = error.response.data.errors;

      for (const key in errors) {
        if (errors.hasOwnProperty(key)) {
          const errorMessages = errors[key];
          this.client.sendMessage(message.from, errorMessages.join(", "));
          console.log(`${errorMessages.join(", ")}`);
        }
      }
    }
  }

  async handleDocumentData(message) {
    try {
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

      const dataPendaftaran = {
        consumer_id: this.userStatus[this.userId].registrationId,
        consumer_photo: null,
        passport_number: dataInput["1. nomor paspor"],
        passport_photo: null,
        id_number: dataInput["2. nomor ktp (nik)"],
        id_photo: null,
        birth_certificate_photo: null,
        family_card_photo: null,
      };

      const response = await axios.patch(
        `${urlApi}/register/document/${
          this.userStatus[this.userId].documentId
        }`,
        dataPendaftaran,
        {
          headers: {
            Authorization: apiKey,
          },
        }
      );

      console.log("data dokument", response.data.data);

      this.userStatus[this.userId].passportNumber =
        response.data.data.passport_number;
      this.userStatus[this.userId].idNumber = response.data.data.id_number;

      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/registration/registration-document-file-form.txt"
      );
    } catch (error) {
      console.error(error);
      const errors = error.response.data.errors;

      for (const key in errors) {
        if (errors.hasOwnProperty(key)) {
          const errorMessages = errors[key];
          this.client.sendMessage(message.from, errorMessages.join(", "));
          console.log(`${errorMessages.join(", ")}`);
        }
      }
    }
  }

  async handleNoPhoto(message) {
    const [command, caption] = message.body.split(" ");

    const photoType = await extractPhotoTypeFromCaption(caption);
    console.log(photoType);
    if (photoType in this.userStatus[this.userId].photoUploadStatus) {
      this.userStatus[this.userId].photoUploadStatus[photoType] = true;
      const allPhotosHandled = Object.values(
        this.userStatus[this.userId].photoUploadStatus
      ).every((status) => status === true);
      console.log(this.userStatus[this.userId]);
      if (allPhotosHandled) {
        await sendFormatMessage(
          this.client,
          message.from,
          "./messages/registration/outro.txt"
        );
        delete this.userStatus[this.userId];
      }
    } else {
      this.client.sendMessage(message.from, "Jenis foto tidak valid.");
    }
  }

  async handleImageUpload(message) {
    const media = await message.downloadMedia();
    const caption = message.body.toLowerCase();

    const photoType = await extractPhotoTypeFromCaption(caption);
    if (photoType !== null) {
      const fileName = `${message.from}-${photoType}.jpg`;
      const filePath = `messages/${fileName}`;
      fs.writeFile(filePath, media.data, "base64", (err) => {
        if (err) {
          console.error("Gagal menyimpan foto:", err);
        } else {
          this.uploadPhoto(
            filePath,
            urlApi,
            apiKey,
            this.userStatus[this.userId].documentId,
            photoType
          );
          this.userStatus[this.userId].photoUploadStatus[photoType] = true;
          const allPhotosHandled = Object.values(
            this.userStatus[this.userId].photoUploadStatus
          ).every((status) => status === true);
          if (allPhotosHandled) {
            sendFormatMessage(
              this.client,
              message.from,
              "./messages/registration/outro.txt"
            );
            delete this.userStatus[this.userId];
          }
        }
      });
    } else {
      console.log(
        `${message.from}: Keterangan tidak mencantumkan jenis foto yang dikirim.`
      );
    }
  }

  async handleUmrahPackage(message) {
    const datas = await axiosGet(`${urlApi}/umrah-package`, apiKey);
    const packages = datas.data;

    let messageBody = `🕋 Selamat Datang di Layanan Paket Umrah Kami! 🕋\n\nMari Memilih Paket Umrah yang Cocok untuk Anda:\n\n`;

    packages.forEach((paket, index) => {
      messageBody += `${index + 1}. Paket ${paket.name} 🌙\n`;
      messageBody += `- Deskripsi: ${paket.description}\n`;
      messageBody += `- Durasi: ${paket.duration} hari\n`;
      messageBody += `- Harga: ${new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(paket.price)}\n`;
      messageBody += `- Tanggal Keberangkatan: ${paket.depature_date}\n`;
      messageBody += `- Fasilitas: ${paket.facility}\n`;
      messageBody += `- Tujuan: ${paket.destination}\n`;
      messageBody += `- Kuota: ${paket.quota}\n`;
    });

    messageBody += `Jangan ragu untuk menghubungi kami di nomor berikut untuk informasi lebih lanjut atau melakukan pemesanan: +628123456789.\n\n`;
    messageBody += `Semoga perjalanan ibadah Anda menjadi pengalaman yang tak terlupakan! 🙏`;

    this.client.sendMessage(message.from, messageBody);
  }

  async handleItineraryUmrahPackage(message) {
    const packageId = message.body.split(" ")[1];
    if (packageId) {
      try {
      } catch (error) {}
    } else {
      this.client.sendMessage(
        message.from,
        "Harap sertakan ID/Nomor paket. Contoh: *!itinerary 1*"
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
      console.error(error);
      this.client.sendMessage(message.from, "FAQ Tidak tersedia.");
    }
  }

  async handleCustomerService(message) {
    try {
      await sendFormatMessage(
        this.client,
        message.from,
        "./messages/help-form.txt"
      );
    } catch {
      client.sendMessage(message.from, "error");
    }
  }

  async uploadPhoto(filePath, urlApi, apiKey, documentId, photoType) {
    try {
      const fileStream = fs.createReadStream(filePath);
      const formData = new FormData();
      formData.append(photoType, fileStream);

      const config = {
        headers: {
          ...formData.getHeaders(),
          Authorization: apiKey,
        },
      };

      const response = await axios.post(
        `${urlApi}/register/document/${documentId}`,
        formData,
        config
      );
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.log(filePath);
      console.log(error);
    }
  }
}

module.exports = MessageController;
