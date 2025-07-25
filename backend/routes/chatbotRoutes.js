// routes/chatbotRoutes.js
// Defines the route for the AI chatbot

const express = require('express');
const router = express.Router();
const { getGrantRecommendation } = require('../controllers/chatbotController');

// @route   /api/chatbot
router.post('/recommend', getGrantRecommendation);

module.exports = router;
