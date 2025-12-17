const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getMonthlyReport } = require("../controllers/reportController");

router.get("/monthly", auth, getMonthlyReport);

module.exports = router;
