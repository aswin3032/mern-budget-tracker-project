const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  addExpense,
  getExpensesByMonth,
} = require('../controllers/expenseController');

// @desc    Add a new expense
// @route   POST /api/expenses
router.post('/', auth, addExpense);

// @desc    Get expenses for a month (query: ?month=2025-06)
// @route   GET /api/expenses/month
router.get('/month', auth, getExpensesByMonth);

module.exports = router;