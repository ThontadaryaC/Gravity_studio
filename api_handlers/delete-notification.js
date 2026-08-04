// api/delete-notification.js
// Securely deletes notifications on the backend (RLS bypass)

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const requesterId = requester.id;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { id, clearAll } = body || {};

    if (clearAll) {
      // Clear user-specific notifications for the authenticated user only
      const delUserRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${encodeURIComponent(requesterId)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      });
      if (!delUserRes.ok) {
        console.warn("Failed to clear user notifications:", await delUserRes.text());
        return res.status(500).json({ error: { message: "Failed to clear notifications from database" } });
      }

      return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
    } else if (id) {
      // Delete specific notification (only if it belongs to the requester)
      let delUrl = `${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(requesterId)}`;
      
      const delRes = await fetch(delUrl, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      });

      if (!delRes.ok) {
        throw new Error(`Failed to delete notification: ${await delRes.text()}`);
      }

      return res.status(200).json({ success: true, message: "Notification deleted successfully" });
    } else {
      return res.status(400).json({ error: { message: "Missing id or clearAll parameter" } });
    }
  } catch (err) {
    console.error("Delete Notification Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
