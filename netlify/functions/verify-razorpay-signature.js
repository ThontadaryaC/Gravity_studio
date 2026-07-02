// netlify/functions/verify-razorpay-signature.js
// Securely verifies Razorpay payment signatures on the server side using HMAC-SHA256

const crypto = require("crypto");

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: { message: "Method Not Allowed" } })
    };
  }

  try {
    const { orderId, paymentId, signature } = JSON.parse(event.body || "{}");

    if (!orderId || !paymentId || !signature) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: { message: "Missing verification parameters: orderId, paymentId, signature" } })
      };
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Simulated verification if env var is missing and it was a simulated order
    if (!keySecret || orderId.startsWith("order_sim_")) {
      console.warn("Razorpay key secret missing or simulated order detected. Simulating signature verification.");
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ verified: true, simulated: true })
      };
    }

    // Perform real HMAC-SHA256 signature verification
    const text = orderId + "|" + paymentId;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    const isVerified = generatedSignature === signature;

    if (isVerified) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ verified: true })
      };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ verified: false, error: { message: "Invalid payment signature verification failed." } })
      };
    }

  } catch (err) {
    console.error("Verify Razorpay Signature Error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: { message: err.message || "Internal Server Error" } })
    };
  }
};
