const FormData = require("form-data");
const { extractPhotoTypeFromText } = require("../photoTypeExtractor");
const { post } = require("axios");
const { createReadStream } = require("fs");
const { outroRegistrationResponse } = require("./outroRegistrationResponse");
const errorHandler = require("../errorHandler");

async function uploadPhoto(
  client,
  userStatus,
  userNumber,
  filePath,
  urlApi,
  apiKey,
  photoType
) {
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
      `${urlApi}/register/document/${userStatus[userNumber].documentId}`,
      formData,
      config
    );

    userStatus[userNumber].photoUrls["consumer_photo"] =
      response.data.data.consumer_photo;
    userStatus[userNumber].photoUrls["passport_photo"] =
      response.data.data.passport_photo;
    userStatus[userNumber].photoUrls["id_photo"] = response.data.data.id_photo;
    userStatus[userNumber].photoUrls["birth_certificate_photo"] =
      response.data.data.birth_certificate_photo;
    userStatus[userNumber].photoUrls["family_card_photo"] =
      response.data.data.family_card_photo;

    await sendPhotoUploadedMessage(
      client,
      userStatus,
      userNumber,
      photoType,
      urlApi,
      apiKey
    ); // Await the message sending function

    console.log(response.data);
    return response.data;
  } catch (error) {
    await errorHandler("uploadPhoto", error, client, userNumber);
  }
}

async function sendPhotoUploadedMessage(
  client,
  userStatus,
  userNumber,
  photoType,
  urlApi,
  apiKey
) {
  try {
    const typeConvert = extractPhotoTypeFromText(photoType);
    const nextPhotoType = await getNextPhotoType(userStatus, userNumber);
    if (nextPhotoType == "selesai") {
      const allPhotosHandled = Object.values(
        userStatus[userNumber].photoUploadStatus
      ).every((status) => status === true);
      if (allPhotosHandled) {
        await outroRegistrationResponse(
          client,
          userStatus,
          userNumber,
          urlApi,
          apiKey
        );
        delete userStatus[userNumber];
      }
    } else {
      const message = createMessage(typeConvert, nextPhotoType);
      client.sendMessage(userNumber, message);
    }
  } catch (error) {
    await errorHandler("sendPhotoUploadedMessage", error, client, userNumber);
  }
}

function createMessage(typeConvert, nextPhotoType) {
  if (nextPhotoType === "Foto Paspor") {
    return `*${typeConvert}* telah berhasil diunggah. Mohon unggah *${nextPhotoType}* berikutnya.

    ⚠ Jika Anda tidak memiliki Paspor dan ingin membuat Paspor dengan layanan kami, Anda dapat mengirimkan pesan dengan format: 
- [Ketik: *!skip-foto paspor*]`;
  } else {
    return `*${typeConvert}* telah berhasil diunggah. Mohon unggah *${nextPhotoType}* berikutnya.`;
  }
}

async function getNextPhotoType(userStatus, userNumber) {
  try {
    const photoUploadStatus = userStatus[userNumber].photoUploadStatus;
    for (const [type, uploaded] of Object.entries(photoUploadStatus)) {
      if (!uploaded) {
        return extractPhotoTypeFromText(type);
      }
    }
    return "selesai";
  } catch (error) {
    await errorHandler("getNextPhotoType", error, client, userNumber);
  }
}

module.exports = { sendPhotoUploadedMessage, getNextPhotoType, uploadPhoto };
