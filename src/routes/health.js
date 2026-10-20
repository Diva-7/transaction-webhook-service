const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "HEALTHY",
    current_time: new Date().toISOString(),
  });
});

module.exports = router;