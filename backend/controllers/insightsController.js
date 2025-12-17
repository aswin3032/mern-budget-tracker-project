const mongoose = require('mongoose');
const Expense = require('../models/Expense');

exports.getSpendingInsights = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { month } = req.query; // GET THE MONTH FROM FRONTEND

    // STEP 1: Determine the "Current" month for analysis
    // If a month is provided (e.g., "2025-12"), use that. Otherwise, use real-time "now".
    const now = month ? new Date(month + "-01") : new Date();

    // Calculate time windows based on the selected 'now'
    const currentMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
    
    const lastMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const lastMonthEnd = currentMonthStart;
    
    // For 3-month average, we look at the 3 months BEFORE the current one
    const threeMonthsAgoStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 3, 1));

    const insights = await Expense.aggregate([
      // Match expenses from 3 months ago up to the end of the selected month
      { 
        $match: { 
          user: userId, 
          date: { $gte: threeMonthsAgoStart, $lt: nextMonthStart } 
        } 
      },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      {
        $facet: {
          monthlyTotals: [
            {
              $group: {
                _id: null,
                currentMonthTotal: {
                  $sum: { $cond: [{ $gte: ['$date', currentMonthStart] }, '$amount', 0] }
                },
                lastMonthTotal: {
                  $sum: { $cond: [{ $and: [{ $gte: ['$date', lastMonthStart] }, { $lt: ['$date', lastMonthEnd] }] }, '$amount', 0] }
                }
              }
            }
          ],
          categoryAnalysis: [
            {
              $group: {
                _id: '$category',
                currentMonthSpending: {
                  $sum: { $cond: [{ $gte: ['$date', currentMonthStart] }, '$amount', 0] }
                },
                // Sum spending from the 3 months PRIOR to current
                previous3MonthTotal: {
                  $sum: { $cond: [{ $lt: ['$date', currentMonthStart] }, '$amount', 0] }
                },
              }
            },
            {
              $project: {
                category: '$_id.name',
                color: '$_id.color',
                currentMonthSpending: '$currentMonthSpending',
                averageSpending: { $divide: ['$previous3MonthTotal', 3] }
              }
            }
          ]
        }
      }
    ]);

    const monthlyTotals = insights[0].monthlyTotals[0] || { currentMonthTotal: 0, lastMonthTotal: 0 };
    const categoryAnalysis = insights[0].categoryAnalysis;

    const finalInsights = { ...monthlyTotals, anomalies: [], recommendations: [] };
    
    categoryAnalysis.forEach(cat => {
      // Anomaly: 150% increase over average
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
      
      // Recommendation: Suggest budget based on average
      if (cat.averageSpending > 0) {
        finalInsights.recommendations.push({
          category: cat.category,
          color: cat.color,
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