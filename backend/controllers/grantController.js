// backend/controllers/grantController.js
const Grant = require('../models/grantModel');
const Application = require('../models/applicationModel');
const Notification = require('../models/notificationModel');
const mongoose = require('mongoose');
const { logAction } = require('../utils/auditLogger');


// @desc    Fetch all active grants for the public
// @route   GET /api/grants
// @access  Public
const getOpenGrants = async (req, res) => {
  try {
    const grants = await Grant.find({ status: 'Active' }).populate('grantMaker', 'name email').sort({ createdAt: -1 });
    res.json(grants);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch grants.' });
  }
};

// @desc    Fetch grants created by the logged-in Grant Maker
// @route   GET /api/grants/mygrants
// @access  Private (Grant Maker)
const getMyGrants = async (req, res) => {
    try {
        const grants = await Grant.find({ grantMaker: req.user._id }).sort({ createdAt: -1 });
        res.json(grants);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch your grants.' });
    }
};

// @desc    Fetch all grants on the platform
// @route   GET /api/grants/all
// @access  Private (Super Admin)
const getAllGrants = async (req, res) => {
    try {
        const grants = await Grant.find({}).populate('grantMaker', 'name email').sort({ createdAt: -1 });
        res.json(grants);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch all grants.' });
    }
};

// @desc    Fetch a single grant by ID
// @route   GET /api/grants/:id
// @access  Public
const getGrantById = async (req, res) => {
    try {
        const grant = await Grant.findById(req.params.id);
        if (grant) {
            res.json(grant);
        } else {
            res.status(404).json({ message: 'Grant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a new grant
// @route   POST /api/grants
// @access  Private (Grant Maker)
const createGrant = async (req, res) => {
  if (req.user.verificationStatus !== 'Verified') {
    return res.status(403).json({ message: 'Your account must be verified to create grants.' });
  }
  const { title, description, amount, category, deadline, applicationQuestions, reviewers, approvers, status } = req.body;
  try {
    const grant = new Grant({
      title, description, amount, category, deadline, applicationQuestions,
      grantMaker: req.user._id,
      reviewers,
      approvers,
      status,
    });
    const createdGrant = await grant.save();
    await logAction(req.user, 'GRANT_CREATED', { grantId: createdGrant._id, grantTitle: createdGrant.title });
    
    // Create notifications for assigned reviewers and approvers
    const userIdsToNotify = [...(reviewers || []), ...(approvers || [])];
    const notifications = userIdsToNotify.map(userId => ({
        user: userId,
        message: `You have been assigned to a new grant: "${createdGrant.title}".`,
        link: `/manage/applications/${createdGrant._id}`
    }));
    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }
    
    if (reviewers && reviewers.length > 0) {
        await logAction(req.user, 'GRANT_REVIEWER_ASSIGNED', { grantId: createdGrant._id, reviewers });
    }
     if (approvers && approvers.length > 0) {
        await logAction(req.user, 'GRANT_APPROVER_ASSIGNED', { grantId: createdGrant._id, approvers });
    }
    res.status(201).json(createdGrant);
  } catch (error) {
    res.status(400).json({ message: 'Invalid grant data.', error: error.message });
  }
};

// @desc    Update a grant
// @route   PUT /api/grants/:id
// @access  Private (Grant Maker or Super Admin)
const updateGrant = async (req, res) => {
    const { title, description, amount, category, deadline, status, phase, applicationQuestions, reviewers, approvers } = req.body;
    try {
        const grant = await Grant.findById(req.params.id);

        if (grant) {
            if (grant.grantMaker.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
                return res.status(403).json({ message: 'Not authorized to edit this grant' });
            }

            const oldStatus = grant.status;

            grant.title = title || grant.title;
            grant.description = description || grant.description;
            grant.amount = amount || grant.amount;
            grant.category = category || grant.category;
            grant.deadline = deadline || grant.deadline;
            grant.status = status || grant.status;
            grant.phase = phase || grant.phase;
            grant.applicationQuestions = applicationQuestions || grant.applicationQuestions;
            grant.reviewers = reviewers || grant.reviewers;
            grant.approvers = approvers || grant.approvers;

            const updatedGrant = await grant.save();
            
            if (oldStatus !== updatedGrant.status) {
                 await logAction(req.user, 'GRANT_STATUS_CHANGED', { grantId: updatedGrant._id, grantTitle: updatedGrant.title, from: oldStatus, to: updatedGrant.status });
            } else {
                 await logAction(req.user, 'GRANT_UPDATED', { grantId: updatedGrant._id, grantTitle: updatedGrant.title });
            }

            res.json(updatedGrant);

        } else {
            res.status(404).json({ message: 'Grant not found' });
        }
    } catch (error) {
         res.status(400).json({ message: 'Invalid grant data.', error: error.message });
    }
};

// @desc    Delete a grant
// @route   DELETE /api/grants/:id
// @access  Private (Grant Maker or Super Admin)
const deleteGrant = async (req, res) => {
    try {
        const grant = await Grant.findById(req.params.id);

        if (grant) {
            if (grant.grantMaker.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
                return res.status(401).json({ message: 'Not authorized to delete this grant' });
            }

            const grantDetails = { grantId: grant._id, grantTitle: grant.title };
            await Application.deleteMany({ grant: req.params.id });
            await Grant.deleteOne({ _id: req.params.id });

            await logAction(req.user, 'GRANT_DELETED', grantDetails);
            res.json({ message: 'Grant and associated applications removed' });
        } else {
            res.status(404).json({ message: 'Grant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getGrantsForReview = async (req, res) => {
    try {
        const grants = await Grant.find({ reviewers: req.user._id, status: 'Active' })
                                  .select('title')
                                  .lean();

        const grantsWithCounts = await Promise.all(grants.map(async (grant) => {
            const reviewedCount = await Application.countDocuments({
                grant: grant._id,
                status: { $in: ['Waiting for Approval', 'Approved', 'Rejected'] } 
            });
            const pendingReviewCount = await Application.countDocuments({
                grant: grant._id,
                status: 'In Review'
            });
            return { ...grant, reviewedCount, pendingReviewCount };
        }));

        res.json(grantsWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch grants for review.' });
    }
};

const getGrantsForApproval = async (req, res) => {
    try {
        const grants = await Grant.find({ approvers: req.user._id, status: 'Active' })
                                  .select('title')
                                  .lean();
        
        const grantsWithCounts = await Promise.all(grants.map(async (grant) => {
            const approvedCount = await Application.countDocuments({
                grant: grant._id,
                status: 'Approved'
            });
            // Approvers act on applications that have been reviewed but not yet decided
            const pendingApprovalCount = await Application.countDocuments({
                grant: grant._id,
                status: 'Waiting for Approval'
            });
            return { ...grant, approvedCount, pendingApprovalCount };
        }));

        res.json(grantsWithCounts);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch grants for approval.' });
    }
};

const getReviewCount = async (req, res) => {
    try {
        const grants = await Grant.find({ reviewers: req.user._id, status: 'Active' }).select('_id');
        const grantIds = grants.map(g => g._id);
        const count = await Application.countDocuments({ grant: { $in: grantIds }, status: 'In Review' });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getApprovalCount = async (req, res) => {
    try {
        const grants = await Grant.find({ approvers: req.user._id, status: 'Active' }).select('_id');
        const grantIds = grants.map(g => g._id);
        // Approvers look at applications that are 'Waiting for Approval'
        const count = await Application.countDocuments({ grant: { $in: grantIds }, status: 'Waiting for Approval' });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getOpenGrants, getMyGrants, getAllGrants, getGrantById, createGrant, updateGrant, deleteGrant, getGrantsForReview, getGrantsForApproval, getReviewCount, getApprovalCount };
