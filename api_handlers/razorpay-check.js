// api_handlers/razorpay-check.js
// Admin-only diagnostic endpoint — verifies Razorpay key configuration.
// Blocked in production unless the caller is an authenticated admin.

const { verifySessionAndRole } = require("./security-utils");

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  // Strict CORS — no wildcard
  const allowedOrigins = [
    "https://antigravitystudios.in",
    "https://www.antigravitystudios.in",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ];
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();

  // --- ADMIN AUTH REQUIRED ---
  const { user, isAdmin, error } = await verifySessionAndRole(req);
  if (error || !isAdmin) {
    return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required." } });
  }

  const rawKeyId     = process.env.RAZORPAY_KEY_ID     || "";
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

  const keyId     = rawKeyId.replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();
  const keySecret = rawKeySecret.replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();

  // Never expose the full secret — only length and first/last 4 chars
  const diagnostics = {
    KEY_ID: {
      cleaned_length: keyId.length,
      prefix: keyId.substring(0, 8),   // e.g. "rzp_live" — safe prefix only, not the full key
      is_live: keyId.startsWith("rzp_live_"),
      is_test: keyId.startsWith("rzp_test_"),
    },
    KEY_SECRET: {
      cleaned_length: keySecret.length,
      first_4_chars:  keySecret.substring(0, 4),
      last_4_chars:   keySecret.slice(-4),
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
