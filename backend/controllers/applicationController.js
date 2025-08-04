// backend/controllers/applicationController.js
const Application = require('../models/applicationModel');
const Grant = require('../models/grantModel');

// @desc    Create a new application for a grant
// @route   POST /api/applications/:grantId
// @access  Private (Applicant)
const submitApplication = async (req, res) => {
    const { grantId } = req.params;
    const { answers } = req.body;
    try {
        const grant = await Grant.findById(grantId);
        if (!grant) return res.status(404).json({ message: 'Grant not found' });

        // --- SCORE CALCULATION LOGIC ---
        let totalScore = 0;
        const questionMap = new Map();
        grant.applicationQuestions.forEach(q => {
            questionMap.set(q._id.toString(), { points: q.points, questionType: q.questionType });
        });

        // Add questionType to each answer and calculate score
        const answersWithTypes = answers.map(answer => {
            const questionDetails = questionMap.get(answer.questionId.toString());
            if (answer.answer && answer.answer.toString().trim() !== '') {
                 if (questionDetails && questionDetails.points) {
                    totalScore += questionDetails.points;
                }
            }
            return {
                ...answer,
                questionType: questionDetails ? questionDetails.questionType : 'text', // Default to text if not found
            };
        });
        // --- END OF SCORE CALCULATION ---

        const application = new Application({
            grant: grantId,
            applicant: req.user._id,
            grantMaker: grant.grantMaker,
            answers: answersWithTypes, // Use the new array with question types
            score: totalScore,
            status: 'Submitted',
        });

        const createdApplication = await application.save();
        res.status(201).json(createdApplication);
    } catch (error) {
        res.status(400).json({ message: 'Invalid application data', error: error.message });
    }
};

// @desc    Get all applications for a specific grant (for Grant Makers)
// @route   GET /api/applications/grant/:grantId
// @access  Private (Grant Maker, Super Admin)
const getApplicationsForGrant = async (req, res) => {
    try {
        const applications = await Application.find({ grant: req.params.grantId })
            .populate('applicant', 'name email')
            .sort({ score: -1 }); // Sort by score descending by default
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
// @access  Private (Grant Maker, Super Admin)
const updateApplicationStatus = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return res.status(404).json({ message: 'Application not found' });
        
        if (application.grantMaker.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        application.status = req.body.status || application.status;
        const updatedApplication = await application.save();
        res.json(updatedApplication);
    } catch (error) {
        res.status(400).json({ message: 'Invalid data', error: error.message });
    }
};

module.exports = { submitApplication, getApplicationsForGrant, getMyApplications, updateApplicationStatus };
