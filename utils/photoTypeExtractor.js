/**
 * Mengambil jenis foto dari keterangan.
 * @param {string} caption - Keterangan foto.
 * @returns {string|null} - Jenis foto atau null jika tidak ditemukan.
 */
function extractPhotoTypeFromCaption(caption) {
  const types = {
    diri: "consumer_photo",
    ktp: "id_photo",
    kk: "family_card_photo",
    paspor: "passport_photo",
    akte: "birth_certificate_photo",
  };

  for (const [key, value] of Object.entries(types)) {
    if (caption.includes(key)) {
      return value;
    }
  }

  return null;
}

/**
 * Mengambil deskripsi jenis foto dari teks.
 * @param {string} text - Jenis foto.
 * @returns {string|null} - Deskripsi jenis foto atau null jika tidak ditemukan.
 */
function extractPhotoTypeFromText(text) {
  const types = {
    consumer_photo: "Foto Diri",
    id_photo: "Foto KTP",
    family_card_photo: "Foto KK",
    passport_photo: "Foto Paspor",
    birth_certificate_photo: "Foto Akte Kelahiran",
  };

  return types[text] || null;
}

module.exports = {
  extractPhotoTypeFromCaption,
  extractPhotoTypeFromText,
};
