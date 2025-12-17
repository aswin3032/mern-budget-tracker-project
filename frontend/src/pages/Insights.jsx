import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, LightBulbIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Insights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  // Add state for month selection
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        // Pass the selected month to the backend
        const res = await axios.get(`/insights?month=${month}`);
        setInsights(res.data);
      } catch (error) {
        console.error("Failed to fetch insights:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [month]); // Re-run when month changes

  const renderContent = () => {
    if (loading) {
      return <div className="p-8 text-center text-gray-500">Analyzing your spending habits...</div>;
    }

    // Check if we have data for the specific month OR the previous month
    if (!insights || (insights.currentMonthTotal === 0 && insights.lastMonthTotal === 0)) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-8 p-8 bg-white rounded-lg shadow-sm">
          <LightBulbIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Not Enough Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't find enough spending data for <b>{format(new Date(month), 'MMMM yyyy')}</b> or the months prior.
          </p>
          <p className="text-xs text-gray-400 mt-2">Try adding expenses for previous months to see trends.</p>
        </motion.div>
      );
    }

    const trendPercentage = insights.lastMonthTotal > 0
      ? Math.round(((insights.currentMonthTotal - insights.lastMonthTotal) / insights.lastMonthTotal) * 100)
      : 100;
    const isUp = trendPercentage >= 0;

    return (
      <div className="space-y-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="card">
          <h2 className="text-xl font-semibold mb-4">Monthly Spending Trend</h2>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${isUp ? 'bg-red-100' : 'bg-green-100'}`}>
              {isUp ? <ArrowTrendingUpIcon className="h-8 w-8 text-danger" /> : <ArrowTrendingDownIcon className="h-8 w-8 text-success" />}
            </div>
            <div>
              <p className="text-2xl font-bold">₹{insights.currentMonthTotal.toLocaleString()}</p>
              <p className={`font-semibold ${isUp ? 'text-danger' : 'text-success'}`}>
                {isUp ? `${trendPercentage}% more` : `${Math.abs(trendPercentage)}% less`} than last month
              </p>
            </div>
          </div>
        </motion.div>

        {insights.anomalies.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="card">
            <div className="flex items-center gap-3 mb-4">
               <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
               <h2 className="text-xl font-semibold">Unusual Spending Alerts</h2>
            </div>
            <div className="space-y-3">
              {insights.anomalies.map(anomaly => (
                <div key={anomaly.category} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{backgroundColor: anomaly.color}}></div><span className="font-medium">{anomaly.category}</span></div>
                  <span className="font-bold text-orange-600">+{anomaly.percentageIncrease}% vs. average</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {insights.recommendations.length > 0 && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="card">
             <div className="flex items-center gap-3 mb-4"><LightBulbIcon className="h-6 w-6 text-primary" /><h2 className="text-xl font-semibold">Budget Suggestions</h2></div>
            <div className="space-y-3">
              {insights.recommendations.map(rec => (
                <div key={rec.category} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{backgroundColor: rec.color}}></div><span className="font-medium">{rec.category}</span></div>
                  <span className="font-bold text-primary">Suggest: ₹{rec.suggestedBudget.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.div className="p-4 md:p-8 max-w-4xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Smart Insights</h1>
        {/* Month Picker to handle the 2025 vs 2024 issue */}
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)} 
          className="input-field w-auto" 
        />
      </div>
      {renderContent()}
    </motion.div>
  );
}