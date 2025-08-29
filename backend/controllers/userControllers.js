// backend/controllers/userControllers.js
const User = require('../models/userModel');
const { logAction } = require('../utils/auditLogger');
const generateToken = require('../utils/generateToken');


// ... (getUserProfile, updateUserProfile, getAllUsers, createUser, deleteUser, verifyUser functions remain the same) ...
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

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            if (req.body.password) {
                user.password = req.body.password;
            }

            const profileData = req.body.profile || {};
            Object.assign(user.profile, profileData);

            if (user.verificationStatus === 'Unverified' && profileData.icNumber && profileData.icPictureUrl) {
                user.verificationStatus = 'Pending';
            }

            const updatedUser = await user.save();
            
            await logAction(req.user, 'USER_PROFILE_UPDATE', { updatedUserId: updatedUser._id, updatedFields: Object.keys(req.body) });

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                verificationStatus: updatedUser.verificationStatus,
                profile: updatedUser.profile,
                token: generateToken(updatedUser._id),
            });

        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Error updating profile', error: error.message });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

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

const verifyUser = async (req, res) => {
    try {
        const userToVerify = await User.findById(req.params.id);

        if (userToVerify) {
            userToVerify.verificationStatus = 'Verified';
            await userToVerify.save();
            
            await logAction(req.user, 'USER_VERIFIED', { verifiedUserId: userToVerify._id, verifiedUserEmail: userToVerify.email });

            res.json({ message: 'User has been verified.' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error while verifying user.' });
    }
};

const resetUserPassword = async (req, res) => {
    try {
        const { password } = req.body;
        if (!password) {
            return res.status(400).json({ message: 'Password is required.' });
        }

        const userToUpdate = await User.findById(req.params.id);

        if (userToUpdate) {
            userToUpdate.password = password;
            await userToUpdate.save();
            
            await logAction(req.user, 'USER_PROFILE_UPDATE', { 
                updatedUserId: userToUpdate._id, 
                updatedUserEmail: userToUpdate.email,
                action: 'Password Reset' 
            });

            res.json({ message: 'Password has been reset successfully.' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error while resetting password.' });
    }
};

const getAssignableUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ['Reviewer', 'Approver'] } }).select('name email role');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = { 
    getUserProfile, 
    updateUserProfile, 
    getAllUsers, 
    createUser, 
    deleteUser, 
    verifyUser, 
    resetUserPassword,
    getAssignableUsers
};
