const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getSpendingInsights } = require('../controllers/insightsController');

// @desc    Get AI-powered spending insights for the user
// @route   GET /api/insights
router.get('/', auth, getSpendingInsights);

module.exports = router;