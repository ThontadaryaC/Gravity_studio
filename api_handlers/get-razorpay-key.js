// api/get-razorpay-key.js
// Securely retrieves the Razorpay Key ID from environment variables to avoid hardcoding it in client assets

const { setCorsHeaders, checkRateLimit } = require("./security-utils");

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "GET, OPTIONS" })) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  // Rate limiting: 60 requests per minute per IP
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "global";
  const rateLimitOk = await checkRateLimit(`get_razorpay_key:${ip}`, 60, 60);
  if (!rateLimitOk) {
    return res.status(429).json({ error: { message: "Too many requests. Please wait." } });
  }

  const keyId = (process.env.RAZORPAY_KEY_ID || "").replace(/[^\x20-\x7E]/g, "").replace(/^["']|["']$/g, "").trim();

  return res.status(200).json({ keyId });
};
