import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeOnboarding from '../components/WelcomeOnboarding';
import ExpenseModal from '../components/ExpenseModal';
import { PlusIcon } from '@heroicons/react/24/outline';

// Animation variants for the container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animation variants for each card
const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
};

export default function Dashboard() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showExpense, setShowExpense] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [month]);

  // This function is passed to the modal so it can trigger a data refresh
  const handleModalClose = () => {
    setShowExpense(false);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, budRes, expRes] = await Promise.all([
        axios.get('/categories'),
        axios.get(`/budgets?month=${month}`),
        axios.get(`/expenses/month?month=${month}`)
      ]);
      setCategories(catRes.data);
      setBudgets(budRes.data);
      setExpenses(expRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setCategories([]); setBudgets([]); setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const getSpent = (catId) => {
    return expenses
      .filter(e => e.category && e.category._id === catId)
      .reduce((a, b) => a + b.amount, 0);
  };

  const getForecast = (catId) => {
    const daysInMonth = new Date(month.slice(0,4), month.slice(5), 0).getDate();
    const today = new Date().getDate();
    const spent = getSpent(catId);
    if (spent === 0) return null;
    const dailyAvg = spent / today;
    const projected = dailyAvg * daysInMonth;
    const budgetObj = budgets.find(b => b.category && b.category._id === catId);
    const budget = budgetObj ? budgetObj.limit : 0;
    if (projected > budget && budget > 0) {
      return `On track to overspend by ₹${Math.round(projected - budget).toLocaleString()}`;
    }
    return null;
  };

  const renderDashboardContent = () => {
    if (loading) {
      return <p className="text-center mt-8 text-gray-500">Loading your dashboard...</p>;
    }

    if (categories.length === 0) {
      return <WelcomeOnboarding />;
    }

    return (
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.map(cat => {
          const budgetObj = budgets.find(b => b.category && b.category._id === cat._id);
          const budget = budgetObj ? budgetObj.limit : 0;
          const spent = getSpent(cat._id);
          const percent = budget > 0 ? (spent / budget) * 100 : 0;
          const forecast = getForecast(cat._id);
          const remaining = budget - spent;

          return (
            <motion.div key={cat._id} className="card" variants={cardVariants}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                </div>
                {spent > budget && budget > 0 && <span className="bg-red-100 text-danger text-xs font-semibold px-2 py-1 rounded-full">OVER BUDGET</span>}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1 font-medium">
                  <span className="text-gray-800">₹{spent.toLocaleString()}</span>
                  <span className="text-gray-500">of ₹{budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${percent > 100 ? 'bg-danger' : 'bg-primary'}`} 
                    style={{ width: `${Math.min(percent, 100)}%` }}>
                  </div>
                </div>
              </div>
              <p className={`text-sm font-medium ${remaining < 0 ? 'text-danger' : 'text-gray-600'}`}>
                {remaining < 0 ? `₹${(-remaining).toLocaleString()} Overspent` : `₹${remaining.toLocaleString()} Remaining`}
              </p>
              {forecast && <p className="text-xs text-orange-600 mt-2 animate-pulse">💡 {forecast}</p>}
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    // --- THIS IS THE FINAL FIX ---
    // We add padding to the bottom on mobile (pb-28) to create a safe area
    // for the content, and reset it on desktop (md:pb-8).
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-28 md:pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{format(new Date(month + '-01'), 'MMMM yyyy')}</h1>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mt-4 md:mt-0 input-field w-full md:w-auto" />
      </div>

      <AnimatePresence>
        {renderDashboardContent()}
      </AnimatePresence>

      {/* This button's position is now correct because the content above it has padding */}
      <motion.button 
        onClick={() => setShowExpense(true)} 
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 bg-primary text-white h-14 w-14 rounded-full shadow-lg flex items-center justify-center z-30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <PlusIcon className="w-7 h-7" />
      </motion.button>
      
      <ExpenseModal 
        open={showExpense} 
        onClose={handleModalClose} 
        categories={categories} 
      />
    </div>
  );
}