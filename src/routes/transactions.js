const express = require("express");
const Transaction = require("../models/Transaction");

const router = express.Router();

router.get("/:transaction_id", async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      transaction_id: req.params.transaction_id,
    }).lean();

    if (!transaction) {
      return res.status(404).json({
        error: "Transaction not found",
      });
    }

    // Return an array, matching the assessment's response example.
    return res.status(200).json([
      {
        transaction_id: transaction.transaction_id,
        source_account: transaction.source_account,
        destination_account: transaction.destination_account,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        created_at: transaction.created_at,
        processed_at: transaction.processed_at,
      },
    ]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;