// api_handlers/razorpay-check.js
// Admin-only diagnostic endpoint — verifies Razorpay key configuration.
// Blocked in production unless the caller is an authenticated admin.

const { setCorsHeaders, verifySessionAndRole } = require("./security-utils");

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "GET, OPTIONS" })) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  // --- ADMIN AUTH REQUIRED ---
  const { user, isAdmin, error } = await verifySessionAndRole(req);
  if (error || !isAdmin) {
    return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
  }

  const rawKeyId     = process.env.RAZORPAY_KEY_ID     || "";
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

  const keyId     = rawKeyId.replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();
  const keySecret = rawKeySecret.replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();

  // Secure diagnostics — never expose secret characters
  const diagnostics = {
    KEY_ID: {
      cleaned_length: keyId.length,
      prefix: keyId.substring(0, 8),   // e.g. "rzp_live" — safe prefix only, not the full key
      is_live: keyId.startsWith("rzp_live_"),
      is_test: keyId.startsWith("rzp_test_"),
    },
    KEY_SECRET: {
      configured:     keySecret.length > 0,
      cleaned_length: keySecret.length,
      length_ok:      keySecret.length === 24,
    },
    env: process.env.VERCEL_ENV || "local",
    checked_by: user.email,
  };

  // Minimal live Razorpay auth test — no order is created
  let razorpayTest = { skipped: true, reason: "Missing key or secret" };
  if (keyId && keySecret) {
    try {
      const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        method: "GET",
        headers: { "Authorization": `Basic ${authString}` }
      });
      razorpayTest = { status: response.status, ok: response.ok };
    } catch (err) {
      razorpayTest = { error: err.message };
    }
  }

  return res.status(200).json({ diagnostics, razorpayTest });
};
