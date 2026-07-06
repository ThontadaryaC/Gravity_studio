// api/get-razorpay-key.js
// Securely retrieves the Razorpay Key ID from environment variables to avoid hardcoding it in client assets

module.exports = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  // Set response headers
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();

  return res.status(200).json({ keyId });
};
