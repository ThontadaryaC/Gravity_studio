// api_handlers/razorpay-check.js
// Safe diagnostic endpoint - reveals key metadata (never the secret itself)
// and tests authentication against the live Razorpay API.
// REMOVE or PROTECT this endpoint once the issue is resolved.

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") return res.status(200).end();

  const rawKeyId = process.env.RAZORPAY_KEY_ID || "";
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

  const keyId = rawKeyId.replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();
  const keySecret = rawKeySecret.replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();

  const diagnostics = {
    KEY_ID: {
      raw_length: rawKeyId.length,
      cleaned_length: keyId.length,
      value: keyId,                          // Key ID is public — safe to show
      starts_with: keyId.substring(0, 8),
      is_live: keyId.startsWith("rzp_live_"),
      is_test: keyId.startsWith("rzp_test_"),
    },
    KEY_SECRET: {
      raw_length: rawKeySecret.length,
      cleaned_length: keySecret.length,
      first_4_chars: keySecret.substring(0, 4), // Only first 4 chars shown
      last_4_chars: keySecret.slice(-4),         // Only last 4 chars shown
      expected_length: "24",
      length_ok: keySecret.length === 24,
    },
    env: process.env.VERCEL_ENV || "local",
  };

  // Only attempt API call if both keys are present
  let razorpayTest = { skipped: true, reason: "Missing key or secret" };
  if (keyId && keySecret) {
    try {
      const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      // Use a minimal GET request to test auth — no order is created
      const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
        method: "GET",
        headers: { "Authorization": `Basic ${authString}` }
      });
      const body = await response.text();
      razorpayTest = {
        status: response.status,
        ok: response.ok,
        response_body: body.substring(0, 300), // Truncate for safety
      };
    } catch (err) {
      razorpayTest = { error: err.message };
    }
  }

  return res.status(200).json({ diagnostics, razorpayTest });
};
