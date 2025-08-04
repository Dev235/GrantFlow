// controllers/grantController.js
const Grant = require('../models/grantModel');
const Application = require('../models/applicationModel');

// @desc    Fetch all open grants
// @route   GET /api/grants
// @access  Public
const getOpenGrants = async (req, res) => {
  try {
    const grants = await Grant.find({ status: 'Open' }).populate('grantMaker', 'name email').sort({ createdAt: -1 });
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
  const { title, description, amount, category, deadline, applicationQuestions } = req.body;
  try {
    const grant = new Grant({
      title, description, amount, category, deadline, applicationQuestions,
      grantMaker: req.user._id,
    });
    const createdGrant = await grant.save();
    res.status(201).json(createdGrant);
  } catch (error) {
    res.status(400).json({ message: 'Invalid grant data.', error: error.message });
  }
};

// @desc    Update a grant
// @route   PUT /api/grants/:id
// @access  Private (Grant Maker or Super Admin)
const updateGrant = async (req, res) => {
    const { title, description, amount, category, deadline, status, applicationQuestions } = req.body;
    try {
        const grant = await Grant.findById(req.params.id);

        if (grant) {
            // Allow edit if user is the owner OR a Super Admin
            if (grant.grantMaker.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
                return res.status(401).json({ message: 'Not authorized to edit this grant' });
            }

            grant.title = title || grant.title;
            grant.description = description || grant.description;
            grant.amount = amount || grant.amount;
            grant.category = category || grant.category;
            grant.deadline = deadline || grant.deadline;
            grant.status = status || grant.status;
            grant.applicationQuestions = applicationQuestions || grant.applicationQuestions;

            const updatedGrant = await grant.save();
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
            // Allow delete if user is the owner OR a Super Admin
            if (grant.grantMaker.toString() !== req.user._id.toString() && req.user.role !== 'Super Admin') {
                return res.status(401).json({ message: 'Not authorized to delete this grant' });
            }

            await Application.deleteMany({ grant: req.params.id });
            await Grant.deleteOne({ _id: req.params.id });

            res.json({ message: 'Grant and associated applications removed' });
        } else {
            res.status(404).json({ message: 'Grant not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};


module.exports = { getOpenGrants, getMyGrants, getAllGrants, getGrantById, createGrant, updateGrant, deleteGrant };
