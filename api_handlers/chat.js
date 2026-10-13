// Vercel Serverless Function for Gravity AI Chatbot Proxy
// Safeguards the Gemini API Key by keeping it on the server side.

const { checkRateLimit } = require("./security-utils");

module.exports = async (req, res) => {
  // Enable CORS
  const allowedOrigins = [
    "https://antigravitystudios.in",
    "https://www.antigravitystudios.in",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500"
  ];
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  try {
    // Rate limiting: 30 chatbot messages per minute per IP
    const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "global";
    const rateLimitOk = await checkRateLimit(`chat:${ip}`, 30, 60);
    if (!rateLimitOk) {
      return res.status(429).json({ error: { message: "Too many requests. Please wait a moment before trying again." } });
    }

    // Read the secure API Key from the Vercel environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a safe error — never enumerate env var names in responses
      return res.status(500).json({ 
        error: { 
          message: "Gemini API key is not configured on the server. Please add GEMINI_API_KEY in your Vercel environment settings." 
        } 
      });
    }

    // Parse the incoming body from the client
    const clientBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    // Request Google's Gemini API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(clientBody)
    });

    const responseData = await response.json();

    return res.status(response.status).json(responseData);
  } catch (error) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ error: { message: error.message || "Internal Server Error" } });
  }
};
