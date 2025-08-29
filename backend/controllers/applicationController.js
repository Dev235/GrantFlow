// backend/controllers/applicationController.js
const Application = require('../models/applicationModel');
const Grant = require('../models/grantModel');
const Notification = require('../models/notificationModel');
const { logAction } = require('../utils/auditLogger');


// @desc    Create a new application for a grant
// @route   POST /api/applications/:grantId
// @access  Private (Applicant)
const submitApplication = async (req, res) => {
    if (req.user.verificationStatus !== 'Verified') {
        return res.status(403).json({ message: 'Your account must be verified to apply for grants.' });
    }
    const { grantId } = req.params;
    const { answers } = req.body;
    try {
        const grant = await Grant.findById(grantId);
        if (!grant) return res.status(404).json({ message: 'Grant not found' });

        const questionMap = new Map();
        grant.applicationQuestions.forEach(q => {
            questionMap.set(q._id.toString(), { points: q.points, questionType: q.questionType });
        });

        const answersWithTypes = answers.map(answer => {
            const questionDetails = questionMap.get(answer.questionId.toString());
            return {
                ...answer,
                questionType: questionDetails ? questionDetails.questionType : 'text',
            };
        });

        const application = new Application({
            grant: grantId,
            applicant: req.user._id,
            grantMaker: grant.grantMaker,
            answers: answersWithTypes,
            score: 0,
            status: 'Submitted',
        });

        const createdApplication = await application.save();
        await logAction(req.user, 'APPLICATION_SUBMITTED', { applicationId: createdApplication._id, grantId: grant._id });

        // Notify reviewers that a new application is ready
        if (grant.reviewers && grant.reviewers.length > 0) {
            const pendingReviewCount = await Application.countDocuments({ grant: grantId, status: 'Submitted' });
            const reviewNotifications = grant.reviewers.map(reviewerId => ({
                user: reviewerId,
                message: `There are now ${pendingReviewCount} application(s) for "${grant.title}" ready for your review.`,
                link: `/manage/applications/${grant._id}`
            }));
            await Notification.insertMany(reviewNotifications);
        }

        res.status(201).json(createdApplication);
    } catch (error) {
        res.status(400).json({ message: 'Invalid application data', error: error.message });
    }
};

// @desc    Score an application
// @route   PUT /api/applications/:id/score
// @access  Private (Reviewer)
const scoreApplication = async (req, res) => {
    try {
        const { answers } = req.body;
        const application = await Application.findById(req.params.id);

        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        // FIX: Fetch the grant to validate scores against max points.
        const grant = await Grant.findById(application.grant);
        if (!grant) {
            return res.status(404).json({ message: 'Associated grant not found' });
        }

        const questionPointsMap = new Map(
            grant.applicationQuestions.map(q => [q._id.toString(), q.points])
        );

        let totalScore = 0;
        application.answers.forEach(appAnswer => {
            const submittedAnswer = answers.find(a => a._id.toString() === appAnswer._id.toString());
            if (submittedAnswer) {
                const maxPoints = questionPointsMap.get(appAnswer.questionId.toString()) || 0;
                let score = Number(submittedAnswer.reviewerScore) || 0;

                // FIX: Check if the score exceeds the max points for the question.
                if (score > maxPoints) {
                    score = maxPoints; // Cap the score at the maximum allowed.
                }
                if (score < 0) {
                    score = 0; // Score cannot be negative.
                }

                appAnswer.reviewerScore = score;
                appAnswer.reviewerComments = submittedAnswer.reviewerComments || '';
                totalScore += score;
            }
        });

        application.score = totalScore;
        application.reviewedBy = req.user._id;

        const updatedApplication = await application.save();
        await logAction(req.user, 'APPLICATION_SCORED', { applicationId: application._id, score: totalScore });
        res.json(updatedApplication);

    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};


// @desc    Get all applications for a specific grant
// @route   GET /api/applications/grant/:grantId
// @access  Private (Grant Maker, Super Admin, Reviewer, Approver)
const getApplicationsForGrant = async (req, res) => {
    try {
        const applications = await Application.find({ grant: req.params.grantId })
            .populate('applicant', 'name email')
            .populate('reviewedBy', 'name')
            .populate('approvedBy', 'name')
            .sort({ score: -1 });
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get all applications submitted by the logged-in user (for Applicants)
// @route   GET /api/applications/my
// @access  Private (Applicant)
const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ applicant: req.user._id })
            .populate('grant', 'title category');
        res.json(applications);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Update an application's status
// @route   PUT /api/applications/:id/status
// @access  Private (Super Admin, Approver, Reviewer)
const updateApplicationStatus = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id).populate('grant', 'title reviewers approvers');
        if (!application) return res.status(404).json({ message: 'Application not found' });
        
        const oldStatus = application.status;
        const newStatus = req.body.status;
        const notifications = [];

        application.status = newStatus || application.status;

        let auditEvent = 'APPLICATION_STATUS_CHANGED';

        // Notify approvers when an application is ready for them
        if (newStatus === 'Waiting for Approval' && oldStatus !== 'Waiting for Approval') {
            if (application.grant.approvers && application.grant.approvers.length > 0) {
                const pendingApprovalCount = await Application.countDocuments({ grant: application.grant._id, status: 'Waiting for Approval' }) + 1; // +1 for the current one
                application.grant.approvers.forEach(approverId => {
                    notifications.push({
                        user: approverId,
                        message: `You have ${pendingApprovalCount} application(s) awaiting approval for grant: "${application.grant.title}".`,
                        link: `/manage/applications/${application.grant._id}`
                    });
                });
            }
        }
        
        // Notify original reviewer if an approver requests re-evaluation
        if (newStatus === 'In Review' && oldStatus === 'Waiting for Approval') {
            auditEvent = 'APPLICATION_REEVALUATION_REQUESTED';
            if (application.reviewedBy) {
                const reevaluationCount = await Application.countDocuments({
                    grant: application.grant._id,
                    reviewedBy: application.reviewedBy,
                    status: 'In Review'
                }) + 1; // +1 for the current one being sent back
                notifications.push({
                    user: application.reviewedBy,
                    message: `You have ${reevaluationCount} application(s) to re-evaluate for the grant: "${application.grant.title}".`,
                    link: `/manage/applications/${application.grant._id}`
                });
            }
        }

        if (newStatus === 'Approved') {
            application.approvedBy = req.user._id;
            auditEvent = 'APPLICATION_APPROVED';
        } else if (newStatus === 'Rejected') {
            auditEvent = 'APPLICATION_REJECTED';
        }
        
        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        const updatedApplication = await application.save();
        await logAction(req.user, auditEvent, { applicationId: application._id, from: oldStatus, to: updatedApplication.status });
        res.json(updatedApplication);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

// @desc    Update an application's flag
// @route   PUT /api/applications/:id/flag
// @access  Private (Grant Maker, Super Admin, Reviewer)
const updateApplicationFlag = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }

        const oldFlag = application.flag;
        application.flag = req.body.flag || null;
        const updatedApplication = await application.save();
        await logAction(req.user, 'APPLICATION_FLAG_CHANGED', { applicationId: application._id, from: oldFlag, to: updatedApplication.flag });
        res.json(updatedApplication);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};


module.exports = { submitApplication, getApplicationsForGrant, getMyApplications, updateApplicationStatus, updateApplicationFlag, scoreApplication };

