// ... (imports remain the same, including Link and DocumentChartBarIcon)
import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { DocumentChartBarIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function Reports() {
  // ... (state and useEffect logic remains the same)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get(`/reports/monthly?month=${month}`)
      .then(res => setReport(res.data))
      .catch(err => { console.error("Failed to fetch reports:", err); setReport([]); })
      .finally(() => setLoading(false));
  }, [month]);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center mt-16 text-gray-500">Generating report...</div>;
    }
    const validReportItems = report.filter(r => r.category);
    if (validReportItems.length === 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-16 p-8 bg-white rounded-lg shadow-sm">
          <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No report data available</h3>
          <p className="mt-1 text-sm text-gray-500">You need to set budgets and add expenses to see a report.</p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/settings" className="btn-primary">Set Budgets</Link>
            <Link to="/" className="btn-secondary">Add Expense</Link>
          </div>
        </motion.div>
      );
    }
    return (
      <div className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        {validReportItems.map(r => (
          <motion.div 
            key={r.category._id} 
            className="flex justify-between items-center p-4 border-b last:border-b-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-4">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: r.category.color }}></div>
              <span className="font-medium text-base">{r.category.name}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-base">₹{r.spent.toLocaleString()}</p>
              <p className="text-sm text-gray-500">of ₹{r.budget.toLocaleString()}</p>
              <p className={`text-sm font-medium ${r.remaining < 0 ? 'text-danger' : 'text-green-600'}`}>
                {r.remaining < 0 ? `Overspent: ₹${(-r.remaining).toLocaleString()}` : `Remaining: ₹${r.remaining.toLocaleString()}`}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Monthly Report</h1>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mt-4 md:mt-0 input-field w-full md:w-auto" />
      </div>
      {renderContent()}
    </div>
  );
}