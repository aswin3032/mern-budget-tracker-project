// ... (imports and logic remain the same)
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function Settings() {
  const [tab, setTab] = useState('categories');
  // ... (rest of the state and functions remain the same)
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... fetchData logic is the same ...
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catRes, budRes] = await Promise.all([
          axios.get('/categories'),
          axios.get(`/budgets?month=${month}`),
        ]);
        setCategories(catRes.data);
        const budgetMap = {};
        budRes.data.forEach(b => {
          if (b.category) { budgetMap[b.category._id] = b.limit; }
        });
        setBudgets(budgetMap);
      } catch (error) {
        toast.error("Could not load your settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [month]);

  // ... addCategory, handleBudgetChange, saveBudget functions are the same ...
  const addCategory = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await axios.post('/categories', { name: form.name.value, color: form.color.value });
      setCategories([...categories, res.data]);
      toast.success('Category added!');
      form.reset();
    } catch (error) { toast.error('Failed to add category.'); }
  };

  const handleBudgetChange = (catId, value) => {
    setBudgets({ ...budgets, [catId]: value });
  };
  const saveBudget = async (catId) => {
    const limit = budgets[catId] || 0;
    if (!limit || limit < 0) return;
    try {
      await axios.post('/budgets', { category: catId, month, limit });
      toast.success('Budget saved!');
    } catch (error) { toast.error('Failed to save budget.'); }
  };

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setTab('categories')} className={`py-2 px-1 font-medium ${tab === 'categories' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Categories</button>
        <button onClick={() => setTab('budgets')} className={`py-2 px-1 font-medium ${tab === 'budgets' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Budgets</button>
      </div>
      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {tab === 'categories' ? (
          <div>
            <form onSubmit={addCategory} className="flex gap-2 mb-6 p-4 bg-white rounded-lg shadow-sm">
              <input name="name" placeholder="New category name..." className="input-field flex-1" required />
              <input name="color" type="color" defaultValue="#4F46E5" className="w-12 h-auto p-0 border-none rounded cursor-pointer bg-transparent" />
              <button className="btn-primary">Add</button>
            </form>
            <div className="space-y-3">
              {categories.map(c => (
                <div key={c._id} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                    <span className="font-medium">{c.name}</span>
                  </div>
                  <button onClick={async () => {
                    if (window.confirm("Are you sure? This will delete the category and all associated data.")) {
                      await axios.delete(`/categories/${c._id}`);
                      setCategories(categories.filter(x => x._id !== c._id));
                      toast.success('Category deleted.');
                    }
                  }} className="text-sm font-medium text-gray-500 hover:text-danger">Delete</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mb-6 input-field w-full md:w-auto" />
            <div className="space-y-3">
              {categories.map(c => (
                <div key={c._id} className="flex items-center gap-3 p-4 bg-white border rounded-lg">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                  <span className="flex-1 font-medium">{c.name}</span>
                  <div className="relative">
                     <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                     <input
                      type="number"
                      value={budgets[c._id] || ''}
                      onChange={e => handleBudgetChange(c._id, e.target.value)}
                      onBlur={() => saveBudget(c._id)}
                      placeholder="0"
                      className="w-36 pl-7 pr-2 py-2 border rounded text-right input-field"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}