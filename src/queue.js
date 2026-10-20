const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const transactionQueue = new Queue("transactions", {
  connection,
});

module.exports = { connection, transactionQueue };