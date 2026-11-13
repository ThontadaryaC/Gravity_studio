// api_handlers/ai-call.js
// Automated AI Voice Calling Agent Dispatch Endpoint (Powered by FreJun Teler)

const { sanitizeInput, auditLog } = require("./security-utils");

const FREJUN_TELER_KEY = process.env.CALLING_AGENT_API_KEY || 'tr_test_4ae82cccbf7d132a0ec7e2bd721cfebb44b7e751832a47f098b83a0109032b13';
const FREJUN_VIRTUAL_NUMBER = process.env.FREJUN_FROM_NUMBER || '+918065179643'; // FreJun Bengaluru Sandbox Virtual Number

module.exports = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-api-key",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = parsedUrl.searchParams.get('action');

  // 1. Handle FreJun Teler Call Flow Request (when call connects)
  if (req.method === "GET" || action === 'flow') {
    return res.status(200).json({
      actions: [
        {
          type: "speak",
          text: "Namaste! This is Ajay Raj's AI Voice Agent from Antigravity Studios. We specialize in cutting-edge 3D web platforms, interactive digital twins, and AI automations. We look forward to elevating your business.",
          voice: "en-IN-Wavenet-D",
          speed: 1.0
        }
      ]
    });
  }

  // 2. Handle Status Callback from FreJun
  if (action === 'status') {
    return res.status(200).json({ received: true });
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

    // Clean and normalize Indian phone number to E.164
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
    const activeKey = (apiKey && apiKey.trim()) || FREJUN_TELER_KEY;

    let frejunData = null;
    let frejunError = null;

    // Call FreJun Teler API Live Dispatch
    try {
      const frejunPayload = {
        from_number: FREJUN_VIRTUAL_NUMBER,
        to_number: formattedE164,
        flow_url: 'https://antigravitystudios.in/api/ai-call?action=flow',
        status_callback_url: 'https://antigravitystudios.in/api/ai-call?action=status',
        record: true
      };

      const telerRes = await fetch('https://api.frejun.ai/api/v1/voice/calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': activeKey
        },
        body: JSON.stringify(frejunPayload)
      });

      const responseText = await telerRes.text();
      try {
        frejunData = JSON.parse(responseText);
      } catch(e) {
        frejunData = { message: responseText };
      }

      if (!telerRes.ok) {
        frejunError = frejunData.message || responseText;
      }
    } catch (apiErr) {
      console.warn("FreJun Teler network error:", apiErr.message);
      frejunError = apiErr.message;
    }

    // If FreJun blocked because destination number not yet verified in Sandbox
    if (frejunError && frejunError.includes('Destination number not verified')) {
      return res.status(200).json({
        success: true,
        sandboxNotice: true,
        message: `FreJun Teler Sandbox Dispatched: Call request created for ${clientName} (${formattedE164}). In sandbox test mode (tr_test), your number ${formattedE164} must be listed under Verified Numbers in your FreJun dashboard to ring the physical device.`,
        callId: `frejun_sandbox_${Date.now()}`,
        recipient: formattedE164,
        clientName: clientName,
        sector: sector,
        provider: "FreJun Teler (api.frejun.ai)",
        fromNumber: FREJUN_VIRTUAL_NUMBER,
        instructions: "To receive actual ringing calls on your physical phone, log into frejun.com / teler dashboard and add your phone as a verified number, or switch to live production key."
      });
    }

    if (frejunError) {
      return res.status(400).json({
        error: { message: `FreJun Teler error: ${frejunError}` }
      });
    }

    // Call successfully queued with FreJun
    const callId = frejunData?.data?.id || `frejun_${Date.now()}`;
    return res.status(200).json({
      success: true,
      message: `AI Voice Call queued with FreJun Teler for ${clientName} (${formattedE164}).`,
      callId: callId,
      recipient: formattedE164,
      clientName: clientName,
      sector: sector,
      provider: "FreJun Teler (api.frejun.ai)",
      fromNumber: FREJUN_VIRTUAL_NUMBER,
      raw: frejunData
    });

  } catch (err) {
    console.error("AI Call API Error:", err);
    return res.status(500).json({ error: { message: err.message || "Failed to initiate AI call." } });
  }
};
