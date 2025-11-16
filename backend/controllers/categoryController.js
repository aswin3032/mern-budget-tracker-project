const Category = require('../models/Category');

exports.createCategory = async (req, res) => {
  const { name, color } = req.body;
  try {
    const category = new Category({ name, color, user: req.user.id });
    await category.save();
    res.json(category);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};