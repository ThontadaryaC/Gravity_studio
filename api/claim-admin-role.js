// api/claim-admin-role.js
// Securely claims an administrative role on the backend (RLS bypass)

const { validateCSRF, sanitizeInput, checkRateLimit, auditLog } = require("./security-utils");

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
    
    // Rate Limit: Max 10 role-claiming requests per hour per IP
    const rateLimitKey = `claim_admin_role:${ip}`;
    const rateLimitOk = await checkRateLimit(rateLimitKey, 10, 3600);
    if (!rateLimitOk) {
      return res.status(429).json({ error: { message: "Too many claims attempts. Please try again later." } });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { role, email, password } = body || {};

    if (!role || !email || !password) {
      return res.status(400).json({ error: { message: "Missing required fields: role, email, password" } });
    }

    const cleanRole = sanitizeInput(role);
    const cleanEmail = sanitizeInput(email).toLowerCase().trim();
    const cleanPassword = password; // Do not html-sanitize passwords as it might corrupt special characters

    const expectedUsername = `admin_role:${cleanRole}|pwd:${cleanPassword}`;
    const roleUuid = ADMIN_ROLE_UUIDS[cleanRole];
    if (!roleUuid) {
      return res.status(400).json({ error: { message: "Invalid administrative role" } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase service role configuration is missing on server" } });
    }

    // Write audit log of attempt
    await auditLog(null, cleanEmail, 'admin:claim_attempt', { role: cleanRole });

    // Fetch all claimed admin roles first to check if the role is already claimed or if the email is already associated with any other admin role
    const uuidsStr = Object.values(ADMIN_ROLE_UUIDS).map(id => `"${id}"`).join(",");
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${uuidsStr})&select=id,email`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!dbRes.ok) {
      throw new Error(`Database fetch failed: ${await dbRes.text()}`);
    }

    const data = await dbRes.json();
    
    // Check if the role is already claimed
    const isRoleClaimed = data.some(p => p.id === roleUuid);
    if (isRoleClaimed) {
      return res.status(400).json({ error: { message: "This administrative position is already claimed." } });
    }

    // Check if email is already claimed by any other admin role
    const isEmailClaimed = data.some(p => (p.email || '').toLowerCase().trim() === cleanEmail);
    if (isEmailClaimed) {
      return res.status(400).json({ error: { message: "This email is already associated with another administrative role." } });
    }

    // Check if the email already exists under a different user ID, and if so, delete it first
    try {
      let existingId = null;

      const profileCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(cleanEmail)}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      });
      if (profileCheckRes.ok) {
        const profiles = await profileCheckRes.json();
        if (profiles && profiles.length > 0) {
          existingId = profiles[0].id;
        }
      }

      if (!existingId) {
        const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey
          }
        });
        if (listRes.ok) {
          const resData = await listRes.json();
          const users = resData.users || resData || [];
          const matchedUser = users.find(u => (u.email || '').toLowerCase().trim() === cleanEmail);
          if (matchedUser) {
            existingId = matchedUser.id;
          }
        }
      }

      if (existingId && existingId !== roleUuid) {
        console.log(`Deleting existing user ID ${existingId} for admin override.`);
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${existingId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey
          }
        });
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey
          }
        });
      }
    } catch (cleanupErr) {
      console.warn("Failed to clean up existing user by email:", cleanupErr.message);
    }

    // 1. Create the user in auth.users using admin API
    try {
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
        
        if (errMsg.includes("already exists") || errMsg.includes("already registered") || errText.includes("already exists") || errText.includes("already registered")) {
          return res.status(400).json({ error: { message: "A user with this email address already exists in Supabase. Please use a different or completely fresh email address." } });
        }

        // Verify if it exists under the correct ID
        const checkUserRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${roleUuid}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey
          }
        });
        if (!checkUserRes.ok) {
          return res.status(400).json({ error: { message: `Supabase auth user creation failed: ${errMsg || errText}` } });
        }
      }
    } catch (authErr) {
      return res.status(500).json({ error: { message: `Auth creation system error: ${authErr.message}` } });
    }

    // 2. Insert/Upsert the profile record in profiles table
    // EXPLICITLY specify role: 'admin' to bypass trigger defaults. Since this is service_role, the trigger will accept it.
    const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        id: roleUuid,
        email: cleanEmail,
        username: expectedUsername,
        role: 'admin'
      })
    });

    if (!upsertRes.ok) {
      throw new Error(`Database upsert failed: ${await upsertRes.text()}`);
    }

    // Write audit log of success
    await auditLog(roleUuid, cleanEmail, 'admin:claim_success', { role: cleanRole });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Claim Admin Role Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
