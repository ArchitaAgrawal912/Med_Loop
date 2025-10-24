// File: backend/routes/chatbot.js

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Ensure user is logged in
const { OpenAI } = require('openai'); // Use OpenAI package

// Configure OpenAI client
// IMPORTANT: Ensure OPENAI_API_KEY is in your .env file
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * @route   POST /api/chatbot/ask
 * @desc    Ask the chatbot a question about medicine
 * @access  Private (User Only)
 */
router.post('/ask', auth, async (req, res) => {
    const { question } = req.body;

    if (!question) {
        return res.status(400).json({ msg: 'Please provide a question.' });
    }

    try {
        console.log("Asking OpenAI:", question); // Log for debugging

        // Make the API call to OpenAI (adjust model and prompt as needed)
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Or use a newer model if preferred
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant providing information about medicines. Be concise and informative. Do not provide medical advice, diagnosis, or treatment recommendations. Always advise users to consult a healthcare professional for medical concerns."
                },
                {
                    role: "user",
                    content: question
                }
            ],
            max_tokens: 150, // Limit response length
        });

        // Extract the response text
        const answer = completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't get a response.";
        console.log("OpenAI Response:", answer); // Log for debugging

        res.json({ answer });

    } catch (err) {
        console.error("OpenAI API Error:", err.response ? err.response.data : err.message); // Log detailed error
        // Provide a user-friendly error message
        let errorMessage = 'Sorry, I encountered an error trying to get an answer.';
        if (err.response && err.response.status === 401) {
            errorMessage = 'API key issue. Please check server configuration.'; // More specific for auth errors
        } else if (err.code === 'insufficient_quota') {
             errorMessage = 'API quota exceeded. Please check your OpenAI plan.';
        }
        res.status(500).json({ msg: errorMessage });
    }
});

module.exports = router;