const FormData = require("form-data");
const { extractPhotoTypeFromText } = require("../photoTypeExtractor");
const { post } = require("axios");
const { createReadStream } = require("fs");
const { outroRegistrationResponse } = require("./outroRegistrationResponse");
const errorHandler = require("../errorHandler");
const { chatbotLogger } = require("../logger");

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
      `${urlApi}/api/register/document/${userStatus[userNumber].documentId}`,
      formData,
      config
    );

    userStatus[userNumber].photoUrls["customer_photo"] =
      response.data.data.customer_photo;
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

    console.log("Photo uploaded successfully: ", response.data);
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
        chatbotLogger.info(
          `User ${userNumber} has completed the registration process. [END REGISTRATION SESSION]`
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
    return `*${typeConvert}* telah berhasil diunggah. Mohon unggah *${nextPhotoType}* beserta caption foto *${nextPhotoType}* untuk selanjutnya.

    ⚠ Jika Anda tidak memiliki Paspor dan ingin membuat Paspor dengan layanan kami, Anda dapat mengirimkan pesan dengan format: 
- [Ketik: *!skip-foto paspor*]`;
  } else {
    return `*${typeConvert}* telah berhasil diunggah. Mohon unggah *${nextPhotoType}* beserta caption foto *${nextPhotoType}* untuk selanjutnya.`;
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
