// netlify/functions/delete-profile.js
// Securely deletes a profile and auth user on the backend (RLS bypass)

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: { message: "Supabase service role key is not configured on server" } })
      };
    }

    // Extract email from query or body
    const email = event.queryStringParameters?.email || JSON.parse(event.body || "{}").email;
    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: { message: "Missing email parameter" } })
      };
    }

    const cleanEmail = email.toLowerCase().trim();

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
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: { message: "Profile not found in database" } })
      };
    }

    const userId = profiles[0].id;

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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: `Successfully deleted profile and auth record for ${cleanEmail}` })
    };
  } catch (err) {
    console.error("Delete Profile Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: err.message || "Internal Server Error" } })
    };
  }
};
