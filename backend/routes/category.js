const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');

// @desc    Create new category
// @route   POST /api/categories
router.post('/', auth, createCategory);

// @desc    Get all categories for logged-in user
// @route   GET /api/categories
router.get('/', auth, getCategories);

// @desc    Update a category
// @route   PUT /api/categories/:id
router.put('/:id', auth, updateCategory);

// @desc    Delete a category
// @route   DELETE /api/categories/:id
router.delete('/:id', auth, deleteCategory);

module.exports = router;