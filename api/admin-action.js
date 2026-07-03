// api/admin-action.js
// Securely verifies the user's Supabase JWT and performs/approves admin actions

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
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: { message: "Unauthorized: Missing Authorization Header" } });
    }

    const token = authHeader.split(" ")[1];
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "sb_publishable_NGdByzMeaQrwJPw1YKGjnA_issJf05b";

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

    const user = await userResponse.json();

    // Verify Admin Authorization (corporate domain or custom metadata)
    const email = user.email || "";
    const isAdmin = email.endsWith("@gravitystudios.com") || email === "admin@gravitystudios.com";

    if (!isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
    }

    // JWT is verified and user is an Admin!
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, payload } = body || {};

    // Optional: If service role key is configured, perform database operations on the server side
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
      console.log(`Executing admin action: ${action} with database service role key.`);
      
      // Perform database updates via Supabase REST API
      if (action === "publish-notification") {
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
            "Prefer": "return=representation"
          },
          body: JSON.stringify({
            title: payload.title,
            desc_text: payload.desc,
            time_label: "Just now",
            is_read: false
          })
        });
        if (!dbRes.ok) throw new Error(`Database error: ${await dbRes.text()}`);
      } 
      else if (action === "process-refund") {
        const { claimId, purchaseId, status, newStatus } = payload;
        
        // Update refund claim status
        const refRes = await fetch(`${SUPABASE_URL}/rest/v1/refunds?id=eq.${claimId}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        });
        if (!refRes.ok) throw new Error(`Refund update error: ${await refRes.text()}`);

        // Update purchase status
        const purRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${purchaseId}`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: newStatus })
        });
        if (!purRes.ok) throw new Error(`Purchase update error: ${await purRes.text()}`);
      }
      else if (action === "update-pricing") {
        const pricingRes = await fetch(`${SUPABASE_URL}/rest/v1/service_catalog`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${serviceRoleKey}`,
            "apikey": serviceRoleKey,
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
          },
          body: JSON.stringify(payload.updatedPrices.map(u => ({
            id: u.id,
            name: u.name,
            price_inr: u.priceINR,
            price_usd: u.priceUSD
          })))
        });
        if (!pricingRes.ok) throw new Error(`Pricing update error: ${await pricingRes.text()}`);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Admin action '${action}' successfully authorized and completed.`,
      hasServiceRole: !!serviceRoleKey
    });

  } catch (err) {
    console.error("Admin Action Serverless Function Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
