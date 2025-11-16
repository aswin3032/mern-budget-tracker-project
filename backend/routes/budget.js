const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { setBudget, getBudgets } = require('../controllers/budgetController');

// @desc    Create / Update budget for a category & month
// @route   POST /api/budgets
router.post('/', auth, setBudget);

// @desc    Get budgets for a given month (query: ?month=2025-06)
// @route   GET /api/budgets
router.get('/', auth, getBudgets);

module.exports = router;