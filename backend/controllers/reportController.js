const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');

exports.getMonthlyReport = async (req, res) => {
  const { month } = req.query; // e.g. "2025-11"

  res.setHeader('Cache-Control', 'no-store');

  if (!month) {
    return res.status(400).json({ msg: "Month parameter is required" });
  }

  try {
    const userId = req.user.id;

    const userMatch = {
      $or: [
        { user: new mongoose.Types.ObjectId(userId) },
        { user: userId }
      ]
    };

    // Fetch categories and budgets
    const [categories, budgets, allExpenses] = await Promise.all([
      Category.find({ user: userId }),
      Budget.find({ ...userMatch, month }),
      Expense.find(userMatch)
    ]);

    // Filter expenses using reliable ISO string prefix
    const monthlyExpenses = allExpenses.filter(expense => {
      if (!expense.date) return false;
      const iso = expense.date.toISOString(); // "2025-11-15T00:00:00.000Z"
      return iso.slice(0, 7) === month; // matches "2025-11"
    });

    console.log(`REPORT: Matched ${monthlyExpenses.length} expenses for ${month}`);

    const report = categories.map(cat => {
      const budgetObj = budgets.find(b => b.category?.toString() === cat._id.toString());
      const budget = budgetObj ? budgetObj.limit : 0;

      const spent = monthlyExpenses
        .filter(e => e.category?.toString() === cat._id.toString())
        .reduce((sum, e) => sum + e.amount, 0);

      if (budget === 0 && spent === 0) return null;

      return {
        category: cat,
        budget,
        spent,
        remaining: budget - spent
      };
    }).filter(Boolean);

    console.log(`REPORT: Returning ${report.length} items for ${month}`);

    res.json(report);
  } catch (err) {
    console.error("Report Error:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};