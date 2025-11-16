const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getMonthlyReport } = require('../controllers/reportController');

// @desc    Monthly report – spent vs budget per category
// @route   GET /api/reports/monthly?month=2025-06
router.get('/monthly', auth, getMonthlyReport);

module.exports = router;