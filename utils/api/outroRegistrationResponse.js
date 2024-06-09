const moment = require("moment-timezone");
const axiosGet = require("../api/axiosGet");
const { Location, MessageMedia } = require("whatsapp-web.js");
const errorHandler = require("../errorHandler");
const { extractPhotoTypeFromText } = require("../photoTypeExtractor");

async function outroRegistrationResponse(
  client,
  userStatus,
  userNumber,
  urlApi,
  apiKey
) {
  try {
    const selectedUmrahPackageMessage = await umrahPackageInfo(
      client,
      userNumber,
      urlApi,
      apiKey,
      userStatus[userNumber].umrahPackageNumber
    );
    const personalDataMessage = `🤖👋 Terima kasih telah mengisi formulir pendaftaran Umrah Anda! 🕋

Berikut adalah informasi yang Anda berikan:

1. *Nama Lengkap:* ${userStatus[userNumber].fullName}
2. *Tempat, Tanggal Lahir:* ${userStatus[userNumber].placeOfBirth}, ${moment(
      userStatus[userNumber].dateOfBirth
    ).format("DD MMMM YYYY")}
3. *Jenis Kelamin:* ${userStatus[userNumber].gender}
4. *Alamat:* ${userStatus[userNumber].address}, Kec. ${
      userStatus[userNumber].subdistrict
    }, Kota/Kab. ${userStatus[userNumber].city}, ${
      userStatus[userNumber].province
    }
5. *Pekerjaan:* ${userStatus[userNumber].profession}
6. *Nomor Paspor:* ${userStatus[userNumber].passportNumber}
7. *Nomor KTP (NIK):* ${userStatus[userNumber].idNumber}
  `;

    const customerServiceMessage = `
✅ Data pendaftaran Anda telah kami terima dengan *Nomor Registrasi: ${userStatus[userNumber].registrationNumber}*. 
Kami akan segera memproses pendaftaran Anda dan menghubungi Anda untuk langkah selanjutnya.

Jika Anda ingin membatalkan pendaftaran Umrah, silakan ketik *!batal-umrah ${userStatus[userNumber].registrationNumber}*.
Jika Anda ingin mengecek itinerary perjalanan Umrah, silakan ketik *!itinerary ${userStatus[userNumber].umrahPackageNumber}*.

📞 Untuk bantuan lebih lanjut, Anda dapat menghubungi layanan pelanggan kami di 08999.

🕌 Terima kasih telah mempercayakan perjalanan Umrah Anda kepada kami. Semoga perjalanan Anda diberkahi.`;

    // Kirim pesan teks terlebih dahulu
    await client.sendMessage(userNumber, personalDataMessage);
    await client.sendMessage(userNumber, selectedUmrahPackageMessage);
    await client.sendMessage(userNumber, customerServiceMessage);

    const photoUrls = userStatus[userNumber].photoUrls;
    for (const photoType in photoUrls) {
      console.log("TEST", photoUrls[photoType]);
      if (photoUrls.hasOwnProperty(photoType) && photoUrls[photoType]) {
        try {
          let url = `http://localhost:8000/storage/${photoUrls[photoType]}`;
          const media = await MessageMedia.fromUrl(url);
          await client.sendMessage(userNumber, media, {
            caption: extractPhotoTypeFromText(photoType),
          });
        } catch (error) {
          console.error(
            `Failed to send media from URL ${photoUrls[photoType]}:`,
            error
          );
        }
      }
    }

    // Mengirim lokasi dengan menggunakan format yang benar
    const location = new Location(-0.013546, 109.320332, {
      name: "PT. Arhas Bugis Tours & Travel Kota Pontianak",
      address:
        "Jl. Apel, Sungai Jawi Luar, Kec. Pontianak Bar., Kota Pontianak, Kalimantan Barat 78244",
    });
    await client.sendMessage(userNumber, location);
  } catch (error) {
    await errorHandler("outroRegistrationResponse", error, client, userNumber);
  }
}

async function umrahPackageInfo(client, userNumber, urlApi, apiKey, id) {
  try {
    const response = await axiosGet(`${urlApi}/umrah-packages/${id}`, apiKey);

    const message = `Paket Umrah Yang Anda Pilih:
----------------------------
- Nama Paket: ${response.data.name} (Kode Paket: ${response.data.id})
- Harga: ${new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(response.data.price)}
- Tanggal Keberangkatan: ${moment(response.data.depature_date)
      .locale("id")
      .format("DD MMMM YYYY")}
- Durasi Perjalanan: ${response.data.duration} Hari`;

    return message;
  } catch (error) {
    await errorHandler("umrahPackageInfo", error, client, userNumber);
  }
}

module.exports = { outroRegistrationResponse, umrahPackageInfo };
