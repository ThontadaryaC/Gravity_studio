// netlify/functions/claim-admin-role.js
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

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: { message: "Method Not Allowed" } })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { role, email, password } = body;

    if (!role || !email || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: { message: "Missing required fields: role, email, password" } })
      };
    }

    const roleUuid = ADMIN_ROLE_UUIDS[role];
    if (!roleUuid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: { message: "Invalid administrative role" } })
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: { message: "Supabase service role key is not configured on server" } })
      };
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
        console.log(`Auth user creation response (might already exist): ${errText}`);
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
      throw new Error("Database upsert failed: " + await upsertRes.text());
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("Claim Admin Role Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: err.message || "Internal Server Error" } })
    };
  }
};
