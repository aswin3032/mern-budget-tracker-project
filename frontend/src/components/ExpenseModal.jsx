import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExpenseModal({ open, onClose, categories }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ category: '', amount: '', date: format(new Date(), 'yyyy-MM-dd') });

  // When the modal opens, reset the form and default to the first available category.
  useEffect(() => {
    if (open) {
      setForm({
        category: categories.length > 0 ? categories[0]._id : '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    }
  }, [open, categories]);

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

      // This logic now works correctly because the backend will only send 'over: true'
      // if a budget for the specific month of the expense was actually exceeded.
      if (over) {
        toast.error(
          `Over Budget in '${categoryName}'! (Spent ₹${spent.toLocaleString()} of ₹${limit.toLocaleString()})`, 
          { icon: '⚠️', duration: 5000 }
        );
      } else {
        toast.success('Expense added successfully!');
      }

      onClose(); // Close the modal and trigger the data refetch on the dashboard
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
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 150 }}
          >
            <h2 className="text-xl font-bold mb-6">Add New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label">Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field" required>
                  <option value="" disabled>Select a category</option>
                  {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Amount (₹)</label>
                <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-field" required min="0.01" step="0.01" />
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