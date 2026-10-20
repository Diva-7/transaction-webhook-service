require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("./models/Transaction");
const { connection, transactionQueue } = require("./queue");

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

const PORT = process.env.PORT || 3000;

async function startServer() {
  await mongoose.connect(process.env.MONGODB_URI);
  await Transaction.init();
  await connection.ping();
  await transactionQueue.waitUntilReady();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("API startup failed:", error);
  process.exit(1);
});