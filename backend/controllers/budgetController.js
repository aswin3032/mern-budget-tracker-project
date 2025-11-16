const mongoose = require('mongoose'); // <-- Add this line
const Budget = require('../models/Budget');

exports.setBudget = async (req, res) => {
  const { category, month, limit } = req.body;
  try {
    // Find the budget using the correctly typed user ID
    let budget = await Budget.findOne({
      category,
      month,
      user: new mongoose.Types.ObjectId(req.user.id) // <-- Apply the fix here
    });
    
    if (budget) {
      budget.limit = limit;
    } else {
      budget = new Budget({ category, month, limit, user: req.user.id });
    }
    
    await budget.save();
    res.json(budget);
  } catch (err) {
    console.error("Error in setBudget:", err.message); // More detailed logging
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getBudgets = async (req, res) => {
  const { month } = req.query;
  try {
    // Find budgets using the correctly typed user ID
    const budgets = await Budget.find({
      user: new mongoose.Types.ObjectId(req.user.id), // <-- Apply the fix here
      month
    }).populate('category');
    
    res.json(budgets);
  } catch (err) {
    console.error("Error in getBudgets:", err.message); // More detailed logging
    res.status(500).json({ msg: 'Server error' });
  }
};