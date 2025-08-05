// backend/controllers/userController.js
const User = require('../models/userModel');
const { logAction } = require('../utils/auditLogger');
const generateToken = require('../utils/generateToken'); // <-- FIX: Added this import

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            if (req.body.password) {
                user.password = req.body.password;
            }

            // Update profile sub-document
            const profileData = req.body.profile || {};
            Object.assign(user.profile, profileData);

            // If profile is submitted and status is Unverified, set status to Pending
            if (user.verificationStatus === 'Unverified' && profileData.icNumber && profileData.icPictureUrl) {
                user.verificationStatus = 'Pending';
            }

            const updatedUser = await user.save();
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                verificationStatus: updatedUser.verificationStatus,
                profile: updatedUser.profile,
                token: generateToken(updatedUser._id), // This will now work
            });

        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating profile', error: error.message });
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


// @desc    Create a new user by Super Admin
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
                createdAt: newUser.createdAt,
                verificationStatus: newUser.verificationStatus,
                profile: newUser.profile
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete a user by Super Admin
// @route   DELETE /api/users/:id
// @access  Private (Super Admin)
const deleteUser = async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

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

// @desc    Verify a user
// @route   PUT /api/users/:id/verify
// @access  Private (Super Admin)
const verifyUser = async (req, res) => {
    try {
        const userToVerify = await User.findById(req.params.id);

        if (userToVerify) {
            userToVerify.verificationStatus = 'Verified';
            await userToVerify.save();
            // Optionally: log this action
            res.json({ message: 'User has been verified.' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error while verifying user.' });
    }
};


module.exports = { getUserProfile, updateUserProfile, getAllUsers, createUser, deleteUser, verifyUser };
