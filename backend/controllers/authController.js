// controllers/authController.js
// Handles logic for user registration and login

const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
const { logAction } = require('../utils/auditLogger');


/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password, // Password will be hashed by the pre-save middleware
      role,
    });

    if (user) {
      await logAction(user, 'USER_REGISTER', { email: user.email, role: user.role });
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    res.status(res.statusCode || 500).json({ message: error.message });
  }
};

/**
 * @desc    Auth user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      await logAction(user, 'USER_LOGIN', { email: user.email });
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        verificationStatus: user.verificationStatus,
        profile: user.profile,
        token: generateToken(user._id),
      });
    } else {
      res.status(401); // Unauthorized
      throw new Error('Invalid email or password');
    }
  } catch (error) {
     res.status(res.statusCode || 500).json({ message: error.message });
  }
};

/**
 * @desc    Log user out
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
    try {
        await logAction(req.user, 'USER_LOGOUT', { email: req.user.email });
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during logout' });
    }
};

module.exports = { registerUser, loginUser, logoutUser };
