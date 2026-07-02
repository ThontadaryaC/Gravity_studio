// netlify/functions/get-razorpay-key.js
// Securely retrieves the Razorpay Key ID from environment variables to avoid hardcoding it in client assets

exports.handler = async function (event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: { message: "Method Not Allowed" } })
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID || "";

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ keyId })
  };
};
