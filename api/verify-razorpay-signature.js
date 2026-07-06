// api/verify-razorpay-signature.js
// Securely verifies Razorpay payment signatures on the server side using HMAC-SHA256

const crypto = require("crypto");

module.exports = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { orderId, paymentId, signature } = body || {};

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ error: { message: "Missing verification parameters: orderId, paymentId, signature" } });
    }

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!keySecret) {
      return res.status(500).json({ error: { message: "Razorpay server key secret is missing. Please configure RAZORPAY_KEY_SECRET." } });
    }

    // Perform real HMAC-SHA256 signature verification
    const text = orderId + "|" + paymentId;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    const isVerified = generatedSignature === signature;

    if (isVerified) {
      return res.status(200).json({ verified: true });
    } else {
      return res.status(400).json({ verified: false, error: { message: "Invalid payment signature verification failed." } });
    }

  } catch (err) {
    console.error("Verify Razorpay Signature Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
