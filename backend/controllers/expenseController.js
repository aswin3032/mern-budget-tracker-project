const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');

exports.addExpense = async (req, res) => {
  const { category, amount, date } = req.body;
  const month = date.slice(0, 7); // e.g., "2025-10"

  try {
    const expense = new Expense({
      user: req.user.id,
      category,
      amount: Number(amount),
      date,
    });
    await expense.save();

    const [budget, categoryDetails] = await Promise.all([
      // This correctly finds the budget for the month of the expense (or returns null)
      Budget.findOne({ user: req.user.id, category, month }),
      Category.findById(category).select('name')
    ]);

    const totalSpentInMonth = await Expense.aggregate([
      { $match: { 
          user: new mongoose.Types.ObjectId(req.user.id),
          category: new mongoose.Types.ObjectId(category),
          // This correctly aggregates spending only within the expense's month
          date: { $gte: new Date(month + '-01'), $lt: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1)) }
      }},
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const spent = totalSpentInMonth[0]?.total || 0;
    const limit = budget?.limit || 0;

    // --- THE CRUCIAL FIX ---
    // The 'over' flag is only true if a budget limit was set (limit > 0) AND we spent more than it.
    const over = limit > 0 && spent > limit;

    res.json({
      expense,
      over, // This will now be correctly 'false' if no budget was set for that month
      spent,
      limit,
      categoryName: categoryDetails ? categoryDetails.name : 'Selected Category'
    });
    
  } catch (err) {
    console.error("Error in addExpense:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getExpensesByMonth = async (req, res) => {
  const { month } = req.query;
  try {
    const year = parseInt(month.slice(0, 4));
    const monthIndex = parseInt(month.slice(5, 7)) - 1;
    const startDate = new Date(Date.UTC(year, monthIndex, 1));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 1));

    const expenses = await Expense.find({
      user: new mongoose.Types.ObjectId(req.user.id),
      date: { $gte: startDate, $lt: endDate }
    }).populate('category');
    
    res.json(expenses);
  } catch (err) {
    console.error("Error in getExpensesByMonth:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};