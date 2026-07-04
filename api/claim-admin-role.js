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
    const isEmailClaimed = data.some(p => (p.email || '').toLowerCase().trim() === email.toLowerCase().trim());
    if (isEmailClaimed) {
      return res.status(400).json({ error: { message: "This email is already associated with another administrative role." } });
    }

    // Check if the email already exists under a different user ID, and if so, delete it first
    try {
      let existingId = null;

      // 1. Check profiles table first (direct database query)
      const profileCheckRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(email.toLowerCase().trim())}`, {
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

      // 2. Check GoTrue users list if not found in profiles
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
          const matchedUser = users.find(u => (u.email || '').toLowerCase().trim() === email.toLowerCase().trim());
          if (matchedUser) {
            existingId = matchedUser.id;
          }
        }
      }

      // 3. Delete existing user if ID differs from the admin roleUuid
      if (existingId && existingId !== roleUuid) {
        console.log(`Found existing user with email ${email} and ID ${existingId}. Deleting it first to claim admin role...`);
        // Delete profile
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${existingId}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey
          }
        });
        // Delete user from auth
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

    // 1. Create the user in auth.users using the admin API first (if not already exists)
    // This resolves the foreign key constraint on the profiles table
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
          email: email,
          password: password,
          email_confirm: true
        })
      });
      if (!createUserRes.ok) {
        const errText = await createUserRes.text();
        console.log(`Auth user creation response: ${errText}`);
        
        let errData = {};
        try { errData = JSON.parse(errText); } catch(e) {}
        const errMsg = errData.msg || errData.message || "";
        
        if (errMsg.includes("already exists") || errMsg.includes("already registered") || errText.includes("already exists") || errText.includes("already registered")) {
          return res.status(400).json({ error: { message: "A user with this email address already exists in Supabase. Please use a different or completely fresh email address." } });
        }
      }
    } catch (authErr) {
      console.warn("Failed to create auth user:", authErr.message);
    }

    // 2. Insert/Upsert the profile in the profiles table (now the foreign key check will succeed!)
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
