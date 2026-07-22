// api/claim-admin-role.js
// Securely claims an administrative role on the backend (RLS bypass)

const crypto = require("crypto");
const { 
  validateCSRF, 
  sanitizeInput, 
  checkRateLimit, 
  auditLog, 
  checkLockout, 
  recordFailedAttempt, 
  resetFailedAttempts 
} = require("./security-utils");

const ADMIN_ROLE_UUIDS = {
  'founder': 'f0000000-0000-0000-0000-000000000001',
  'ceo': 'c0000000-0000-0000-0000-000000000002',
  'ai': 'a0000000-0000-0000-0000-000000000003',
  'dev': 'd0000000-0000-0000-0000-000000000004',
  'design': 'e0000000-0000-0000-0000-000000000005',
  'video': 'b0000000-0000-0000-0000-000000000006',
  'marketing': 'b0000000-0000-0000-0000-000000000007',
  'support': 'b0000000-0000-0000-0000-000000000008'
};

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
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
    const { role, email, password } = body || {};

    if (!role || !email || !password) {
      return res.status(400).json({ error: { message: "Missing required fields: role, email, password" } });
    }

    const cleanRole = sanitizeInput(role);
    const cleanEmail = sanitizeInput(email).toLowerCase().trim();
    const cleanPassword = password;

    const roleUuid = ADMIN_ROLE_UUIDS[cleanRole];
    if (!roleUuid) {
      return res.status(400).json({ error: { message: "Invalid administrative role" } });
    }

    // 1. Lockout Check (Max 5 attempts per 15 minutes per IP/email)
    const lockoutIpKey = `lockout:claim_role:${ip}`;
    const lockoutEmailKey = `lockout:claim_role:${cleanEmail}`;

    const lockoutIpCheck = await checkLockout(lockoutIpKey, 5, 900);
    if (!lockoutIpCheck.allowed) {
      return res.status(423).json({ error: { message: `Too many failed attempts. Lockout active. Please retry in ${lockoutIpCheck.remainingSeconds} seconds.` } });
    }
    const lockoutEmailCheck = await checkLockout(lockoutEmailKey, 5, 900);
    if (!lockoutEmailCheck.allowed) {
      return res.status(423).json({ error: { message: `Too many failed attempts. Lockout active. Please retry in ${lockoutEmailCheck.remainingSeconds} seconds.` } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase service role configuration is missing on server" } });
    }

    // Write audit log of attempt
    await auditLog(null, cleanEmail, 'admin:claim_attempt', { role: cleanRole });

    // 2. Validate Secure Access Code (password) Hashed Check
    const submittedHash = crypto.createHash("sha256").update(cleanPassword).digest("hex");

    const codeRes = await fetch(`${SUPABASE_URL}/rest/v1/admin_codes?role=eq.${encodeURIComponent(cleanRole)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!codeRes.ok) {
      throw new Error(`Failed to query database for access code: ${await codeRes.text()}`);
    }

    const codeData = await codeRes.json();
    if (!codeData || codeData.length === 0 || codeData[0].code_hash !== submittedHash) {
      // Record failed attempts
      await recordFailedAttempt(lockoutIpKey, 900);
      await recordFailedAttempt(lockoutEmailKey, 900);

      await auditLog(null, cleanEmail, 'admin:claim_failed_access_code', { role: cleanRole });
      return res.status(401).json({ error: { message: "ACCESS DENIED: Invalid Secure Access Code for this position." } });
    }

    // 3. Atomic checks: Check if already claimed or email bound
    const profilesRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${roleUuid}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (profilesRes.ok) {
      const profiles = await profilesRes.json();
      if (profiles && profiles.length > 0) {
        return res.status(400).json({ error: { message: "ACCESS DENIED: This position is already claimed." } });
      }
    }

    const emailCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(cleanEmail)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (emailCheckRes.ok) {
      const emailProfiles = await emailCheckRes.json();
      if (emailProfiles && emailProfiles.length > 0) {
        return res.status(400).json({ error: { message: "ACCESS DENIED: This email is already associated with another corporate position." } });
      }
    }

    // 4. Create the GoTrue Auth User (ensures atomic uniqueness on primary key and email)
    const expectedUsername = `admin_role:${cleanRole}|pwd:${cleanPassword}`;
    const createUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: roleUuid,
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          username: expectedUsername,
          avatar_url: `https://kivfatgytkjqoreltuyu.supabase.co/storage/v1/object/public/gallery-assets/logo.png`
        }
      })
    });

    if (!createUserRes.ok) {
      const errText = await createUserRes.text();
      let errData = {};
      try { errData = JSON.parse(errText); } catch(e) {}
      const errMsg = errData.msg || errData.message || "";
      
      await auditLog(null, cleanEmail, 'admin:claim_failed_auth_create', { role: cleanRole, error: errMsg || errText });
      return res.status(400).json({ error: { message: `Registration failed: ${errMsg || "User already exists or duplicate email"}` } });
    }

    // 5. Insert profile record (bypasses RLS using service_role)
    const profileInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: roleUuid,
        email: cleanEmail,
        username: expectedUsername,
        role: 'admin'
      })
    });

    if (!profileInsertRes.ok) {
      // Clean up Auth user to remain consistent
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${roleUuid}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      });
      throw new Error(`Profile creation failed: ${await profileInsertRes.text()}`);
    }

    // Reset failed lockouts on successful claim
    await resetFailedAttempts(lockoutIpKey);
    await resetFailedAttempts(lockoutEmailKey);

    // Audit log success
    await auditLog(roleUuid, cleanEmail, 'admin:claim_success', { role: cleanRole });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Claim Admin Role Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
