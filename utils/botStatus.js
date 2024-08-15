let botStatus = false;

const setBotStatus = (status) => {
  botStatus = status;
};

const getBotStatus = () => {
  return botStatus;
};

module.exports = { setBotStatus, getBotStatus };
