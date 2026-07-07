// api/delete-notification.js
// Securely deletes notifications on the backend (RLS bypass)

module.exports = async (req, res) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
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
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase service role key is not configured on server" } });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { id, clearAll, userId } = body || {};

    if (clearAll) {
      // If user ID is provided, clear user-specific notifications only (never system/general notifications)
      if (userId) {
        const delUserRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications?user_id=eq.${encodeURIComponent(userId)}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey
          }
        });
        if (!delUserRes.ok) {
          console.warn("Failed to clear user notifications:", await delUserRes.text());
        }
      }

      return res.status(200).json({ success: true, message: "Notifications cleared successfully" });
    } else if (id) {
      // Delete specific notification (only if it is a private notification, i.e., user_id is not null)
      let delUrl = `${SUPABASE_URL}/rest/v1/notifications?id=eq.${encodeURIComponent(id)}&user_id=not.is.null`;
      
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
