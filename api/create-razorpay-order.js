// api/create-razorpay-order.js
// Securely generates a Razorpay Order ID on the server side

const { validateCSRF, checkRateLimit, verifySessionAndRole } = require("./security-utils");

const DEFAULT_SERVICE_PRICES = [
  { id: "ai_chatbot", name: "AI Chatbot", priceINR: 24999, priceUSD: 799, priceMaxINR: 120000, priceMaxUSD: 4000 },
  { id: "ai_voice_agent", name: "AI Voice Agent", priceINR: 49999, priceUSD: 1999, priceMaxINR: 300000, priceMaxUSD: 10000 },
  { id: "ai_receptionist", name: "AI Receptionist", priceINR: 60000, priceUSD: 2500, priceMaxINR: 350000, priceMaxUSD: 12000 },
  { id: "ai_customer_support", name: "AI Customer Support", priceINR: 40000, priceUSD: 1500, priceMaxINR: 200000, priceMaxUSD: 8000 },
  { id: "ai_sales_agent", name: "AI Sales Agent", priceINR: 50000, priceUSD: 2000, priceMaxINR: 300000, priceMaxUSD: 10000 },
  { id: "ai_appointment_booking", name: "AI Appointment Booking", priceINR: 30000, priceUSD: 1200, priceMaxINR: 150000, priceMaxUSD: 5000 },
  { id: "ai_workflow_automation", name: "AI Workflow Automation", priceINR: 39999, priceUSD: 1499, priceMaxINR: 300000, priceMaxUSD: 12000 },
  { id: "custom_ai_solution", name: "Custom AI Solution", priceINR: 100000, priceUSD: 5000, priceMaxINR: 500000, priceMaxUSD: 25000 },

  { id: "business_website", name: "Business Website", priceINR: 19999, priceUSD: 799, priceMaxINR: 80000, priceMaxUSD: 3000 },
  { id: "premium_website", name: "Premium Website", priceINR: 80000, priceUSD: 3000, priceMaxINR: 250000, priceMaxUSD: 10000 },
  { id: "web_application", name: "Web Application", priceINR: 100000, priceUSD: 5000, priceMaxINR: 1000000, priceMaxUSD: 50000 },
  { id: "mobile_app", name: "Mobile App", priceINR: 99999, priceUSD: 4999, priceMaxINR: 1500000, priceMaxUSD: 60000 },
  { id: "saas_platform", name: "SaaS Platform", priceINR: 299999, priceUSD: 9999, priceMaxINR: 3000000, priceMaxUSD: 100000 },
  { id: "crm_erp_system", name: "CRM/ERP System", priceINR: 200000, priceUSD: 8000, priceMaxINR: 2000000, priceMaxUSD: 80000 },
  { id: "dashboard_development", name: "Dashboard Development", priceINR: 50000, priceUSD: 2000, priceMaxINR: 500000, priceMaxUSD: 20000 },

  { id: "logo_design", name: "Logo Design", priceINR: 5000, priceUSD: 300, priceMaxINR: 30000, priceMaxUSD: 1200 },
  { id: "brand_identity", name: "Brand Identity & Design", priceINR: 14999, priceUSD: 599, priceMaxINR: 150000, priceMaxUSD: 5000 },
  { id: "ui_ux_design", name: "UI/UX Design", priceINR: 20000, priceUSD: 800, priceMaxINR: 200000, priceMaxUSD: 8000 },
  { id: "presentation_design", name: "Presentation Design", priceINR: 8000, priceUSD: 300, priceMaxINR: 50000, priceMaxUSD: 2000 },
  { id: "graphic_design", name: "Graphic Design", priceINR: 5000, priceUSD: 250, priceMaxINR: 25000, priceMaxUSD: 1200 },

  { id: "ai_video", name: "AI Video Production", priceINR: 19999, priceUSD: 899, priceMaxINR: 200000, priceMaxUSD: 8000 },
  { id: "animation", name: "Animation", priceINR: 30000, priceUSD: 1500, priceMaxINR: 500000, priceMaxUSD: 20000 },
  { id: "explainer_video", name: "Explainer Video", priceINR: 20000, priceUSD: 800, priceMaxINR: 200000, priceMaxUSD: 8000 },
  { id: "motion_graphics", name: "Motion Graphics", priceINR: 15000, priceUSD: 600, priceMaxINR: 150000, priceMaxUSD: 6000 },
  { id: "product_advertisement", name: "Product Advertisement", priceINR: 25000, priceUSD: 1200, priceMaxINR: 300000, priceMaxUSD: 12000 },

  { id: "seo", name: "SEO (Monthly)", priceINR: 15000, priceUSD: 700 },
  { id: "social_media", name: "Social Media Marketing (Monthly)", priceINR: 20000, priceUSD: 800 },
  { id: "google_ads", name: "Google Ads Management (Monthly)", priceINR: 25000, priceUSD: 1000 },
  { id: "meta_ads", name: "Meta Ads Management (Monthly)", priceINR: 25000, priceUSD: 1000 },
  { id: "email_marketing", name: "Email Marketing (Monthly)", priceINR: 15000, priceUSD: 600 }
];

async function getVerifiedPrice(serviceId, tier, isIndian) {
  let catalog = [];
  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (SUPABASE_URL && serviceRoleKey) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/notifications?title=eq.%5BSYSTEM_PRICING_CATALOG%5D&select=desc_text`, {
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          catalog = JSON.parse(data[0].desc_text);
        }
      }
    }
  } catch (err) {
    console.warn("Failed to fetch custom catalog, using defaults:", err.message);
  }

  const service = catalog.find(s => s.id === serviceId) || DEFAULT_SERVICE_PRICES.find(s => s.id === serviceId);
  if (!service) {
    throw new Error(`Service ${serviceId} not found in catalog`);
  }

  let totalCost = isIndian ? service.priceINR : service.priceUSD;
  if (tier === 'max' && (service.priceMaxINR || service.priceMaxUSD)) {
    totalCost = isIndian ? service.priceMaxINR : service.priceMaxUSD;
  }

  return totalCost;
}

module.exports = async (req, res) => {
  const headers = {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  const allowedOrigins = [
    "https://antigravitystudios.in",
    "https://www.antigravitystudios.in",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000"
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  // CSRF Check
  if (!validateCSRF(req)) {
    return res.status(403).json({ error: { message: "Access Denied: CSRF verification failed." } });
  }

  try {
    // 1. Verify user JWT token to authenticate caller
    const { user, error } = await verifySessionAndRole(req);
    if (error) {
      return res.status(401).json({ error: { message: error } });
    }

    // Rate Limiting (50 order creations per hour per user/IP)
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "global";
    const rateLimitKey = `create_order:${user.id}:${ip}`;
    const rateLimitOk = await checkRateLimit(rateLimitKey, 50, 3600);
    if (!rateLimitOk) {
      return res.status(429).json({ error: { message: "Too many order requests. Please wait." } });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { serviceId, tier, type, purchaseId, currency, receipt } = body || {};

    const isIndian = currency === "INR";
    let finalPayAmount = 0;

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Server connection is not configured." } });
    }

    // Verify amount based on type
    if (type === 'booking') {
      if (!serviceId) {
        return res.status(400).json({ error: { message: "Missing serviceId for booking order" } });
      }
      const verifiedTotalCost = await getVerifiedPrice(serviceId, tier, isIndian);
      finalPayAmount = verifiedTotalCost / 2; // 50% Booking Advance
    } 
    else if (type === 'final') {
      if (!purchaseId) {
        return res.status(400).json({ error: { message: "Missing purchaseId for final payment order" } });
      }

      // Query purchase from DB to check status and owner
      const purRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${encodeURIComponent(purchaseId)}`, {
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      });

      if (!purRes.ok) {
        return res.status(500).json({ error: { message: "Failed to retrieve project details." } });
      }

      const purchases = await purRes.json();
      if (!purchases || purchases.length === 0) {
        return res.status(404).json({ error: { message: "Project record not found." } });
      }

      const p = purchases[0];
      if (p.user_id !== user.id) {
        return res.status(403).json({ error: { message: "Access Denied: You do not own this project." } });
      }

      const totalCost = Number(p.total_cost);
      const paidAmount = Number(p.paid_amount);
      finalPayAmount = totalCost - paidAmount;
      if (finalPayAmount <= 0) {
        return res.status(400).json({ error: { message: "This project has already been fully paid." } });
      }
    } 
    else {
      return res.status(400).json({ error: { message: "Invalid transaction type" } });
    }

    const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();

    if (!keyId || !keySecret) {
      return res.status(500).json({ 
        error: { 
          message: "Razorpay keys are not configured on the server." 
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
        amount: Math.round(finalPayAmount * 100), // in minor units (paise/cents)
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
