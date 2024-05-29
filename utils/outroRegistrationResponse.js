async function outroRegistrationResponse(
  client,
  to,
  fullName,
  placeOfBirth,
  dateOfBirth,
  gender,
  address,
  subdistrict,
  city,
  province,
  profession,
  umrahPackageType,
  price,
  passportNumber,
  idNumber,
  registrationNumber,
  customerServiceNumber,
  photoUrls
) {
  try {
    const message = `
  🤖👋 Terima kasih telah mengisi formulir pendaftaran Umrah Anda! 🕋
  
  Berikut adalah informasi yang Anda berikan:
  
  1. *Nama Lengkap:* ${fullName}
  2. *Tempat, Tanggal Lahir:* ${placeOfBirth}, ${dateOfBirth}
  3. *Jenis Kelamin:* ${gender}
  4. *Alamat:* ${address}, Kec. ${subdistrict}, Kota/Kab. ${city}, ${province}
  5. *Pekerjaan:* ${profession}
  6. *Paket Umrah Yang dipilih:* ${umrahPackageType}
  7. *Harga Paket Umrah:* ${price}
  8. *Nomor Paspor:* ${passportNumber}
  9. *Nomor KTP (NIK):* ${idNumber}
  
  ✅ Data pendaftaran Anda telah kami terima dengan *Nomor Registrasi: ${registrationNumber}*. Kami akan segera memproses pendaftaran Anda dan menghubungi Anda untuk langkah selanjutnya.
  
  Jika ada informasi yang perlu diperbaiki, silakan kirim ulang formulir pendaftaran dengan data yang benar.
  
  📞 Untuk bantuan lebih lanjut, Anda dapat menghubungi layanan pelanggan kami di ${customerServiceNumber}.
  
  🕌 Terima kasih telah mempercayakan perjalanan Umrah Anda kepada kami. Semoga perjalanan Anda diberkahi.
      `;

    // Kirim pesan teks terlebih dahulu
    await client.sendMessage(to, message);

    // Kirim foto-foto yang diterima
    if (photoUrls && photoUrls.length > 0) {
      for (const photoUrl of photoUrls) {
        await client.sendMessage(to, {
          media: { url: photoUrl },
          caption: "Foto Pendaftaran Anda",
        });
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
}
