const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transaction_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    source_account: {
      type: String,
      required: true,
    },
    destination_account: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: ["PROCESSING", "PROCESSED"],
      default: "PROCESSING",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    processed_at: {
      type: Date,
      default: null,
    },
  },
  { versionKey: false }
);

module.exports = mongoose.model("Transaction", transactionSchema);