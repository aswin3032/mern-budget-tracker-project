import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format, getDaysInMonth, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import WelcomeOnboarding from '../components/WelcomeOnboarding';
import ExpenseModal from '../components/ExpenseModal';
import { PlusIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

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
    } finally {
      setLoading(false);
    }
  };

  const getSpent = (catId) => {
    return expenses
      .filter(e => e.category && e.category._id === catId)
      .reduce((a, b) => a + b.amount, 0);
  };

  // --- ADD EXPENSE FUNCTION ---
  const handleOneClickAdd = async (catId, subItemName, amount) => {
    const amountToAdd = Number(amount);

    if (amountToAdd <= 0) {
      toast.error("Invalid Amount");
      return;
    }

    const toastId = toast.loading(`Adding ₹${amountToAdd}...`);

    try {
      await axios.post('/expenses', {
        category: catId,
        amount: amountToAdd,
        date: format(new Date(), 'yyyy-MM-dd'),
        subItemName: subItemName 
      });
      
      toast.success(`Added ${subItemName}!`, { id: toastId });
      fetchData(); 
    } catch (err) {
      toast.error("Failed to add", { id: toastId });
    }
  };

  // --- MANUAL ADD UI (Toast Prompt) ---
  const handleManualAdd = (catId, subItemName) => {
    toast.custom((t) => (
      <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-100 flex flex-col gap-3 max-w-xs w-full animate-enter pointer-events-auto">
        <div>
          <p className="font-bold text-gray-800">Add to "{subItemName}"</p>
          <p className="text-xs text-gray-400">Enter amount spent</p>
        </div>
        <input 
          id={`manual-${t.id}`} 
          type="number" 
          placeholder="₹0" 
          autoFocus
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-gray-800"
          onKeyDown={(e) => {
             if(e.key === 'Enter') {
                const val = document.getElementById(`manual-${t.id}`).value;
                if(val > 0) {
                  toast.dismiss(t.id);
                  handleOneClickAdd(catId, subItemName, val);
                }
             }
          }}
        />
        <div className="flex gap-2 justify-end">
           <button 
             className="text-gray-500 text-sm px-3 py-1 hover:bg-gray-100 rounded"
             onClick={() => toast.dismiss(t.id)}
           >Cancel</button>
           <button 
             className="bg-indigo-600 text-white px-4 py-1 rounded-lg text-sm font-bold hover:bg-indigo-700"
             onClick={() => {
                const val = document.getElementById(`manual-${t.id}`).value;
                if(val > 0) {
                  toast.dismiss(t.id);
                  handleOneClickAdd(catId, subItemName, val);
                }
             }}
           >Add</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const renderDashboardContent = () => {
    if (loading) return <p className="text-center mt-12 text-gray-500 animate-pulse">Loading data...</p>;
    if (categories.length === 0) return <WelcomeOnboarding />;

    const totalDaysInMonth = getDaysInMonth(new Date(month));
    const todayStr = format(new Date(), 'yyyy-MM-dd'); 

    return (
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {categories.map(cat => {
          const budgetObj = budgets.find(b => b.category && b.category._id === cat._id);
          const budgetLimit = budgetObj ? budgetObj.limit : 0;
          const subItems = budgetObj && budgetObj.items ? budgetObj.items : [];
          
          const spent = getSpent(cat._id);
          const percent = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;
          const isOverBudget = budgetLimit > 0 && spent > budgetLimit;

          return (
            <motion.div 
              key={cat._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col h-full hover:shadow-md transition-shadow"
              variants={cardVariants}
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: cat.color }}></div>
                  <h3 className="font-bold text-lg text-gray-800 capitalize">{cat.name}</h3>
                </div>
                {isOverBudget && (
                  <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded-full border border-red-100 uppercase">Over</span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <span className="text-gray-900">₹{spent.toLocaleString()}</span>
                  <span className="text-gray-400">of ₹{budgetLimit.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${percent > 100 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: percent > 100 ? '#EF4444' : cat.color }} 
                  ></div>
                </div>
              </div>

              {/* SUB ITEMS LIST */}
              {subItems.length > 0 && (
                <div className="mt-auto pt-4 border-t border-dashed border-gray-200">
                  <div className="space-y-3">
                    {subItems.map((item, idx) => {
                      const itemAllocated = item.allocated || 0;
                      const itemSpent = item.spent || 0;
                      const dailyLimit = itemAllocated > 0 ? (itemAllocated / totalDaysInMonth) : 0;
                      
                      // 1. Determine Type (Default to daily if missing)
                      const isDaily = item.type !== 'custom';

                      // 2. Check if Done Today (Strict Match)
                      const isDoneToday = expenses.some(e => 
                        e.category && 
                        e.category._id === cat._id && 
                        e.subItemName && 
                        e.subItemName.trim().toLowerCase() === item.name.trim().toLowerCase() && 
                        format(parseISO(e.date), 'yyyy-MM-dd') === todayStr
                      );

                      return (
                        <div key={idx} className="flex items-center justify-between group select-none py-1">
                          
                          {/* INFO LEFT */}
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium capitalize ${isDaily && isDoneToday ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                              {item.name}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              
                              {/* --- DISPLAY LOGIC --- */}
                              {isDaily ? (
                                // DAILY: Show Red Limit
                                <>Daily: <span className="text-red-500 font-bold">₹{Math.round(dailyLimit)}</span></>
                              ) : (
                                // CUSTOM: Show Green Remaining
                                <>Left: <span className="text-green-600 font-bold">₹{itemAllocated - itemSpent}</span></>
                              )}
                              
                              {' • '}
                              <span className={itemSpent > itemAllocated ? 'text-red-400' : ''}>
                                Total: {itemSpent}
                              </span>
                            </span>
                          </div>

                          {/* ACTION RIGHT */}
                          {isDaily ? (
                             // OPTION A: CHECKBOX (Fixed Amount)
                             <div 
                               onClick={() => !isDoneToday && handleOneClickAdd(cat._id, item.name, Math.round(dailyLimit))}
                               className={`
                                 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 cursor-pointer
                                 ${isDoneToday 
                                   ? 'bg-green-500 border-green-500 text-white shadow-sm' 
                                   : 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50' 
                                 }
                               `}
                             >
                               {isDoneToday && <CheckIcon className="w-4 h-4 stroke-2" />}
                             </div>
                          ) : (
                             // OPTION B: PLUS BUTTON (Manual Amount)
                             <button 
                               onClick={() => handleManualAdd(cat._id, item.name)}
                               className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all"
                             >
                               <PlusIcon className="w-3 h-3 stroke-2" />
                             </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 md:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-900">{format(new Date(month + '-01'), 'MMMM yyyy')}</h1>
           <p className="text-gray-500 text-sm mt-1">Track daily habits and one-off purchases.</p>
        </div>
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)} 
          className="input-field w-full md:w-auto bg-white shadow-sm border-gray-200 focus:border-indigo-500" 
        />
      </div>

      <AnimatePresence mode='wait'>{renderDashboardContent()}</AnimatePresence>

      <motion.button 
        onClick={() => setShowExpense(true)} 
        className="fixed bottom-24 right-6 md:bottom-10 md:right-10 bg-indigo-600 hover:bg-indigo-700 text-white h-14 w-14 rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center z-40 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <PlusIcon className="w-7 h-7" />
      </motion.button>
      
      <ExpenseModal open={showExpense} onClose={handleModalClose} categories={categories} />
    </div>
  );
}