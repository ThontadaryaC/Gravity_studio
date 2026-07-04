// api/claim-admin-role.js
// Securely claims an administrative role on the backend (RLS bypass)

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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { role, email, password } = body || {};

    if (!role || !email || !password) {
      return res.status(400).json({ error: { message: "Missing required fields: role, email, password" } });
    }

    const roleUuid = ADMIN_ROLE_UUIDS[role];
    if (!roleUuid) {
      return res.status(400).json({ error: { message: "Invalid administrative role" } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase service role key is not configured on server" } });
    }

    // 1. Check if the role is already claimed in DB
    const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${roleUuid}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!checkRes.ok) {
      throw new Error(`Database check failed: ${await checkRes.text()}`);
    }

    const existing = await checkRes.json();
    if (existing && existing.length > 0) {
      return res.status(409).json({ error: { message: "This corporate position has already been claimed" } });
    }

    // 2. Check if the email is already used for another role in DB
    const emailCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!emailCheckRes.ok) {
      throw new Error(`Database email check failed: ${await emailCheckRes.text()}`);
    }

    const existingEmail = await emailCheckRes.json();
    if (existingEmail && existingEmail.length > 0) {
      return res.status(409).json({ error: { message: "This email is already associated with another corporate position" } });
    }

    // 3. Insert the role binding
    const expectedUsername = `admin_role:${role}|pwd:${password}`;
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
        email: email,
        username: expectedUsername
      })
    });

    if (!upsertRes.ok) {
      throw new Error(`Database upsert failed: ${await upsertRes.text()}`);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Claim Admin Role Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
