// Netlify Serverless Function for Gravity AI Chatbot Proxy
// Safeguards the Gemini API Key by keeping it on the server side.

exports.handler = async function (event, context) {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: { message: "Method Not Allowed" } })
    };
  }

  try {
    // Read the secure API Key from the Netlify environment variables
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
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          error: { 
            message: `Gemini API key is not configured on the server. Please add GEMINI_API_KEY in your Netlify dashboard.\n\nAvailable Env Keys: [${safeKeys.join(', ')}]` 
          } 
        })
      };
    }

    // Parse the incoming body from the client (contains contents, systemInstruction, etc.)
    const clientBody = JSON.parse(event.body);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Request Google's Gemini API
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(clientBody)
    });

    const responseData = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: { message: error.message || "Internal Server Error" } })
    };
  }
};
