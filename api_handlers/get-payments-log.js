// api/get-payments-log.js
// Securely retrieves the payments/transactions log for verified admin accounts only

const { validateCSRF, verifySessionAndRole } = require("./security-utils");

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  const allowedOrigins = [
    "https://antigravitystudios.in",
    "https://www.antigravitystudios.in",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000"
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  // CSRF Check
  if (!validateCSRF(req)) {
    return res.status(403).json({ error: { message: "Access Denied: CSRF verification failed." } });
  }

  try {
    // 1. Verify session and role
    const { isAdmin, error } = await verifySessionAndRole(req);
    if (error) {
      return res.status(401).json({ error: { message: error } });
    }
    if (!isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Server connection is not configured." } });
    }

    // 2. Fetch payments/transactions log (service_role bypasses RLS)
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions?select=*&order=created_at.desc`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!dbRes.ok) {
      throw new Error(`Database transactions query failed: ${await dbRes.text()}`);
    }

    const data = await dbRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error("Get Payments Log API Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
