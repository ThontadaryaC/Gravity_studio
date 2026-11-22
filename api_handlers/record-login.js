// api_handlers/record-login.js
// Collects and persists every login event with full audit metadata
const fs = require('fs');
const path = require('path');
const { auditLog } = require('./security-utils');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'login_audit.json');

module.exports = async (req, res) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  const origin = req.headers.origin;
  if (origin) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Return recent login summary for admins
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(AUDIT_FILE)) {
        return res.status(200).json({ total: 0, logs: [] });
      }
      const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
      const logs = JSON.parse(raw || '[]');
      return res.status(200).json({
        total: logs.length,
        logs: logs.slice(-100).reverse() // Return last 100 entries, most recent first
      });
    } catch (err) {
      return res.status(500).json({ error: { message: err.message } });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      email,
      name,
      role = 'client',
      status = 'SUCCESS', // 'SUCCESS' or 'FAILED'
      reason = '',
      sessionId = '',
      authMethod = 'password'
    } = body;

    if (!email) {
      return res.status(400).json({ error: { message: 'Email identifier is required' } });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Client';
    
    // Format timestamp in UTC and Indian Standard Time (IST)
    const now = new Date();
    const istString = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const auditEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      email: String(email).trim().toLowerCase(),
      name: name ? String(name).trim() : (email.split('@')[0] || 'User'),
      role: String(role).toLowerCase(),
      status: status.toUpperCase() === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      reason: reason || (status === 'SUCCESS' ? 'Authenticated successfully' : 'Invalid credentials'),
      authMethod,
      sessionId: sessionId || ('sess_' + Date.now()),
      ip: ip.replace(/^.*:/, ''), // clean ipv6 localhost prefix
      userAgent,
      device: detectDevice(userAgent),
      timestampUtc: now.toISOString(),
      timestampIst: istString,
      epoch: now.getTime()
    };

    // Safely append to local data file
    let logs = [];
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
        logs = JSON.parse(raw || '[]');
      } catch (e) {
        logs = [];
      }
    }
    logs.push(auditEntry);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');

    // Also sync to Supabase audit log if configured
    try {
      await auditLog(null, auditEntry.email, `user:login_${auditEntry.status.toLowerCase()}`, {
        ip: auditEntry.ip,
        userAgent: auditEntry.userAgent,
        device: auditEntry.device,
        ist: istString
      });
    } catch (e) {
      // Non-blocking
    }

    console.log(`[LOGIN AUDIT] ${auditEntry.status}: ${auditEntry.email} from ${auditEntry.ip} (${auditEntry.device}) at ${istString}`);

    return res.status(200).json({
      success: true,
      message: 'Login event recorded',
      logId: auditEntry.id,
      timestampIst: istString
    });
  } catch (err) {
    console.error('Failed to record login audit:', err);
    return res.status(500).json({ error: { message: 'Internal Server Error: ' + err.message } });
  }
};

function detectDevice(ua) {
  if (!ua) return 'Desktop';
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS Desktop';
  if (/windows/i.test(ua)) return 'Windows Desktop';
  if (/linux/i.test(ua)) return 'Linux Desktop';
  return 'Desktop';
}
