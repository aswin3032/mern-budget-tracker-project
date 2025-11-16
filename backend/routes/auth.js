const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Make sure you import the auth middleware
const { register, login, getLoggedInUser } = require('../controllers/authController');

// @desc    Register a new user
// @route   POST /api/auth/register
router.post('/register', register);

// @desc    Login user & return JWT
// @route   POST /api/auth/login
router.post('/login', login);

// --- NEW ROUTE ADDED HERE ---
// @desc    Get the currently logged-in user's data
// @route   GET /api/auth/user
router.get('/user', auth, getLoggedInUser);

module.exports = router;