// api/get-all-users.js
// Securely verifies the user's Supabase JWT and returns a list of all accounts from auth.users (Admin-only)

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: { message: "Unauthorized: Missing Authorization Header" } });
    }

    const token = authHeader.split(" ")[1];
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Server configuration error: missing Supabase credentials" } });
    }

    // Call Supabase Auth API to verify the JWT token
    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY
      }
    });

    if (!userResponse.ok) {
      const errDetails = await userResponse.text();
      console.warn("Supabase Auth verification failed:", errDetails);
      return res.status(401).json({ error: { message: "Unauthorized: Invalid or expired session token" } });
    }

    const requester = await userResponse.json();

    const ADMIN_ROLE_UUIDS = [
      'f0000000-0000-0000-0000-000000000001', // founder
      'c0000000-0000-0000-0000-000000000002', // ceo
      'a0000000-0000-0000-0000-000000000003', // ai
      'd0000000-0000-0000-0000-000000000004', // dev
      'e0000000-0000-0000-0000-000000000005', // design
      'b0000000-0000-0000-0000-000000000006', // video
      'b0000000-0000-0000-0000-000000000007', // marketing
      'b0000000-0000-0000-0000-000000000008'  // support
    ];

    // Verify Admin Authorization (corporate domain, custom metadata, admin role UUID or founder email)
    const email = requester.email || "";
    const isAdmin = email.endsWith("@gravitystudios.com") || 
                    email === "admin@gravitystudios.com" || 
                    email === "thontadaryacapt8073@gmail.com" ||
                    email === "antigravitystudios1@gmail.com" ||
                    ADMIN_ROLE_UUIDS.includes(requester.id);

    if (!isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
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
