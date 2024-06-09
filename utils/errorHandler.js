const fs = require("fs");
const path = require("path");
const moment = require("moment-timezone");
const tz = process.env.TIME_ZONE;

async function errorHandler(functionName, error, client, userNumber) {
  // Setel waktu ke zona waktu Indonesia
  const date = moment().tz(tz);
  const dateString = date.format("YYYY-MM-DD"); // Format: YYYY-MM-DD
  const logFolder = path.join(__dirname, "logs");
  const logFileName = path.join(logFolder, `bot_log_${dateString}.txt`);

  // Pastikan folder log ada
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }

  // Tambahkan log ke file
  let logStream = fs.createWriteStream(logFileName, { flags: "a" });

  // Menulis ke log file
  logStream.write(
    `${date.format()} - From: ${userNumber}, ${functionName} Error: ${JSON.stringify(
      error
    )}\n`
  );

  // Tambahkan logging lebih detail
  console.error(`Error in ${functionName} for user ${userNumber}:`, error);

  // Periksa apakah error.response dan error.response.data ada
  if (error.response && error.response.data && error.response.data.errors) {
    const errors = error.response.data.errors;

    for (const key in errors) {
      if (errors.hasOwnProperty(key)) {
        const errorMessages = errors[key];
        await client.sendMessage(userNumber, errorMessages.join(", "));
        console.log(`${errorMessages.join(", ")}`);

        // Menulis pesan error ke log file
        logStream.write(`${date.format()} - ${errorMessages.join(", ")}\n`);
      }
    }
  } else {
    // Jika tidak ada error.response atau error.response.data.errors, kirim pesan umum
    const errorMessage = "An unexpected error occurred.";
    await client.sendMessage(userNumber, errorMessage);
    console.log(errorMessage);

    // Menulis pesan error umum ke log file
    logStream.write(`${date.format()} - ${errorMessage}\n`);
  }

  logStream.end();
}

module.exports = errorHandler;
