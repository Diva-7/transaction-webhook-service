require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("./models/Transaction");
const { connection, transactionQueue } = require("./queue");
const { startWorker } = require("./worker");

const healthRoutes = require("./routes/health");
const webhookRoutes = require("./routes/webhooks");
const transactionRoutes = require("./routes/transactions");

const app = express();

app.use(express.json({ limit: "100kb" }));

app.use("/", healthRoutes);
app.use("/v1/webhooks/transactions", webhookRoutes);
app.use("/v1/transactions", transactionRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Internal server error",
  });
});

const PORT = process.env.PORT || 3333;

let workerRuntime;

async function startServer() {
  try {
    // Connect to MongoDB Atlas.
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB ->", process.env.MONGODB_URI);

    // Ensure the Transaction model indexes are ready.
    await Transaction.init();

    // Verify the existing Redis connection and queue.
    await connection.ping();
    await transactionQueue.waitUntilReady();
    console.log("Connected to Redis; transaction queue ready");

    // Start the BullMQ worker in this same process.
    workerRuntime = await startWorker();

    // Start the Express API.
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`API listening on port ${PORT}`);
    });

    // Graceful shutdown.
    async function shutdown(signal) {
      console.log(`${signal} received; shutting down...`);

      server.close();

      try {
        if (workerRuntime?.worker) {
          await workerRuntime.worker.close();
        }

        if (workerRuntime?.connection) {
          await workerRuntime.connection.quit();
        }

        await transactionQueue.close();
        await connection.quit();
        await mongoose.disconnect();

        console.log("Shutdown complete");
        process.exit(0);
      } catch (error) {
        console.error("Shutdown error:", error);
        process.exit(1);
      }
    }

    process.once("SIGTERM", () => shutdown("SIGTERM"));
    process.once("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("API startup failed:", error);
    process.exit(1);
  }
}

startServer();
