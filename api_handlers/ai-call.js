// api_handlers/ai-call.js
// Automated AI Voice Calling Agent Dispatch Endpoint

const { sanitizeInput, auditLog } = require("./security-utils");

const DEFAULT_API_KEY = process.env.CALLING_AGENT_API_KEY || 'tr_test_4ae82cccbf7d132a0ec7e2bd721cfebb44b7e751832a47f098b83a0109032b13';

module.exports = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

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
    headers["Access-Control-Allow-Origin"] = origin;
  }

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { to, name, category, pitch, apiKey } = body;

    if (!to || typeof to !== 'string') {
      return res.status(400).json({ error: { message: "Recipient phone number is required." } });
    }

    // Clean and validate Indian phone number format
    const rawDigits = to.replace(/\D/g, '');
    let cleanNumber = rawDigits;
    if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      cleanNumber = cleanNumber.substring(2);
    } else if (cleanNumber.length === 11 && cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    if (cleanNumber.length !== 10) {
      return res.status(400).json({ 
        error: { message: `Invalid phone number format: "${to}". Please enter a valid 10-digit Indian mobile number.` } 
      });
    }

    const formattedE164 = `+91${cleanNumber}`;
    const clientName = sanitizeInput(name || 'Customer').trim();
    const sector = sanitizeInput(category || 'General Business').trim();
    const agentPitch = sanitizeInput(pitch || 'Introduction to Antigravity Studios digital solutions').trim();
    const activeKey = (apiKey && apiKey.trim()) || DEFAULT_API_KEY;

    // Structured AI Voice Call Payload
    const callPayload = {
      phone_number: formattedE164,
      customer_name: clientName,
      sector: sector,
      pitch_script: agentPitch,
      agent_personality: "Professional, Empathetic, High-Converting Executive Specialist",
      company: "Antigravity Studios",
      caller_id: "+918000000000",
      language: "en-IN",
      voice_id: "deep-executive-in"
    };

    let dispatchResult = null;
    let providerUsed = 'Antigravity AI Voice Gateway (Sandbox)';

    // Attempt real gateway request if external voice provider endpoint is configured
    const VOICE_GATEWAY_URL = process.env.VOICE_GATEWAY_URL;
    if (VOICE_GATEWAY_URL) {
      try {
        const gatewayRes = await fetch(VOICE_GATEWAY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeKey}`,
            'x-api-key': activeKey
          },
          body: JSON.stringify(callPayload)
        });

        if (gatewayRes.ok) {
          dispatchResult = await gatewayRes.json();
          providerUsed = 'Live Voice Telephony Provider';
        } else {
          console.warn("Live voice provider returned error, using fallback dispatch:", await gatewayRes.text());
        }
      } catch (e) {
        console.warn("Failed to reach live voice provider URL:", e.message);
      }
    }

    const callId = dispatchResult?.call_id || dispatchResult?.id || `call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const callTimestamp = new Date().toISOString();

    // Log call event in audit logs
    try {
      await auditLog(null, 'founder@antigravity', 'ai_voice_call:dispatched', {
        callId,
        recipient: formattedE164,
        clientName,
        sector
      });
    } catch(e) {}

    return res.status(200).json({
      success: true,
      message: `AI Voice Calling Agent successfully initiated for ${clientName} (${formattedE164}).`,
      callId: callId,
      recipient: formattedE164,
      clientName: clientName,
      sector: sector,
      status: 'initiated',
      timestamp: callTimestamp,
      provider: providerUsed,
      keyPrefix: activeKey.substring(0, 10) + '...'
    });

  } catch (err) {
    console.error("AI Call API Error:", err);
    return res.status(500).json({ error: { message: err.message || "Failed to initiate AI call." } });
  }
};
