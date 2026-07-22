// api/security-utils.js
// Shared helper methods for CSRF, Input Sanitization, Audit Logging, and Rate Limiting

const crypto = require("crypto");

const allowedOrigins = [
  "https://antigravitystudios.in",
  "https://www.antigravitystudios.in",
  "http://localhost:3000",
  "http://localhost:8000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:8000"
];

// 1. Verify CSRF
function validateCSRF(req) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (origin && !allowedOrigins.includes(origin)) {
    return false;
  }
  if (referer) {
    try {
      const refUrl = new URL(referer);
      if (!allowedOrigins.includes(refUrl.origin)) {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
  return true;
}

// 2. HTML escaping to prevent injection/XSS
function sanitizeInput(val) {
  if (typeof val !== 'string') return val;
  return val
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// 3. Database-backed rate limiter
async function checkRateLimit(key, limit, windowSeconds) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) {
    return true; // Fail-open if database environment keys are missing
  }

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000).toISOString();

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const record = data[0];
        const resetTime = new Date(record.reset_at);
        if (resetTime > now) {
          if (record.hits >= limit) {
            return false;
          }
          // Increment hits
          await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${serviceRoleKey}`,
              "apikey": serviceRoleKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ hits: record.hits + 1 })
          });
          return true;
        }
      }
    }

    // Insert or overwrite expired rate limit
    await fetch(`${SUPABASE_URL}/rest/v1/rate_limits`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({ key, hits: 1, reset_at: resetAt })
    });
    return true;
  } catch (err) {
    console.error("Rate limiter database error:", err);
    return true; // Fail-open on database error
  }
}

// 4. Secure server-side Audit Logging
async function auditLog(actorId, actorEmail, action, payload) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/audit_logs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        actor_id: actorId || null,
        actor_email: actorEmail || 'system',
        action: action,
        payload: payload || {}
      })
    });
  } catch (e) {
    console.error("Audit log creation failed:", e);
  }
}

// 5. Auth helper to verify token and check role
async function verifySessionAndRole(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { user: null, isAdmin: false, error: "Unauthorized: Missing Authorization Header" };
  }

  const token = authHeader.split(" ")[1];
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !serviceRoleKey) {
    return { user: null, isAdmin: false, error: "Server credentials missing" };
  }

  // 1. Call Supabase Auth API to verify the JWT token
  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "apikey": SUPABASE_ANON_KEY
    }
  });

  if (!userResponse.ok) {
    return { user: null, isAdmin: false, error: "Unauthorized: Invalid or expired token" };
  }

  const user = await userResponse.json();

  // 2. Fetch the user role from database
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${serviceRoleKey}`,
      "apikey": serviceRoleKey
    }
  });

  let isAdmin = false;
  let role = 'user';

  if (profileRes.ok) {
    const data = await profileRes.json();
    if (data && data.length > 0) {
      role = data[0].role;
      isAdmin = (role === 'admin');
    }
  }

  // Fallback to static lists/domains for initialization step
  const ADMIN_ROLE_UUIDS = [
    'f0000000-0000-0000-0000-000000000001', // founder
    'c0000000-0000-0000-0000-000000000002', // ceo
    'a0000000-0000-0000-0000-000000000003', // ai
    'd0000000-0000-0000-0000-000000000004', // dev
    'e0000000-0000-0000-0000-000000000005', // design
    'b0000000-0000-0000-0000-000000000006', // video
    'b0000000-0000-0000-0000-000000000007', // marketing
    'b0000000-0000-0000-0000-000000000008'  // support
  ];

  const email = user.email || "";
  if (!isAdmin && (
    email.endsWith("@gravitystudios.com") || 
    email === "admin@gravitystudios.com" || 
    email === "thontadaryacapt8073@gmail.com" ||
    email === "antigravitystudios1@gmail.com" ||
    ADMIN_ROLE_UUIDS.includes(user.id)
  )) {
    isAdmin = true;
  }

  return { user, role, isAdmin, error: null };
}

async function checkLockout(key, maxAttempts, windowSeconds) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) {
    return { allowed: true };
  }

  const now = new Date();
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const record = data[0];
        const resetTime = new Date(record.reset_at);
        if (resetTime > now) {
          if (record.hits >= maxAttempts) {
            const remainingSeconds = Math.ceil((resetTime - now) / 1000);
            return { allowed: false, remainingSeconds };
          }
        }
      }
    }
  } catch (err) {
    console.error("Lockout check error:", err);
  }
  return { allowed: true };
}

async function recordFailedAttempt(key, windowSeconds) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) return;

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000).toISOString();

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) {
        const record = data[0];
        const resetTime = new Date(record.reset_at);
        if (resetTime > now) {
          // Increment hits
          await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${serviceRoleKey}`,
              "apikey": serviceRoleKey,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ hits: record.hits + 1 })
          });
          return;
        }
      }
    }

    // Insert or overwrite expired lockout
    await fetch(`${SUPABASE_URL}/rest/v1/rate_limits`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({ key, hits: 1, reset_at: resetAt })
    });
  } catch (err) {
    console.error("Record failed attempt error:", err);
  }
}

async function resetFailedAttempts(key) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) return;

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rate_limits?key=eq.${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });
  } catch (err) {
    console.error("Reset failed attempts error:", err);
  }
}

module.exports = {
  validateCSRF,
  sanitizeInput,
  checkRateLimit,
  auditLog,
  verifySessionAndRole,
  checkLockout,
  recordFailedAttempt,
  resetFailedAttempts
};

