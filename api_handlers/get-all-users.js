// api/get-all-users.js
// Securely verifies the user's Supabase JWT and returns a list of all accounts from auth.users (Admin-only)

const { setCorsHeaders, verifySessionAndRole } = require("./security-utils");

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "GET, OPTIONS" })) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  try {
    const { user, isAdmin, error } = await verifySessionAndRole(req);
    if (error) {
      return res.status(401).json({ error: { message: error } });
    }
    if (!isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Server configuration error: missing Supabase credentials" } });
    }

    // Call GoTrue Admin API to list users
    const listResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!listResponse.ok) {
      const errText = await listResponse.text();
      return res.status(500).json({ error: { message: `Failed to fetch users: ${errText}` } });
    }

    const data = await listResponse.json();
    
    // Return clean user list
    const users = (data.users || []).map(u => ({
      id: u.id,
      email: u.email,
      username: u.user_metadata?.username || u.email.split('@')[0],
      avatar_url: u.user_metadata?.avatar_url || ''
    }));

    return res.status(200).json({ users });
  } catch (err) {
    console.error("System error in get-all-users:", err);
    return res.status(500).json({ error: { message: `System error: ${err.message}` } });
  }
};
