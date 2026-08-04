// api/verify-razorpay-signature.js
// Securely verifies Razorpay payment signatures and records database entries server-side

const crypto = require("crypto");
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
    const { orderId, paymentId, signature, serviceId, tier, type, purchaseId, currency, receipt } = req.body || {};

    if (!orderId || !paymentId || !signature || !type || !currency) {
      return res.status(400).json({ error: { message: "Missing verification parameters." } });
    }

    const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
    if (!keySecret) {
      return res.status(500).json({ error: { message: "Razorpay configuration error." } });
    }

    // 1. Perform HMAC-SHA256 signature verification
    const text = orderId + "|" + paymentId;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    const isVerified = generatedSignature === signature;
    if (!isVerified) {
      return res.status(400).json({ verified: false, error: { message: "Invalid payment signature verification failed." } });
    }

    // 2. Verify Session caller
    const { user, error } = await verifySessionAndRole(req);
    if (error) {
      return res.status(401).json({ error: { message: error } });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !serviceRoleKey) {
      return res.status(500).json({ error: { message: "Supabase connection is not configured." } });
    }

    // Fetch caller profile details
    const userProfileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`, {
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });
    
    if (!userProfileRes.ok) {
      return res.status(500).json({ error: { message: "Failed to fetch user profiles." } });
    }

    const profiles = await userProfileRes.json();
    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ error: { message: "User profile record not found." } });
    }

    const username = profiles[0].username || user.email.split('@')[0];
    const email = profiles[0].email || user.email;

    const isIndian = currency === "INR";
    const symbol = isIndian ? '₹' : '$';
    let payAmount = 0;
    let serviceName = "";
    let finalPurchaseId = purchaseId;

    if (type === 'booking') {
      const verifiedTotalCost = await getVerifiedPrice(serviceId, tier, isIndian);
      payAmount = verifiedTotalCost / 2;
      
      const defaultService = DEFAULT_SERVICE_PRICES.find(s => s.id === serviceId);
      serviceName = defaultService ? defaultService.name : serviceId;
      if (tier === 'max') {
        serviceName = `${serviceName} (Premium Tier)`;
      } else {
        serviceName = `${serviceName} (Standard Tier)`;
      }

      // Generate a new purchaseId
      finalPurchaseId = "PUR-" + Date.now().toString().substring(8);
      const deliveryDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000 * 14).toISOString(); // 14 days standard deadline

      // Sync purchase to database (service_role bypasses RLS)
      const purchaseRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: finalPurchaseId,
          user_id: user.id,
          service_id: serviceId,
          service_name: serviceName,
          total_cost: verifiedTotalCost,
          paid_amount: payAmount,
          status: 'advance_paid',
          date: new Date().toLocaleDateString(),
          delivery_deadline: deliveryDeadline,
          postponed: false
        })
      });

      if (!purchaseRes.ok) {
        throw new Error(`Database purchase sync failed: ${await purchaseRes.text()}`);
      }

      // Send System Notification (service_role bypasses RLS)
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Booking Confirmed via Razorpay",
          desc_text: `Successfully received 50% advance booking payment of ${symbol}${payAmount.toLocaleString()} for '${serviceName}'. Work starts immediately.`,
          time_label: "Just now",
          is_read: false,
          user_id: user.id
        })
      });

    } 
    else if (type === 'final') {
      // Query purchase from DB to verify owner & get pricing
      const purchaseQueryRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${encodeURIComponent(purchaseId)}`, {
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey
        }
      });

      if (!purchaseQueryRes.ok) {
        throw new Error(`Database query failed: ${await purchaseQueryRes.text()}`);
      }

      const purchases = await purchaseQueryRes.json();
      if (!purchases || purchases.length === 0) {
        return res.status(404).json({ error: { message: "Project record not found." } });
      }

      const p = purchases[0];
      if (p.user_id !== user.id) {
        return res.status(403).json({ error: { message: "Access Denied: You do not own this project." } });
      }

      const totalCost = Number(p.total_cost);
      const paidAmount = Number(p.paid_amount);
      payAmount = totalCost - paidAmount;
      serviceName = p.service_name;

      // Update purchase record status (service_role bypasses RLS)
      const purchaseUpdateRes = await fetch(`${SUPABASE_URL}/rest/v1/purchases?id=eq.${encodeURIComponent(purchaseId)}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          paid_amount: totalCost,
          status: 'fully_paid'
        })
      });

      if (!purchaseUpdateRes.ok) {
        throw new Error(`Database purchase update failed: ${await purchaseUpdateRes.text()}`);
      }

      // Send System Notification (service_role bypasses RLS)
      await fetch(`${SUPABASE_URL}/rest/v1/notifications`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceRoleKey}`,
          "apikey": serviceRoleKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Project Successfully Delivered",
          desc_text: `Received final 50% payment of ${symbol}${payAmount.toLocaleString()} for '${serviceName}'. Source files are released for download.`,
          time_label: "Just now",
          is_read: false,
          user_id: user.id
        })
      });
    }

    // Insert transaction into transactions log
    const transRes = await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        reference: paymentId,
        username: username,
        email: email,
        service: serviceName,
        amount: payAmount,
        method: "Razorpay SDK",
        type: type,
        date: new Date().toLocaleString()
      })
    });

    if (!transRes.ok) {
      console.warn("Failed to write to transactions log table:", await transRes.text());
    }

    return res.status(200).json({ 
      verified: true,
      purchaseId: finalPurchaseId,
      payAmount: payAmount
    });

  } catch (err) {
    console.error("Verify Razorpay Signature Error:", err);
    return res.status(500).json({ error: { message: err.message || "Internal Server Error" } });
  }
};
