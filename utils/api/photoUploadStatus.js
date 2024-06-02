const FormData = require("form-data");
const { extractPhotoTypeFromText } = require("../photoTypeExtractor");
const { post } = require("axios");
const { createReadStream } = require("fs");
const { outroRegistrationResponse } = require("./outroRegistrationResponse");

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
          userNumber,
          urlApi,
          apiKey,
          userStatus[userNumber].fullName,
          userStatus[userNumber].placeOfBirth,
          userStatus[userNumber].dateOfBirth,
          userStatus[userNumber].gender,
          userStatus[userNumber].address,
          userStatus[userNumber].subdistrict,
          userStatus[userNumber].city,
          userStatus[userNumber].province,
          userStatus[userNumber].profession,
          userStatus[userNumber].umrahPackageNumber,
          userStatus[userNumber].passportNumber,
          userStatus[userNumber].idNumber,
          userStatus[userNumber].registrationNumber
        );
        delete userStatus[userNumber];
      }
    } else {
      const message = createMessage(typeConvert, nextPhotoType);
      client.sendMessage(userNumber, message);
    }
  } catch (error) {
    console.log("sendPhotoUploadedMessage function error: ", error);
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
    console.log("getNextPhotoType Function Error: ", error);
  }
}

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
    if (error.response && error.response.data && error.response.data.errors) {
      const errors = error.response.data.errors;
      for (const key in errors) {
        if (errors.hasOwnProperty(key)) {
          const errorMessages = errors[key];
          client.sendMessage(userNumber, errorMessages.join(", "));
          console.log(`${errorMessages.join(", ")}`);
        }
      }
    } else {
      console.error("Unexpected error:", error);
    }
  }
}

module.exports = { sendPhotoUploadedMessage, getNextPhotoType, uploadPhoto };
