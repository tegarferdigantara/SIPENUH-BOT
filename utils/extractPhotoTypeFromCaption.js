async function extractPhotoTypeFromCaption(caption) {
  caption = caption.toLowerCase();

  if (caption.includes("diri")) {
    return "consumer_photo";
  } else if (caption.includes("ktp")) {
    return "id_photo";
  } else if (caption.includes("kk")) {
    return "family_card_photo";
  } else if (caption.includes("paspor")) {
    return "passport_photo";
  } else if (caption.includes("akte")) {
    return "birth_certificate_photo";
  } else {
    return null;
  }
}

module.exports = extractPhotoTypeFromCaption;
