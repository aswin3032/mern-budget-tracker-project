const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    set: (value) => {
      if (typeof value === 'string') {
        return new Date(value);
      }
      return value;
    }
  },
  // --- ADD THIS FIELD ---
  subItemName: {
    type: String,
    required: false // Optional, because old expenses won't have it
  },
  // ---------------------
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

module.exports = mongoose.model('Expense', expenseSchema);