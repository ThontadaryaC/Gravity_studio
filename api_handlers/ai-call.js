// api_handlers/ai-call.js
// AI Voice Calling Endpoint - Discontinued in favor of AI Chatbot
const { setCorsHeaders } = require("./security-utils");

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "GET, POST, OPTIONS" })) return;
  return res.status(410).json({ 
    error: { message: "AI Voice Calling feature has been discontinued. Clients can chat directly with the AI assistant for any inquiries or support." } 
  });
};
