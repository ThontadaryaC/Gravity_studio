// api/delete-profile.js
// Securely deletes a profile and auth user on the backend (RLS bypass)

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: { message: "Unauthorized: Missing Authorization Header" } });
    }

    const token = authHeader.split(" ")[1];
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_NGdByzMeaQrwJPw1YKGjnA_issJf05b";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase service role key is not configured on server" } });
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

    const requesterEmail = requester.email || "";
    const isAdmin = requesterEmail.endsWith("@gravitystudios.com") || 
                    requesterEmail === "admin@gravitystudios.com" || 
                    requesterEmail === "thontadaryacapt8073@gmail.com" ||
                    requesterEmail === "antigravitystudios1@gmail.com" ||
                    ADMIN_ROLE_UUIDS.includes(requester.id);

    if (!isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
    }

    // Extract email from query or body
    const emailToDel = req.query?.email || req.body?.email;
    if (!emailToDel) {
      return res.status(400).json({ error: { message: "Missing email parameter" } });
    }

    const cleanEmail = emailToDel.toLowerCase().trim();

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
      return res.status(404).json({ error: { message: "Profile not found in database" } });
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

    return res.status(200).json({ success: true, message: `Successfully deleted profile and auth record for ${cleanEmail}` });
  } catch (err) {
    console.error("Delete Profile Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
