// api_handlers/record-login.js
// Collects and persists every login event with full audit metadata
const fs = require('fs');
const path = require('path');
const { setCorsHeaders, validateCSRF, verifySessionAndRole, auditLog } = require('./security-utils');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'login_audit.json');

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: 'GET, POST, OPTIONS' })) return;

  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // GET: Return active 24-hour login ledger for admins (auto-pruned)
  if (req.method === 'GET') {
    // Require verified admin authentication
    const { user, isAdmin, error } = await verifySessionAndRole(req);
    if (error || !isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required to view login records." } });
    }

    try {
      if (!fs.existsSync(AUDIT_FILE)) {
        return res.status(200).json({ total: 0, logs: [], retentionWindow: '24 Hours' });
      }
      const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
      let logs = JSON.parse(raw || '[]');

      // Auto-prune records older than 24 hours to keep database clean
      const cutoff = Date.now() - ONE_DAY_MS;
      const initialCount = logs.length;
      logs = logs.filter(item => (item.epoch && item.epoch >= cutoff) || (new Date(item.timestampUtc).getTime() >= cutoff));

      // Save pruned state if any entries expired
      if (logs.length !== initialCount) {
        fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');
      }

      // Filter: Except admins, check and return all client logins
      const urlObj = new URL(req.url, 'http://localhost');
      const showAll = urlObj.searchParams.get('all') === 'true';

      const filteredLogs = showAll ? logs : logs.filter(item => {
        const r = (item.role || '').toLowerCase();
        const e = (item.email || '').toLowerCase();
        const isAdmin = r === 'admin' || r === 'founder' || r === 'ceo' || r === 'cto' || 
                        e.startsWith('admin@') || e.startsWith('founder@') || e.startsWith('ceo@') || e.startsWith('cto@');
        return !isAdmin;
      });

      return res.status(200).json({
        total: filteredLogs.length,
        retentionWindow: '24 Hours',
        filter: showAll ? 'all' : 'clients_only',
        logs: [...filteredLogs].reverse() // Return active entries, most recent first
      });
    } catch (err) {
      return res.status(500).json({ error: { message: err.message } });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  // Enforce CSRF check on login recording
  if (!validateCSRF(req)) {
    return res.status(403).json({ error: { message: "Access Denied: CSRF verification failed." } });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      email,
      name,
      phone = '',
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
      phone: phone ? String(phone).trim() : 'N/A',
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

    // Safely append to local data file and enforce 24-hour cleanup
    let logs = [];
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
        logs = JSON.parse(raw || '[]');
      } catch (e) {
        logs = [];
      }
    }

    // Prune entries older than 24h
    const cutoff = now.getTime() - ONE_DAY_MS;
    logs = logs.filter(item => (item.epoch && item.epoch >= cutoff) || (new Date(item.timestampUtc).getTime() >= cutoff));
    
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
