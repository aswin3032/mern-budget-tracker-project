import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  DocumentChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

export default function Reports() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    fetchReport();
  }, [month]);

  const fetchReport = () => {
    setLoading(true);
    // Cache buster to prevent 304
    axios.get(`/reports/monthly?month=${month}&t=${Date.now()}`)
      .then(res => setReport(res.data))
      .catch(err => {
        console.error("Failed to fetch reports:", err);
        setReport([]);
      })
      .finally(() => setLoading(false));
  };

  const currentYear = parseInt(month.split('-')[0]);
  const currentMonthIndex = parseInt(month.split('-')[1]) - 1;

  const handleYearChange = (increment) => {
    const newYear = currentYear + increment;
    const monthStr = String(currentMonthIndex + 1).padStart(2, '0');
    setMonth(`${newYear}-${monthStr}`);
  };

  const handleMonthSelect = (index) => {
    const monthStr = String(index + 1).padStart(2, '0');
    setMonth(`${currentYear}-${monthStr}`);
  };

  const availableCategories = [...new Map(report.map(item => [item.category._id, item.category])).values()];

  const filteredReport = selectedCategory === 'All'
    ? report
    : report.filter(r => r.category._id === selectedCategory);

  const totalBudget = filteredReport.reduce((acc, curr) => acc + curr.budget, 0);
  const totalSpent = filteredReport.reduce((acc, curr) => acc + curr.spent, 0);

  const renderContent = () => {
    if (loading) {
      return <div className="text-center mt-16 text-gray-500">Generating report...</div>;
    }

    if (filteredReport.length === 0) {
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-16 p-8 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
          <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No data found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {selectedCategory === 'All'
              ? `No expenses found for ${months[currentMonthIndex]} ${currentYear}.`
              : `No expenses found for this category in ${months[currentMonthIndex]}.`}
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to="/settings" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">Set Budgets</Link>
            <Link to="/" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">Add Expense</Link>
          </div>
        </motion.div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
            <p className="text-gray-500 text-sm">{selectedCategory === 'All' ? 'Total Budget' : 'Category Budget'}</p>
            <p className="text-2xl font-bold text-gray-800">₹{totalBudget.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-orange-500">
            <p className="text-gray-500 text-sm">{selectedCategory === 'All' ? 'Total Spent' : 'Category Spent'}</p>
            <p className="text-2xl font-bold text-gray-800">₹{totalSpent.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Breakdown</h2>
            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{filteredReport.length} Items</span>
          </div>
          <div>
            {filteredReport.map(r => {
              const percent = r.budget > 0 ? (r.spent / r.budget) * 100 : (r.spent > 0 ? 100 : 0);
              return (
                <motion.div key={r.category._id} className="flex flex-col sm:flex-row justify-between items-center p-4 border-b last:border-b-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm font-bold text-sm" style={{ backgroundColor: r.category.color }}>
                      {r.category.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 sm:w-48">
                      <span className="font-medium text-base text-gray-900">{r.category.name}</span>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: r.category.color }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                    <div>
                      <p className="font-bold text-gray-800">₹{r.spent.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{r.budget > 0 ? `of ₹${r.budget.toLocaleString()}` : 'No Budget'}</p>
                    </div>
                    <div className="sm:mt-1">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${r.remaining < 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {r.remaining < 0 ? `Over: ₹${Math.abs(r.remaining).toLocaleString()}` : `Left: ₹${r.remaining.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 self-start md:self-center">Monthly Report</h1>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-gray-400" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 pr-8 py-2 w-full md:w-48 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block"
              >
                <option value="All">All Categories</option>
                {availableCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              <button onClick={() => handleYearChange(-1)} className="p-1 hover:bg-white hover:shadow rounded-md transition-all text-gray-600">
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="font-bold text-gray-800 w-12 text-center select-none">{currentYear}</span>
              <button onClick={() => handleYearChange(1)} className="p-1 hover:bg-white hover:shadow rounded-md transition-all text-gray-600">
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
          {months.map((m, index) => {
            const isActive = currentMonthIndex === index;
            return (
              <button
                key={m}
                onClick={() => handleMonthSelect(index)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive ? 'bg-indigo-600 text-white shadow-md transform scale-105' : 'bg-gray-50 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>
      {renderContent()}
    </div>
  );
}