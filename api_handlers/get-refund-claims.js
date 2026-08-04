// api/get-refund-claims.js
// Securely retrieves all refund claims with purchases and profiles for verified admin accounts only

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

    // 2. Fetch refunds and profiles (service_role bypasses RLS)
    const refundsRes = await fetch(`${SUPABASE_URL}/rest/v1/refunds?select=*,purchases(*)&order=created_at.desc`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!refundsRes.ok) {
      throw new Error(`Database query failed: ${await refundsRes.text()}`);
    }
    const refundsData = await refundsRes.json();

    const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,username,email`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!profilesRes.ok) {
      throw new Error(`Profiles query failed: ${await profilesRes.text()}`);
    }
    const profilesData = await profilesRes.json();

    // Map profiles into structure matching frontend expectation
    const profilesMap = {};
    profilesData.forEach(p => {
      profilesMap[p.id] = p;
    });

    const enrichedRefunds = refundsData.map(r => {
      if (r.purchases) {
        r.purchases.profiles = profilesMap[r.purchases.user_id] || null;
      }
      return r;
    });

    return res.status(200).json(enrichedRefunds);

  } catch (err) {
    console.error("Get Refund Claims API Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
