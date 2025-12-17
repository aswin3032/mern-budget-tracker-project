import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExpenseModal({ open, onClose, categories }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), subItemName: '' });
  const [availableSubItems, setAvailableSubItems] = useState([]);

  useEffect(() => {
    if (open) {
      setForm({
        category: categories.length > 0 ? categories[0]._id : '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        subItemName: ''
      });
    }
  }, [open, categories]);

  // Fetch sub-items when category or date changes
  useEffect(() => {
    const fetchBudgetItems = async () => {
      if (!form.category || !form.date) return;
      const month = form.date.slice(0, 7);
      try {
        // We need to fetch the budgets to see the sub-items
        // Optimization: In a real app, pass this data in or cache it
        const res = await axios.get(`/budgets?month=${month}`);
        const budget = res.data.find(b => b.category._id === form.category);
        if (budget && budget.items) {
          setAvailableSubItems(budget.items);
        } else {
          setAvailableSubItems([]);
        }
      } catch (err) { console.error(err); }
    };
    fetchBudgetItems();
  }, [form.category, form.date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category) {
      toast.error("Please select a category.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/expenses', form);
      const { over, categoryName, spent, limit } = res.data;

      if (over) {
        toast.error(`Over Budget in '${categoryName}'!`, { icon: '⚠️' });
      } else {
        toast.success('Expense added!');
      }
      onClose(); 
    } catch (err) {
      toast.error('Error adding expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <motion.div 
            className="card w-full max-w-md"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            <h2 className="text-xl font-bold mb-6">Add New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, subItemName: '' })} className="input-field">
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              {/* Only show if sub-items exist for this budget */}
              {availableSubItems.length > 0 && (
                <div>
                   <label className="input-label">Sub-Category (Optional)</label>
                   <select 
                     value={form.subItemName} 
                     onChange={e => setForm({ ...form, subItemName: e.target.value })} 
                     className="input-field bg-indigo-50 border-indigo-200"
                   >
                     <option value="">-- General Expense --</option>
                     {availableSubItems.map((item, idx) => (
                       <option key={idx} value={item.name}>{item.name}</option>
                     ))}
                   </select>
                </div>
              )}

              <div>
                <label className="input-label">Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" required min="1" step="0.01" />
              </div>
              <div>
                <label className="input-label">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" required />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={onClose} className="btn-secondary w-full">Cancel</button>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}