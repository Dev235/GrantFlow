// backend/controllers/userController.js
const User = require('../models/userModel');
const { logAction } = require('../utils/auditLogger');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    if (req.user) {
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Get all users for Super Admin
// @route   GET /api/users
// @access  Private (Super Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Super Admin)
const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const newUser = await User.create({ name, email, password, role });
        if (newUser) {
            await logAction(req.user, 'USER_CREATED', { createdUserId: newUser._id, createdUserEmail: newUser.email, role: newUser.role });
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin)
const deleteUser = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Super Admin cannot delete themselves
        if (req.user._id.toString() === userToDelete._id.toString()) {
            return res.status(400).json({ message: 'You cannot delete your own account.' });
        }

        const deletedUserDetails = { deletedUserId: userToDelete._id, deletedUserEmail: userToDelete.email };
        await User.deleteOne({ _id: req.params.id });

        await logAction(req.user, 'USER_DELETED', deletedUserDetails);
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { getUserProfile, getAllUsers, createUser, deleteUser };
