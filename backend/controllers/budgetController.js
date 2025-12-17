const mongoose = require('mongoose');
const Budget = require('../models/Budget');

exports.setBudget = async (req, res) => {
  // 1. Extract 'items' from the request
  const { category, month, limit, items } = req.body; 

  try {
    let budget = await Budget.findOne({
      category,
      month,
      user: new mongoose.Types.ObjectId(req.user.id)
    });

    if (budget) {
      // Update existing budget
      budget.limit = limit;
      
      // 2. FORCE UPDATE ITEMS
      if (items) {
        budget.items = items;
        // Mongoose sometimes needs to be told an array changed
        budget.markModified('items'); 
      }
    } else {
      // Create new budget with items
      budget = new Budget({ 
        category, 
        month, 
        limit, 
        items: items || [], 
        user: req.user.id 
      });
    }

    await budget.save();
    res.json(budget);

  } catch (err) {
    console.error("Error in setBudget:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getBudgets = async (req, res) => {
  const { month } = req.query;
  try {
    const budgets = await Budget.find({
      user: new mongoose.Types.ObjectId(req.user.id),
      month
    }).populate('category');

    res.json(budgets);
  } catch (err) {
    console.error("Error in getBudgets:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};