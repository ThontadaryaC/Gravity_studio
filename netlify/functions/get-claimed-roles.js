// netlify/functions/get-claimed-roles.js
// Public endpoint to retrieve claimed administrative roles

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const keyConfigured = !!serviceRoleKey;

    if (!serviceRoleKey) {
      console.warn("SUPABASE_SERVICE_ROLE_KEY is missing on server.");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ claimed: {}, keyConfigured })
      };
    }

    const roleUuids = Object.values(ADMIN_ROLE_UUIDS);
    const uuidsStr = roleUuids.map(id => `"${id}"`).join(",");
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${uuidsStr})&select=id,email,username`, {
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
    const claimed = {};
    
    data.forEach(profile => {
      const roleKey = Object.keys(ADMIN_ROLE_UUIDS).find(k => ADMIN_ROLE_UUIDS[k] === profile.id);
      if (roleKey) {
        claimed[roleKey] = {
          email: (profile.email || '').toLowerCase().trim(),
          username: profile.username
        };
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ claimed, keyConfigured })
    };
  } catch (err) {
    console.error("Get Claimed Roles Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: err.message || "Internal Server Error" } })
    };
  }
};
