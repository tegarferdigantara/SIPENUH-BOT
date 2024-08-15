const { htmlToText } = require("html-to-text");

// Berfungsi untuk mengkonversi tag HTML menjadi teks biasa
function htmlTagConversion(text) {
  const data = htmlToText(text, {
    wordwrap: 130, // Maksimal lebar baris teks
    preserveNewlines: true, // Pertahankan baris baru
    ignoreHref: true,
    ignoreImage: true,
  }).replace(/\n\s*\n/g, "\n"); // Menghapus baris kosong tambahan

  return data;
}

module.exports = htmlTagConversion;
