
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const Transaction = require("./models/Transaction");

async function startWorker() {
  // The worker needs its own Redis connection.
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  await connection.ping();

  const worker = new Worker(
    "transactions",
    async (job) => {
      const { transaction_id } = job.data;

      const transaction = await Transaction.findOne({
        transaction_id,
      });

      // Do not process a transaction that is already complete.
      if (!transaction || transaction.status === "PROCESSED") {
        return;
      }

      // Simulate the external API taking 30 seconds.
      await new Promise((resolve) => setTimeout(resolve, 30_000));

      // Update only if it has not already been processed.
      await Transaction.updateOne(
        {
          transaction_id,
          status: "PROCESSING",
        },
        {
          $set: {
            status: "PROCESSED",
            processed_at: new Date(),
          },
        }
      );

      console.log(`Transaction ${transaction_id} processed`);
    },
    {
      connection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
  });

  worker.on("error", (error) => {
    console.error("BullMQ worker error:", error.message);
  });

  console.log("BullMQ worker started in the API service");

  return { worker, connection };
}

module.exports = { startWorker };
