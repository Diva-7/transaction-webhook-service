const express = require("express");
const mongoose = require("mongoose");
const Transaction = require("../models/Transaction");
const { transactionQueue } = require("../queue");

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const {
      transaction_id,
      source_account,
      destination_account,
      amount,
      currency,
    } = req.body;

    if (
      typeof transaction_id !== "string" ||
      !transaction_id.trim() ||
      typeof source_account !== "string" ||
      !source_account.trim() ||
      typeof destination_account !== "string" ||
      !destination_account.trim() ||
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      typeof currency !== "string" ||
      !/^[A-Za-z]{3}$/.test(currency)
    ) {
      return res.status(400).json({
        error: "Invalid transaction payload",
      });
    }

    let transaction;

    try {
      transaction = await Transaction.create({
        transaction_id: transaction_id.trim(),
        source_account: source_account.trim(),
        destination_account: destination_account.trim(),
        amount,
        currency: currency.toUpperCase(),
        status: "PROCESSING",
      });
    } catch (error) {
      if (error.code === 11000) {
        // The same transaction was already accepted.
        return res.status(202).json({
          message: "Transaction already accepted",
          transaction_id: transaction_id.trim(),
        });
      }

      throw error;
    }

    try {
      await transactionQueue.add(
        "process-transaction",
        { transaction_id: transaction.transaction_id },
        {
          jobId: transaction.transaction_id,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: true,
        }
      );
    } catch (error) {
      // The record was created, but the job could not be queued.
      // Surface the error rather than falsely acknowledging success.
      // A production system should also reconcile orphaned records.
      await Transaction.deleteOne({
        _id: transaction._id,
        status: "PROCESSING",
      }).catch(() => {});

      throw error;
    }

    return res.status(202).json({
      message: "Transaction accepted for processing",
      transaction_id: transaction.transaction_id,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;