import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function Settings() {
  const [tab, setTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [budgets, setBudgets] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [month]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, budRes] = await Promise.all([
        axios.get('/categories'),
        axios.get(`/budgets?month=${month}`),
      ]);
      setCategories(catRes.data);

      const budgetMap = {};
      
      // Initialize buckets
      catRes.data.forEach(c => {
        budgetMap[c._id] = { limit: 0, items: [] };
      });

      // Fill data
      budRes.data.forEach(b => {
        if (b.category) {
          budgetMap[b.category._id] = { 
            limit: b.limit, 
            items: b.items || [] 
          }; 
        }
      });
      
      setBudgets(budgetMap);
    } catch (error) {
      toast.error("Could not load settings.");
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const res = await axios.post('/categories', { name: form.name.value, color: form.color.value });
      setCategories([...categories, res.data]);
      setBudgets(prev => ({ ...prev, [res.data._id]: { limit: 0, items: [] } }));
      toast.success('Category added!');
      form.reset();
    } catch (error) { toast.error('Failed to add category.'); }
  };

  const handleBudgetLimitChange = (catId, value) => {
    setBudgets(prev => ({
      ...prev,
      [catId]: { ...prev[catId], limit: Number(value) }
    }));
  };

  // --- SUB ITEM LOGIC ---
  const addBudgetItem = (catId) => {
    setBudgets(prev => {
      const currentItems = prev[catId]?.items || [];
      return {
        ...prev,
        [catId]: { 
          ...prev[catId], 
          // Default to 'daily'
          items: [...currentItems, { name: '', allocated: 0, spent: 0, type: 'daily' }] 
        }
      };
    });
  };

  const updateBudgetItem = (catId, index, field, value) => {
    setBudgets(prev => {
      const newItems = [...(prev[catId]?.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { 
        ...prev, 
        [catId]: { ...prev[catId], items: newItems } 
      };
    });
  };

  const removeBudgetItem = (catId, index) => {
    setBudgets(prev => {
      const newItems = prev[catId].items.filter((_, i) => i !== index);
      return { 
        ...prev, 
        [catId]: { ...prev[catId], items: newItems } 
      };
    });
  };

  const saveBudget = async (catId) => {
    const budgetData = budgets[catId];
    if (!budgetData) return;

    try {
      await axios.post('/budgets', { 
        category: catId, 
        month, 
        limit: budgetData.limit,
        items: budgetData.items 
      });
      toast.success('Budget saved!');
    } catch (error) { 
      toast.error('Failed to save budget.'); 
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="flex gap-4 mb-6 border-b">
        <button onClick={() => setTab('categories')} className={`py-2 px-1 font-medium ${tab === 'categories' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Categories</button>
        <button onClick={() => setTab('budgets')} className={`py-2 px-1 font-medium ${tab === 'budgets' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}>Budgets & Todos</button>
      </div>

      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {tab === 'categories' ? (
          <div>
            <form onSubmit={addCategory} className="flex gap-2 mb-6 p-4 bg-white rounded-lg shadow-sm">
              <input name="name" placeholder="Category Name (e.g., Food)" className="input-field flex-1" required />
              <input name="color" type="color" defaultValue="#4F46E5" className="w-12 h-10 p-1 border rounded cursor-pointer" />
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
                     if (confirm("Delete this category?")) {
                       await axios.delete(`/categories/${c._id}`);
                       setCategories(categories.filter(x => x._id !== c._id));
                       toast.success('Deleted');
                     }
                  }} className="text-red-500 text-sm">Delete</button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-4">
               <label className="font-medium">Planning for:</label>
               <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="input-field w-auto" />
            </div>

            <div className="space-y-6">
              {categories.map(c => {
                 const b = budgets[c._id] || { limit: 0, items: [] };
                 return (
                  <div key={c._id} className="p-5 bg-white border rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-3">
                         <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                         <h3 className="font-bold text-lg">{c.name}</h3>
                       </div>
                       <button onClick={() => saveBudget(c._id)} className="btn-primary text-xs py-2 px-4">Save Changes</button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <label className="text-sm font-medium w-24">Total Budget:</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                        <input type="number" value={b.limit} onChange={e => handleBudgetLimitChange(c._id, e.target.value)} className="input-field pl-8 w-40"/>
                      </div>
                    </div>

                    {/* SUB ITEMS / TODO LIST */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Sub-categories / To-Do List</h4>
                      
                      {b.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-3 items-start sm:items-center">
                           <input 
                             placeholder="Item (e.g. Tea)" 
                             value={item.name} 
                             onChange={e => updateBudgetItem(c._id, idx, 'name', e.target.value)}
                             className="input-field flex-1 text-sm" 
                           />
                           
                           {/* TYPE SELECTOR */}
                           <select 
                             value={item.type || 'daily'} 
                             onChange={e => updateBudgetItem(c._id, idx, 'type', e.target.value)}
                             className="input-field w-24 text-sm bg-white"
                             title="Daily = Fixed Checkbox, One-off = Variable Amount"
                           >
                             <option value="daily">Daily</option>
                             <option value="custom">One-off</option>
                           </select>

                           <div className="relative w-28">
                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                             <input 
                               type="number" 
                               placeholder="Limit" 
                               value={item.allocated} 
                               onChange={e => updateBudgetItem(c._id, idx, 'allocated', e.target.value)}
                               className="input-field pl-6 text-sm w-full" 
                             />
                           </div>
                           <button onClick={() => removeBudgetItem(c._id, idx)} className="text-red-500 hover:bg-red-100 p-2 rounded transition-colors">
                             <TrashIcon className="w-5 h-5" />
                           </button>
                        </div>
                      ))}
                      
                      <button onClick={() => addBudgetItem(c._id)} className="text-sm text-indigo-600 font-medium flex items-center gap-1 mt-2 hover:text-indigo-800">
                        <PlusIcon className="w-4 h-4" /> Add Item
                      </button>
                    </div>
                  </div>
                 );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}