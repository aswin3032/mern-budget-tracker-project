const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');

exports.addExpense = async (req, res) => {
  const { category, amount, date, subItemName } = req.body;
  const month = date.slice(0, 7); // e.g., "2025-10"

  try {
    // 1. Create the Expense Record
    // IMPORTANT: We must save 'subItemName' so the frontend can check it off later
    const expense = new Expense({
      user: req.user.id,
      category,
      amount: Number(amount),
      date,
      subItemName: subItemName || null // Save the specific item name (e.g., "Tea")
    });
    await expense.save();

    // 2. Find the Budget for this month
    const budget = await Budget.findOne({ 
      user: req.user.id, 
      category, 
      month 
    });

    let limit = 0;

    if (budget) {
      limit = budget.limit;

      // 3. Update the specific Sub-Item's 'spent' counter
      if (subItemName && budget.items) {
        const itemIndex = budget.items.findIndex(i => i.name === subItemName);
        if (itemIndex > -1) {
          // Add new amount to existing spent amount
          budget.items[itemIndex].spent = (budget.items[itemIndex].spent || 0) + Number(amount);
          // Tell Mongoose the array changed
          budget.markModified('items');
          await budget.save();
        }
      }
    }

    // 4. Calculate Total Category Spending (for the progress bar)
    const totalSpentInMonth = await Expense.aggregate([
      { $match: { 
          user: new mongoose.Types.ObjectId(req.user.id),
          category: new mongoose.Types.ObjectId(category),
          date: { 
            $gte: new Date(month + '-01'), 
            $lt: new Date(new Date(month + '-01').setMonth(new Date(month + '-01').getMonth() + 1)) 
          }
      }},
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const spent = totalSpentInMonth[0]?.total || 0;
    
    // Check if main budget is exceeded
    const over = limit > 0 && spent > limit;
    
    const categoryDetails = await Category.findById(category).select('name');

    res.json({
      expense,
      over,
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
    // Construct dates carefully to avoid timezone bugs
    const startDate = new Date(month + '-01');
    const endDate = new Date(new Date(month + '-01').setMonth(startDate.getMonth() + 1));

    const expenses = await Expense.find({
      user: new mongoose.Types.ObjectId(req.user.id),
      date: { $gte: startDate, $lt: endDate }
    }).populate('category').sort({ date: -1 });

    res.json(expenses);

  } catch (err) {
    console.error("Error in getExpensesByMonth:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};