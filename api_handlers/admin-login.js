// api/admin-login.js
// Securely authenticates administrative access codes and signs the user in on the backend

const { 
  validateCSRF, 
  sanitizeInput, 
  auditLog, 
  checkLockout, 
  recordFailedAttempt, 
  resetFailedAttempts 
} = require("./security-utils");

module.exports = async (req, res) => {
  // Enable CORS
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
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { email, password } = body || {};

    if (!email || !password) {
      return res.status(400).json({ error: { message: "Missing email or password" } });
    }

    const cleanEmail = sanitizeInput(email).toLowerCase().trim();

    // 1. Lockout Check (Max 5 attempts per 15 minutes per IP/email)
    const lockoutIpKey = `lockout:admin_login:${ip}`;
    const lockoutEmailKey = `lockout:admin_login:${cleanEmail}`;

    const lockoutIpCheck = await checkLockout(lockoutIpKey, 5, 900);
    if (!lockoutIpCheck.allowed) {
      return res.status(423).json({ error: { message: `Too many failed attempts. Lockout active. Please retry in ${lockoutIpCheck.remainingSeconds} seconds.` } });
    }
    const lockoutEmailCheck = await checkLockout(lockoutEmailKey, 5, 900);
    if (!lockoutEmailCheck.allowed) {
      return res.status(423).json({ error: { message: `Too many failed attempts. Lockout active. Please retry in ${lockoutEmailCheck.remainingSeconds} seconds.` } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase configuration is missing on server" } });
    }

    // Write audit log of attempt
    await auditLog(null, cleanEmail, 'admin:login_attempt', {});

    // 2. Database verification: Must exist in profiles as role = 'admin'
    const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(cleanEmail)}&role=eq.admin`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!profileRes.ok) {
      throw new Error(`Profile validation failed: ${await profileRes.text()}`);
    }

    const profiles = await profileRes.json();
    if (!profiles || profiles.length === 0) {
      // Record failed attempts
      await recordFailedAttempt(lockoutIpKey, 900);
      await recordFailedAttempt(lockoutEmailKey, 900);

      await auditLog(null, cleanEmail, 'admin:login_failed_not_admin', {});
      return res.status(401).json({ error: { message: "ACCESS DENIED: Incorrect email or password." } });
    }

    const profile = profiles[0];

    // 3. Authenticate with Supabase Auth API
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: cleanEmail, password })
    });

    if (!authRes.ok) {
      const errText = await authRes.text();
      let errData = {};
      try { errData = JSON.parse(errText); } catch(e) {}
      const errMsg = errData.error_description || errData.error || "";

      // Record failed attempts
      await recordFailedAttempt(lockoutIpKey, 900);
      await recordFailedAttempt(lockoutEmailKey, 900);

      await auditLog(profile.id, cleanEmail, 'admin:login_failed_auth', { error: errMsg || errText });
      return res.status(401).json({ error: { message: "ACCESS DENIED: Incorrect email or password." } });
    }

    const sessionData = await authRes.json();

    // Reset lockouts on successful login
    await resetFailedAttempts(lockoutIpKey);
    await resetFailedAttempts(lockoutEmailKey);

    // Audit log success
    await auditLog(profile.id, cleanEmail, 'admin:login_success', {});

    return res.status(200).json({
      session: sessionData,
      user: {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        username: profile.username
      }
    });

  } catch (err) {
    console.error("Admin Login Endpoint Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
