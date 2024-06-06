// const { Client, LocalAuth, Location } = require("whatsapp-web.js");
// const FormData = require("form-data");
// require("dotenv").config();
// const qrcode = require("qrcode-terminal");
// const moment = require("moment-timezone");
// const colors = require("colors");
// const fs = require("fs");
// const path = require("path");
// const client = new Client({
//   restartOnAuthFail: true,
//   puppeteer: {
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   },
//   webVersionCache: {
//     type: "remote",
//     remotePath:
//       "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
//   },
//   authStrategy: new LocalAuth({ clientId: "client" }),
// });
// const config = require("./config/config.json");
// const sendFormatMessage = require("./utils/sendFormatMessage");
// const axios = require("axios");
// const apiKey = process.env.CHATBOT_API_KEY;
// const urlApi = process.env.URL_API;

// const userStatus = {};

// client.on("qr", (qr) => {
//   console.log(
//     `[${moment().tz(config.timezone).format("HH:mm:ss")}] Scan the QR below : `
//   );
//   qrcode.generate(qr, { small: true });
// });

// client.on("ready", () => {
//   console.clear();
//   const consoleText = "./config/console.txt";
//   fs.readFile(consoleText, "utf-8", (err, data) => {
//     if (err) {
//       console.log(
//         `[${moment()
//           .tz(config.timezone)
//           .format("HH:mm:ss")}] Console Text not found!`.yellow
//       );
//       console.log(
//         `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${
//           config.name
//         } is Running!`.green
//       );
//     } else {
//       console.log(data.green);
//       console.log(
//         `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${
//           config.name
//         } is Running!`.green
//       );
//     }
//   });
// });

// client.on("message", async (message) => {
//   const userId = message.from;

//   if (!userStatus[userId]) {
//     userStatus[userId] = {
//       registrationId: null,
//       documentId: null,
//       photoUploadStatus: {
//         consumer_photo: false,
//         id_photo: false,
//         family_card_photo: false,
//         passport_photo: false,
//         birth_certificate_photo: false,
//       },
//     };
//   }

//   if (message.body == "!start") {
//     try {
//       await sendFormatMessage(client, message.from, "./messages/menu/main.txt");
//     } catch {
//       client.sendMessage(message.from, "error");
//     }
//   } else if (message.body == "!pendaftaran-umrah") {
//     try {
//       await sendFormatMessage(
//         client,
//         message.from,
//         "./messages/registration/intro.txt"
//       );
//       await sendFormatMessage(
//         client,
//         message.from,
//         "./messages/registration/registration-personal-data-form.txt"
//       );
//     } catch {
//       client.sendMessage(message.from, "error");
//     }
//   } else if (message.body.includes("[Pendaftaran Umrah - Data Diri]")) {
//     try {
//       const lines = message.body.split("\n");

//       const dataInput = {};

//       lines.forEach((line) => {
//         if (line.includes(":")) {
//           const [label, value] = line.split(":");

//           const trimmedValue = value.trim();

//           dataInput[label] = trimmedValue;
//         }
//       });

//       console.log("data", dataInput);
//       const [birthPlace, birthDate] =
//         dataInput["3. Tempat, Tanggal Lahir"].split(", ");
//       const formattedBirthDate = moment(birthDate, "DD MMMM YYYY").format(
//         "YYYY-MM-DD"
//       );

//       const dataPendaftaran = {
//         full_name: dataInput["1. Nama Lengkap"],
//         whatsapp_number: message.from.replace("@c.us", ""),
//         gender: dataInput["2. Jenis Kelamin"],
//         birth_place: birthPlace,
//         birth_date: formattedBirthDate,
//         father_name: dataInput["9. Nama Ayah"],
//         mother_name: dataInput["10. Nama Ibu"],
//         profession: dataInput["4. Pekerjaan"],
//         address: dataInput["5. Alamat"],
//         province: dataInput["6. Provinsi"],
//         city: dataInput["7. Kota"],
//         subdistrict: dataInput["8. Kecamatan"],
//         family_number: dataInput["11. Nomor HP Keluarga"],
//         email: dataInput["12. Email"],
//         umrah_package_id: parseInt(dataInput["13. Jenis Paket Umrah"]),
//       };

//       const response = await axios.post(`${urlApi}/register`, dataPendaftaran, {
//         headers: {
//           Authorization: apiKey,
//         },
//       });

//       userStatus[userId].registrationId = response.data.data.id; // Simpan ID untuk pengguna ini
//       console.log(userStatus);
//       // console.log(response);
//       await sendFormatMessage(
//         client,
//         message.from,
//         "./messages/registration/registration-document-number-form-intro.txt"
//       );
//       await sendFormatMessage(
//         client,
//         message.from,
//         "./messages/registration/registration-document-number-form.txt"
//       );
//     } catch (error) {
//       const errors = error.response.data.errors;
//       console.log(userStatus);
//       // console.log(error);

//       for (const key in errors) {
//         if (errors.hasOwnProperty(key)) {
//           const errorMessages = errors[key];
//           client.sendMessage(message.from, errorMessages.join(", "));
//           console.log(`${errorMessages.join(", ")}`);
//         }
//       }
//     }
//   } else if (message.body.includes("[Pendaftaran Umrah - Nomor Dokumen]")) {
//     if (userStatus[userId].registrationId !== null) {
//       try {
//         const lines = message.body.split("\n");

//         const dataInput = {};

//         lines.forEach((line) => {
//           if (line.includes(":")) {
//             const [label, value] = line.split(":");

//             const trimmedValue = value.trim();

//             dataInput[label] = trimmedValue;
//           }
//         });

//         const dataPendaftaran = {
//           consumer_id: userStatus[userId].registrationId,
//           consumer_photo: null,
//           passport_number: dataInput["1. Nomor Paspor"],
//           passport_photo: null,
//           id_number: dataInput["2. Nomor NIK (KTP)"],
//           id_photo: null,
//           birth_certificate_photo: null,
//           family_card_photo: null,
//         };

//         const response = await axios.post(
//           `${urlApi}/register/document`,
//           dataPendaftaran,
//           {
//             headers: {
//               Authorization: apiKey,
//             },
//           }
//         );

//         userStatus[userId].documentId = response.data.data.id;
//         await sendFormatMessage(
//           client,
//           message.from,
//           "./messages/registration/registration-document-file-form.txt"
//         );
//       } catch (error) {
//         const errors = error.response.data.errors;
//         console.log(error);

//         for (const key in errors) {
//           if (errors.hasOwnProperty(key)) {
//             const errorMessages = errors[key];
//             client.sendMessage(message.from, errorMessages.join(", "));
//             console.log(`${errorMessages.join(", ")}`);
//           }
//         }
//       }
//     } else {
//       await sendFormatMessage(
//         client,
//         message.from,
//         "messages/registration/warn-personal-data.txt"
//       );
//       await sendFormatMessage(
//         client,
//         message.from,
//         "messages/registration/registration-personal-data-form.txt"
//       );
//     }
//   } else if (message.body.startsWith("!tidak-ada-foto")) {
//     const [command, photoType] = message.body.split(" ");

//     if (photoType in userStatus[userId].photoUploadStatus) {
//       // Tandai foto sebagai "tidak ada"
//       userStatus[userId].photoUploadStatus[photoType] = true;

//       // Periksa apakah semua foto telah diunggah atau ditandai sebagai "tidak ada"
//       const allPhotosHandled = Object.values(
//         userStatus[userId].photoUploadStatus
//       ).every((status) => status === true);

//       // Jika semua foto telah diunggah atau ditandai, kirim pesan outro
//       if (allPhotosHandled) {
//         await sendFormatMessage(
//           client,
//           message.from,
//           "./messages/registration/outro.txt"
//         );
//         // Hapus status pengguna setelah selesai
//         delete userStatus[userId];
//       }
//     } else {
//       client.sendMessage(message.from, "Jenis foto tidak valid.");
//     }
//   } else if (message.type == "image") {
//     const media = await message.downloadMedia();
//     const caption = message.body.toLowerCase();
//     const documentId = userStatus[userId]?.documentId;

//     function extractPhotoTypeFromCaption(caption) {
//       if (caption.includes("foto diri")) {
//         return "consumer_photo";
//       } else if (caption.includes("foto ktp")) {
//         return "id_photo";
//       } else if (caption.includes("foto kk")) {
//         return "family_card_photo";
//       } else if (caption.includes("foto passpor")) {
//         return "passport_photo";
//       } else if (caption.includes("foto akte kelahiran")) {
//         return "birth_certificate_photo";
//       } else {
//         return null;
//       }
//     }

//     const photoType = extractPhotoTypeFromCaption(caption);
//     //Mengecek caption dari gambar yang dikirim
//     if (photoType !== null) {
//       //Mengecek apakah sudah melakukan step pengisian nomor dokumen atau tidak
//       if (documentId == null) {
//         await sendFormatMessage(
//           client,
//           message.from,
//           "messages/registration/warn-number-form.txt"
//         );
//         await sendFormatMessage(
//           client,
//           message.from,
//           "messages/registration/registration-document-number-form.txt"
//         );
//         return;
//       } else {
//         const fileName = `${userId}-${photoType}.jpg`;
//         const filePath = `media/photos/${fileName}`;

//         fs.writeFile(filePath, media.data, "base64", (err) => {
//           if (err) {
//             console.error("Gagal menyimpan foto:", err);
//           } else {
//             uploadPhoto(filePath, urlApi, apiKey, documentId, photoType);
//             console.log("Foto berhasil disimpan:", fileName);
//             console.log(userStatus);
//           }
//         });
//       }
//     } else {
//       console.log(
//         `${message.from}: Keterangan tidak mencantumkan jenis foto yang dikirim.`
//       );
//     }

//     async function uploadPhoto(
//       filePath,
//       urlApi,
//       apiKey,
//       documentId,
//       photoType
//     ) {
//       try {
//         const fileStream = fs.createReadStream(filePath);

//         const formData = new FormData();
//         formData.append(photoType, fileStream);

//         const config = {
//           headers: {
//             ...formData.getHeaders(),
//             Authorization: apiKey,
//           },
//         };

//         const response = await axios.post(
//           `${urlApi}/register/document/${documentId}`,
//           formData,
//           config
//         );
//         return response.data;
//       } catch (error) {
//         const errors = error.response.data.errors;
//         for (const key in errors) {
//           if (errors.hasOwnProperty(key)) {
//             const errorMessages = errors[key];
//             client.sendMessage(message.from, errorMessages.join(", "));
//             console.log(`${errorMessages.join(", ")}`);
//           }
//         }
//       }
//     }
//   } else if (message.body == "!faq") {
//     async function getFaq() {
//       try {
//         const response = await axios.get(`${urlApi}/faq`, {
//           headers: {
//             Authorization: apiKey,
//           },
//         });
//         return response.data; // Mengembalikan hanya bagian data dari respons
//       } catch (error) {
//         console.error(error);
//         throw error;
//       }
//     }
//     try {
//       getFaq().then((response) => {
//         const faqs = response.data;
//         faqs.forEach((faq) => {
//           client.sendMessage(
//             message.from,
//             `Pertanyaan: ${faq.question} Jawaban: ${faq.answer}`
//           );
//         });
//       });
//     } catch (error) {
//       console.error(error);
//     }
//   } else if (message.body == "!info-paket-umrah") {
//     //GET API HERE, UMRAH PACKAGE TABLE HERE
//     async function getUmrahPackage() {
//       try {
//         const response = await axios.get(`${urlApi}/umrah-package`, {
//           headers: {
//             Authorization: apiKey,
//           },
//         });
//         return response.data; // Mengembalikan hanya bagian data dari respons
//       } catch (error) {
//         console.error(error);
//         throw error;
//       }
//     }

//     try {
//       getUmrahPackage()
//         .then((response) => {
//           const umrahPackages = response.data;
//           console.log(umrahPackages);
//           let messageBody = `🕋 Selamat Datang di Layanan Paket Umrah Kami! 🕋\n\nMari Memilih Paket Umrah yang Cocok untuk Anda:\n\n`;

//           umrahPackages.forEach((package, index) => {
//             messageBody += `${index + 1}. Paket ${package.name} 🌙\n`;
//             messageBody += `Deskripsi: ${package.description}\n`;
//             messageBody += `Durasi: ${package.duration} hari\n`;
//             messageBody += `Harga: ${new Intl.NumberFormat("id-ID", {
//               style: "currency",
//               currency: "IDR",
//             }).format(package.price)}\n`;
//             messageBody += `Tanggal Keberangkatan: ${package.depature_date}\n`;
//             messageBody += `Fasilitas: ${package.facility}\n`;
//             messageBody += `Tujuan: ${package.destination}\n`;
//             messageBody += `Kuota: ${package.quota}\n`;
//             messageBody += `Status: ${package.status}\n\n`;
//           });

//           messageBody += `Jangan ragu untuk menghubungi kami di nomor berikut untuk informasi lebih lanjut atau melakukan pemesanan: +628123456789.\n\n`;
//           messageBody += `Semoga perjalanan ibadah Anda menjadi pengalaman yang tak terlupakan! 🙏`;

//           client.sendMessage(message.from, messageBody);
//         })
//         .catch((error) => {
//           console.log("Gagal:", error);
//         });
//     } catch {
//       client.sendMessage(message.from, "error");
//     }
//   } else if (message.body == "!bantuan") {
//     //GET API HERE, ONLY WHATSAPP NUMBER
//     try {
//       await sendFormatMessage(client, message.from, "./messages/help-form.txt");
//     } catch {
//       client.sendMessage(message.from, "error");
//     }
//   } else if (message.body === "!location") {
//     // only latitude and longitude
//     await message.reply(new Location(37.422, -122.084));
//     // location with name only
//     await message.reply(new Location(37.422, -122.084, { name: "Googleplex" }));
//     // location with address only
//     await message.reply(
//       new Location(37.422, -122.084, {
//         address: "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
//       })
//     );
//     // location with name, address and url
//     await message.reply(
//       new Location(37.422, -122.084, {
//         name: "Googleplex",
//         address: "1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA",
//         url: "https://google.com",
//       })
//     );
//   }
// });
// client.initialize();

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
