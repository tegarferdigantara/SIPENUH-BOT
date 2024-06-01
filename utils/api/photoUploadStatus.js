const FormData = require("form-data");
const { createReadStream } = require("fs");
const { extractPhotoTypeFromText } = require("../photoTypeExtractor");
const { post } = require("axios");

async function sendPhotoUploadedMessage(client, user, photoType) {
  const typeConvert = await extractPhotoTypeFromText(photoType); // Perbaikan: Menunggu hasil dari extractPhotoTypeFromText
  const message = `${typeConvert} telah berhasil diunggah. Mohon unggah foto ${await getNextPhotoType(
    user
  )} berikutnya.`;
  client.sendMessage(user, message);
}

async function getNextPhotoType(user) {
  const photoUploadStatus = this.userStatus[user].photoUploadStatus;
  for (const [type, uploaded] of Object.entries(photoUploadStatus)) {
    if (!uploaded) {
      const typeConvert = await extractPhotoTypeFromText(type); // Perbaikan: Menunggu hasil dari extractPhotoTypeFromText
      return typeConvert;
    }
  }
  return "selesai";
}

async function uploadPhoto(filePath, urlApi, apiKey, documentId, photoType) {
  try {
    const fileStream = createReadStream(filePath);
    const formData = new FormData();
    formData.append(photoType, fileStream);

    const config = {
      headers: {
        ...formData.getHeaders(),
        Authorization: apiKey,
      },
    };

    const response = await post(
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

module.exports = { sendPhotoUploadedMessage, getNextPhotoType, uploadPhoto };
