require("dotenv").config();

const mongoose = require("mongoose");
const { Worker } = require("bullmq");
const { connection } = require("./queue");
const Transaction = require("./models/Transaction");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Worker connected to MongoDB");

  const worker = new Worker(
    "transactions",
    async (job) => {
      const { transaction_id } = job.data;

      const transaction = await Transaction.findOne({
        transaction_id,
      });

      if (!transaction || transaction.status === "PROCESSED") {
        return;
      }

      // Simulate an external payment processor taking 30 seconds.
      await new Promise((resolve) => setTimeout(resolve, 30_000));

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

      console.log(`Processed transaction: ${transaction_id}`);
    },
    {
      connection,
      concurrency: 10,
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job completed: ${job.id}`);
  });

  worker.on("failed", (job, error) => {
    console.error(`Job failed: ${job?.id}`, error);
  });

  async function shutdown() {
    await worker.close();
    await mongoose.disconnect();
    await connection.quit();
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((error) => {
  console.error("Worker startup failed:", error);
  process.exit(1);
});