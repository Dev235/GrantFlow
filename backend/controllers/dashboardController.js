// controllers/dashboardController.js
const Grant = require('../models/grantModel');
const Application = require('../models/applicationModel');
const User = require('../models/userModel');
const mongoose = require('mongoose');

// @desc    Get stats for the Grant Maker dashboard
// @route   GET /api/dashboard/grantmaker
// @access  Private (Grant Maker)
const getGrantMakerStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const totalGrants = await Grant.countDocuments({ grantMaker: userId });
        const activeGrants = await Grant.countDocuments({ grantMaker: userId, status: 'Open' });
        
        const totalApplications = await Application.countDocuments({ grantMaker: userId });
        const approvedApplications = await Application.countDocuments({ grantMaker: userId, status: 'Approved' });

        const awardedData = await Application.aggregate([
            { $match: { grantMaker: new mongoose.Types.ObjectId(userId), status: 'Approved' } },
            { $lookup: { from: 'grants', localField: 'grant', foreignField: '_id', as: 'grantDetails' } },
            { $unwind: '$grantDetails' },
            { $group: { _id: null, total: { $sum: '$grantDetails.amount' } } }
        ]);
        const totalAwarded = awardedData.length > 0 ? awardedData[0].total : 0;

        const applicationsByCategory = await Grant.aggregate([
             { $match: { grantMaker: new mongoose.Types.ObjectId(userId) } },
             { $lookup: { from: 'applications', localField: '_id', foreignField: 'grant', as: 'apps'}},
             { $project: { category: 1, applicationCount: { $size: '$apps' }}},
             { $group: { _id: '$category', applications: { $sum: '$applicationCount'}}}
        ]);
        
        res.json({
            totalGrants,
            activeGrants,
            totalApplications,
            approvedApplications,
            totalAwarded,
            applicationsByCategory: applicationsByCategory.map(item => ({ name: item._id, applications: item.applications })),
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching dashboard stats." });
    }
};

// @desc    Get stats for the Applicant dashboard
// @route   GET /api/dashboard/applicant
// @access  Private (Applicant)
const getApplicantStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const stats = {
            applicationsSent: await Application.countDocuments({ applicant: userId }),
            inReview: await Application.countDocuments({ applicant: userId, status: 'In Review' }),
            approved: await Application.countDocuments({ applicant: userId, status: 'Approved' }),
            rejected: await Application.countDocuments({ applicant: userId, status: 'Rejected' }),
        };
        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching dashboard stats." });
    }
};

// @desc    Get platform-wide stats for the Super Admin dashboard
// @route   GET /api/dashboard/superadmin
// @access  Private (Super Admin)
const getSuperAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalApplicants = await User.countDocuments({ role: 'Applicant' });
        const totalGrantMakers = await User.countDocuments({ role: 'Grant Maker' });
        const totalGrants = await Grant.countDocuments();
        const totalApplications = await Application.countDocuments();
        
        // --- NEW STATS ---
        const verifiedUsers = await User.countDocuments({ verificationStatus: 'Verified' });
        const unverifiedUsers = await User.countDocuments({ verificationStatus: { $in: ['Unverified', 'Pending'] } });

        const awardedData = await Application.aggregate([
            { $match: { status: 'Approved' } },
            { $lookup: { from: 'grants', localField: 'grant', foreignField: '_id', as: 'grantDetails' } },
            { $unwind: '$grantDetails' },
            { $group: { _id: null, total: { $sum: '$grantDetails.amount' } } }
        ]);
        const totalAwarded = awardedData.length > 0 ? awardedData[0].total : 0;

        res.json({
            totalUsers,
            totalApplicants,
            totalGrantMakers,
            totalGrants,
            totalApplications,
            totalAwarded,
            verifiedUsers,
            unverifiedUsers
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error while fetching Super Admin stats." });
    }
};


module.exports = { getGrantMakerStats, getApplicantStats, getSuperAdminStats };
