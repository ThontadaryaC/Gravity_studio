// api/delete-profile.js
// Securely deletes a profile and auth user on the backend (RLS bypass)

const { validateCSRF, checkRateLimit, auditLog, verifySessionAndRole } = require("./security-utils");

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  // CSRF Check
  if (!validateCSRF(req)) {
    return res.status(403).json({ error: { message: "Access Denied: CSRF verification failed." } });
  }

  try {
    // 1. Verify session and role
    const { user, isAdmin, error } = await verifySessionAndRole(req);
    if (error) {
      return res.status(401).json({ error: { message: error } });
    }
    if (!isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
    }

    // Rate Limiting (50 profile deletions per hour per IP)
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const rateLimitKey = `delete_profile:${user.id}:${ip}`;
    const rateLimitOk = await checkRateLimit(rateLimitKey, 50, 3600);
    if (!rateLimitOk) {
      return res.status(429).json({ error: { message: "Too many delete requests. Please wait." } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Server configuration error: missing Supabase credentials" } });
    }

    // Extract email from query or body
    const emailToDel = req.query?.email || req.body?.email;
    if (!emailToDel) {
      return res.status(400).json({ error: { message: "Missing email parameter" } });
    }

    const cleanEmail = emailToDel.toLowerCase().trim();

    // 1. Find the profile record to get the User ID
    const findRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(cleanEmail)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!findRes.ok) {
      throw new Error(`Failed to query profile: ${await findRes.text()}`);
    }

    const profiles = await findRes.json();
    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ error: { message: "Profile not found in database" } });
    }

    const userId = profiles[0].id;

    // Write audit log before execution
    await auditLog(user.id, user.email, 'admin:delete_profile', { targetEmail: cleanEmail, targetUserId: userId });

    // 2. Delete from public.profiles table
    const delProfileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!delProfileRes.ok) {
      throw new Error(`Failed to delete profile: ${await delProfileRes.text()}`);
    }

    // 3. Delete from auth.users table using GoTrue Admin API
    const delAuthRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!delAuthRes.ok) {
      console.log(`Auth user deletion response (might not exist in auth): ${await delAuthRes.text()}`);
    }

    return res.status(200).json({ success: true, message: `Successfully deleted profile and auth record for ${cleanEmail}` });
  } catch (err) {
    console.error("Delete Profile Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
