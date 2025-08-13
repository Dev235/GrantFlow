// controllers/chatbotController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Grant = require('../models/grantModel');

// --- TROUBLESHOOTING STEP ---
// This will print the API key to your backend console when the chatbot is used.
// If it prints 'undefined', it means your .env file is not being loaded correctly.
console.log('GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No - CHECK YOUR .ENV SETUP!');
// --- END TROUBLESHOOTING STEP ---

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @desc    Chat with AI to get grant recommendations
 * @route   POST /api/chatbot/recommend
 * @access  Public
 */
const getGrantRecommendation = async (req, res) => {
  const { prompt, history } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: 'A prompt is required.' });
  }

  try {
    const openGrants = await Grant.find({ status: 'Open' }).select('title description amount category').lean();

    if (openGrants.length === 0) {
        return res.json({ text: "I'm sorry, there are no open grants available at the moment. Please check back later." });
    }

    const grantsListString = openGrants.map(g => 
        `- Title: ${g.title}, Description: ${g.description}, Amount: $${g.amount}, Category: ${g.category}`
    ).join('\n');

    const fullPrompt = `You are "GrantBot", a helpful assistant for the GrantFlow platform. Your goal is to help users find grants that match their needs based on the list of available grants. Be friendly, conversational, and recommend specific grants by title.

Here is the list of currently available grants:
${grantsListString}

A user is looking for a grant. Their message is: "${prompt}"

Based on their message and the list of grants, analyze their request and recommend one or more suitable grants. Explain why the grant(s) you recommend are a good match. If no grants seem to match, politely inform them.`;

    const formattedHistory = (history || []).map(msg => ({
        role: msg.from === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }],
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
            maxOutputTokens: 500,
        },
    });

    const result = await chat.sendMessage(fullPrompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });

  } catch (error) {
    console.error('AI Chatbot Error:', error);
    // Provide a more specific error message to the frontend
    if (error.message.includes('API key not valid')) {
        return res.status(401).json({ message: 'The AI service API key is not valid. Please check the server configuration.' });
    }
    res.status(500).json({ message: 'An error occurred while communicating with the AI assistant.' });
  }
};

module.exports = { getGrantRecommendation };
