// api/create-razorpay-order.js
// Securely generates a Razorpay Order ID on the server side

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
    const { amount, currency, receipt } = body || {};

    if (!amount || !currency) {
      return res.status(400).json({ error: { message: "Missing required parameters: amount, currency" } });
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!keyId || !keySecret) {
      return res.status(500).json({ 
        error: { 
          message: "Razorpay server environment variables are missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the dashboard." 
        } 
      });
    }

    // Call real Razorpay API to generate the Order ID
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: Math.round(amount), // must be an integer in minor units (paise/cents)
        currency: currency.toUpperCase(),
        receipt: receipt || `rcpt_${Date.now()}`
      })
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      throw new Error(`Razorpay API responded with error: ${errorText}`);
    }

    const orderData = await razorpayResponse.json();
    return res.status(200).json(orderData);

  } catch (err) {
    console.error("Create Razorpay Order Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
