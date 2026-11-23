// api/get-claimed-roles.js
// Secure endpoint to check leadership post vacancy status
// Protected: Never exposes raw emails, credentials, or server environment keys publicly

const { setCorsHeaders, verifySessionAndRole, validateCSRF } = require("./security-utils");

const ADMIN_ROLE_UUIDS = {
  'founder': 'f0000000-0000-0000-0000-000000000001',
  'ceo': 'c0000000-0000-0000-0000-000000000002',
  'ai': 'a0000000-0000-0000-0000-000000000003',
  'dev': 'd0000000-0000-0000-0000-000000000004',
  'design': 'e0000000-0000-0000-0000-000000000005',
  'video': 'b0000000-0000-0000-0000-000000000006',
  'marketing': 'b0000000-0000-0000-0000-000000000007',
  'support': 'b0000000-0000-0000-0000-000000000008'
};

function maskEmail(email) {
  if (!email || !email.includes('@')) return '';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`;
}

function cleanUsername(rawUsername, defaultName) {
  if (!rawUsername) return defaultName || 'Leadership Lead';
  if (rawUsername.startsWith('admin_role:') || rawUsername.includes('|pwd:')) {
    return defaultName || 'Authorized Lead';
  }
  return rawUsername;
}

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "GET, OPTIONS" })) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL || "https://kivfatgytkjqoreltuyu.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return res.status(200).json({ claimed: {} });
    }

    // Check if the caller is an authenticated CEO or Founder
    let isSuperAdmin = false;
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const { user, isAdmin } = await verifySessionAndRole(req);
        if (isAdmin && user && (user.id === 'f0000000-0000-0000-0000-000000000001' || user.id === 'c0000000-0000-0000-0000-000000000002')) {
          isSuperAdmin = true;
        }
      }
    } catch (e) {
      isSuperAdmin = false;
    }

    const roleUuids = Object.values(ADMIN_ROLE_UUIDS);
    const uuidsStr = roleUuids.map(id => `"${id}"`).join(",");
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=in.(${uuidsStr})&select=id,email,username`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${serviceRoleKey}`,
        "apikey": serviceRoleKey
      }
    });

    if (!dbRes.ok) {
      throw new Error(`Database fetch failed: ${await dbRes.text()}`);
    }

    const data = await dbRes.json();
    const claimed = {};
    
    data.forEach(profile => {
      const roleKey = Object.keys(ADMIN_ROLE_UUIDS).find(k => ADMIN_ROLE_UUIDS[k] === profile.id);
      if (roleKey) {
        if (isSuperAdmin) {
          // Authorized CEO / Founder session: show sanitized, masked information
          claimed[roleKey] = {
            assigned: true,
            email: maskEmail(profile.email),
            username: cleanUsername(profile.username)
          };
        } else {
          // Public or non-superadmin caller: strictly boolean status, ZERO personal info
          claimed[roleKey] = {
            assigned: true
          };
        }
      }
    });

    // Clean response with ZERO debug info or leaked environment keys
    return res.status(200).json({ claimed });
  } catch (err) {
    console.error("Get Claimed Roles Error:", err);
    return res.status(500).json({ error: { message: "Internal Server Error" } });
  }
};
