// Vercel Serverless Function for Gravity AI Chatbot Proxy
// Safeguards the Gemini API Key by keeping it on the server side.

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
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
    // Read the secure API Key from the Vercel environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Filter out any key names that might sound sensitive just to be safe
      const safeKeys = Object.keys(process.env).filter(k => 
        !k.toLowerCase().includes("key") && 
        !k.toLowerCase().includes("secret") && 
        !k.toLowerCase().includes("password") && 
        !k.toLowerCase().includes("token") &&
        !k.toLowerCase().includes("auth")
      );
      return res.status(500).json({ 
        error: { 
          message: `Gemini API key is not configured on the server. Please add GEMINI_API_KEY in your Vercel dashboard.\n\nAvailable Env Keys: [${safeKeys.join(', ')}]` 
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
