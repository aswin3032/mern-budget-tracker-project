const mongoose = require('mongoose'); // <-- Make sure this line is here
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

exports.getMonthlyReport = async (req, res) => {
  const { month } = req.query;
  try {
    const year = parseInt(month.slice(0, 4));
    const monthIndex = parseInt(month.slice(5, 7)) - 1;
    const startDate = new Date(Date.UTC(year, monthIndex, 1));
    const endDate = new Date(Date.UTC(year, monthIndex + 1, 1));

    // --- Start of The Final Fix ---
    // The query MUST use a proper ObjectId for the user, just like in the other controllers.
    const budgets = await Budget.find({
      user: new mongoose.Types.ObjectId(req.user.id),
      month
    }).populate('category');
    // --- End of The Final Fix ---

    const expenses = await Expense.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.id),
          date: { $gte: startDate, $lt: endDate }
        }
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' }
    ]);

    const report = budgets.map(b => {
      // This check prevents crashes if a category was deleted
      if (!b.category) return null;

      const spent = expenses.find(e => e._id.toString() === b.category._id.toString())?.total || 0;
      return {
        category: b.category,
        budget: b.limit,
        spent,
        remaining: b.limit - spent
      };
    }).filter(Boolean); // .filter(Boolean) cleanly removes any null items from the array

    res.json(report);
  } catch (err) {
    console.error("Error in getMonthlyReport:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};