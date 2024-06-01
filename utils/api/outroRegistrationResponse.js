const moment = require("moment-timezone");
const { axiosGet } = require("./axiosGet");

async function outroRegistrationResponse(
  client,
  to,
  urlApi,
  apiKey,
  fullName,
  placeOfBirth,
  dateOfBirth,
  gender,
  address,
  subdistrict,
  city,
  province,
  profession,
  umrahPackageNumber,
  passportNumber,
  idNumber,
  registrationNumber
) {
  try {
    const personalDataMessage = `
🤖👋 Terima kasih telah mengisi formulir pendaftaran Umrah Anda! 🕋

Berikut adalah informasi yang Anda berikan:

1. *Nama Lengkap:* ${fullName}
2. *Tempat, Tanggal Lahir:* ${placeOfBirth}, ${moment(dateOfBirth).format(
      "DD MMMM YYYY"
    )}
3. *Jenis Kelamin:* ${gender}
4. *Alamat:* ${address}, Kec. ${subdistrict}, Kota/Kab. ${city}, ${province}
5. *Pekerjaan:* ${profession}
6. *Nomor Paspor:* ${passportNumber}
7. *Nomor KTP (NIK):* ${idNumber}
  `;

    const selectedUmrahPackageMessage = this.IntlumrahPackageInfo(
      urlApi,
      apiKey,
      umrahPackageNumber
    );
    const customerServiceMessage = `
✅ Data pendaftaran Anda telah kami terima dengan *Nomor Registrasi: ${registrationNumber}*. 
Kami akan segera memproses pendaftaran Anda dan menghubungi Anda untuk langkah selanjutnya.

Jika Anda ingin membatalkan pendaftaran Umrah, silakan ketik *!batal-umrah ${registrationNumber}*.
Jika Anda ingin mengecek itinerary perjalanan Umrah, silakan ketik *!itinerary ${umrahPackageNumber}*.

📞 Untuk bantuan lebih lanjut, Anda dapat menghubungi layanan pelanggan kami di 08999.

🕌 Terima kasih telah mempercayakan perjalanan Umrah Anda kepada kami. Semoga perjalanan Anda diberkahi.`;

    // Kirim pesan teks terlebih dahulu
    await client.sendMessage(to, personalDataMessage);
    await client.sendMessage(to, selectedUmrahPackageMessage);
    await client.sendMessage(to, customerServiceMessage);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

async function umrahPackageInfo(urlApi, apiKey, id) {
  try {
    const response = await axiosGet(`${urlApi}/umrah-packages/${id}`, apiKey);

    const message = `
Paket Umrah Yang Anda Pilih:
----------------------------
ID: ${response.data.id}
Nama Paket: ${response.data.name}
Harga: ${new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(response.data.price)}
Tanggal Keberangkatan: ${moment(response.data.depature_date).format(
      "DD MMMM YYYY"
    )}
Durasi Perjalanan: ${response.data.duration} Hari
    `;

    return message;
  } catch (error) {
    console.log("umrah package info error:", error);
    throw error;
  }
}

module.exports = { outroRegistrationResponse, umrahPackageInfo };
