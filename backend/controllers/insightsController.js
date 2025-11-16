const mongoose = require('mongoose');
const Expense = require('../models/Expense');

exports.getSpendingInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // STEP 1: Define our time windows for analysis.
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const lastMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = currentMonthStart;
    const threeMonthsAgoStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 3, 1));

    // STEP 2: Run a single, efficient database query to get all necessary data at once.
    // We use `$facet` to run multiple aggregation pipelines in parallel.
    const insights = await Expense.aggregate([
      // First, get all expenses from the last 3 months to work with.
      { $match: { user: userId, date: { $gte: threeMonthsAgoStart } } },
      // Join with the categories collection to get category names and colors.
      { $lookup: { from: 'categories', localField: 'category', foreignField: 'id', as: 'category' } },
      { $unwind: '$category' },
      {
        $facet: {
          // Pipeline A: Calculate totals for the Monthly Spending Trend.
          monthlyTotals: [
            {
              $group: {
                _id: null,
                // Use `$cond` (an if/then/else) to sum amounts based on the date.
                currentMonthTotal: {
                  $sum: { $cond: [{ $gte: ['$date', currentMonthStart] }, '$amount', 0] }
                },
                lastMonthTotal: {
                  $sum: { $cond: [{ $and: [{ $gte: ['$date', lastMonthStart] }, { $lt: ['$date', lastMonthEnd] }] }, '$amount', 0] }
                }
              }
            }
          ],
          // Pipeline B: Analyze spending per category for Anomalies and Recommendations.
          categoryAnalysis: [
            {
              $group: {
                _id: '$category', // Group all expenses by their category object.
                currentMonthSpending: {
                  $sum: { $cond: [{ $gte: ['$date', currentMonthStart] }, '$amount', 0] }
                },
                // Sum all spending from the 3 months *before* the current one.
                previous3MonthTotal: {
                  $sum: { $cond: [{ $lt: ['$date', currentMonthStart] }, '$amount', 0] }
                },
              }
            },
            {
              // Reshape the data for easier use.
              $project: {
                category: '$_id.name',
                color: '$_id.color',
                currentMonthSpending: '$currentMonthSpending',
                // Calculate the 3-month average for each category.
                averageSpending: { $divide: ['$previous3MonthTotal', 3] }
              }
            }
          ]
        }
      }
    ]);

    // STEP 3: Process the raw data from the database into our final response.
    const monthlyTotals = insights[0].monthlyTotals[0] || { currentMonthTotal: 0, lastMonthTotal: 0 };
    const categoryAnalysis = insights[0].categoryAnalysis;

    const finalInsights = { ...monthlyTotals, anomalies: [], recommendations: [] };
    
    categoryAnalysis.forEach(cat => {
      // --- Anomaly Detection Logic ---
      // If this month's spending is more than 150% *higher* than the average, flag it.
      if (cat.currentMonthSpending > 0 && cat.averageSpending > 0) {
        const percentageIncrease = ((cat.currentMonthSpending - cat.averageSpending) / cat.averageSpending) * 100;
        if (percentageIncrease > 150) {
          finalInsights.anomalies.push({
            category: cat.category,
            color: cat.color,
            percentageIncrease: Math.round(percentageIncrease)
          });
        }
      }
      
      // --- Budget Recommendation Logic ---
      // If there's an average to base it on, create a recommendation.
      if (cat.averageSpending > 0) {
        finalInsights.recommendations.push({
          category: cat.category,
          color: cat.color,
          // Round up to the nearest ₹100 for a clean, user-friendly number.
          suggestedBudget: Math.ceil(cat.averageSpending / 100) * 100,
        });
      }
    });

    res.json(finalInsights);

  } catch (err) {
    console.error("Error fetching insights:", err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};