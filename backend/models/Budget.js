const mongoose = require('mongoose');

// 1. Define the sub-item schema
const budgetItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  allocated: { type: Number, default: 0 },
  spent: { type: Number, default: 0 },
  // --- NEW FIELD ---
  type: { type: String, default: 'daily' } // Values: 'daily' or 'custom'
});

// 2. Define the main Budget schema
const budgetSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  month: { type: String, required: true }, // e.g., "2025-12"
  limit: { type: Number, required: true },
  
  items: [budgetItemSchema], // Stores the sub-items

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

module.exports = mongoose.model('Budget', budgetSchema);