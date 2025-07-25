// controllers/chatbotController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Grant = require('../models/grantModel');

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

    // **FIX**: Map the chat history to the format expected by the Google AI SDK.
    // The SDK expects a 'role' ('user' or 'model') and a 'parts' array.
    const formattedHistory = (history || []).map(msg => ({
        role: msg.from === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }],
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Start the chat with the correctly formatted history
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
    res.status(500).json({ message: 'An error occurred while communicating with the AI assistant.' });
  }
};

module.exports = { getGrantRecommendation };
