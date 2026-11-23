// api_handlers/record-login.js
// Collects and persists verified client login events with 1-month calendar retention
const fs = require('fs');
const path = require('path');
const { setCorsHeaders, validateCSRF, verifySessionAndRole, auditLog } = require('./security-utils');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'login_audit.json');

// Helper to get active calendar month metadata (resets on 1st date of every month)
function getCurrentMonthMeta(now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  
  // First day of next month at 00:00:00
  const nextMonthFirst = new Date(currentYear, currentMonth + 1, 1, 0, 0, 0, 0);
  return { currentYear, currentMonth, currentMonthKey, monthLabel, nextMonthFirst };
}

// Prune records not belonging to the current calendar month
function pruneExpiredMonthlyLogs(logs, now = new Date()) {
  const { currentYear, currentMonth } = getCurrentMonthMeta(now);
  return logs.filter(item => {
    const itemDate = new Date(item.epoch || item.timestampUtc || 0);
    return itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth;
  });
}

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: 'GET, POST, OPTIONS' })) return;

  const now = new Date();
  const { currentMonthKey, monthLabel, nextMonthFirst } = getCurrentMonthMeta(now);

  // GET: Return active monthly client login ledger for admins (auto-purged on month roll)
  if (req.method === 'GET') {
    // Require verified admin authentication
    const { user, isAdmin, error } = await verifySessionAndRole(req);
    if (error || !isAdmin) {
      return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required to view login records." } });
    }

    try {
      if (!fs.existsSync(AUDIT_FILE)) {
        return res.status(200).json({
          total: 0,
          month: monthLabel,
          monthKey: currentMonthKey,
          retentionWindow: '1 Calendar Month (Auto-resets on the 1st of next month)',
          logs: []
        });
      }
      const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
      let logs = JSON.parse(raw || '[]');

      // Enforce 1-month lifecycle: auto-purge previous month's entries starting from the 1st of this month
      const initialCount = logs.length;
      logs = pruneExpiredMonthlyLogs(logs, now);

      // Save pruned state if previous month expired
      if (logs.length !== initialCount) {
        fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');
      }

      // Filter: Except admins, check and return all client logins
      const urlObj = new URL(req.url, 'http://localhost');
      const showAll = urlObj.searchParams.get('all') === 'true';

      const filteredLogs = showAll ? logs : logs.filter(item => {
        const r = (item.role || '').toLowerCase();
        const e = (item.email || '').toLowerCase();
        const isAdminRole = r === 'admin' || r === 'founder' || r === 'ceo' || r === 'cto' || 
                            e.startsWith('admin@') || e.startsWith('founder@') || e.startsWith('ceo@') || e.startsWith('cto@');
        return !isAdminRole;
      });

      return res.status(200).json({
        total: filteredLogs.length,
        month: monthLabel,
        monthKey: currentMonthKey,
        retentionWindow: '1 Calendar Month (Auto-resets on the 1st of next month)',
        resetsAt: nextMonthFirst.toISOString(),
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
    const istString = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Determine normalized human-readable auth method
    const cleanAuthMethod = (authMethod === 'google_oauth' || authMethod === 'google')
      ? 'Google Sign-In'
      : 'Email & Password';

    const auditEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      email: String(email).trim().toLowerCase(),
      name: name ? String(name).trim() : (email.split('@')[0] || 'User'),
      phone: phone ? String(phone).trim() : 'N/A',
      role: String(role).toLowerCase(),
      status: status.toUpperCase() === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
      reason: reason || (status === 'SUCCESS' ? 'Authenticated successfully' : 'Invalid credentials'),
      authMethod: cleanAuthMethod,
      rawAuthMethod: authMethod,
      monthKey: currentMonthKey,
      monthLabel: monthLabel,
      sessionId: sessionId || ('sess_' + Date.now()),
      ip: ip.replace(/^.*:/, ''), // clean ipv6 localhost prefix
      userAgent,
      device: detectDevice(userAgent),
      timestampUtc: now.toISOString(),
      timestampIst: istString,
      epoch: now.getTime()
    };

    // Safely append to local data file and enforce 1-month calendar lifecycle
    let logs = [];
    if (fs.existsSync(AUDIT_FILE)) {
      try {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf8');
        logs = JSON.parse(raw || '[]');
      } catch (e) {
        logs = [];
      }
    }

    // Prune entries from previous months so dashboard always starts fresh on 1st of each month
    logs = pruneExpiredMonthlyLogs(logs, now);
    
    logs.push(auditEntry);
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf8');

    // Also sync to Supabase audit log if configured
    try {
      await auditLog(null, auditEntry.email, `user:login_${auditEntry.status.toLowerCase()}`, {
        ip: auditEntry.ip,
        userAgent: auditEntry.userAgent,
        device: auditEntry.device,
        authMethod: auditEntry.authMethod,
        month: monthLabel,
        ist: istString
      });
    } catch (e) {
      // Non-blocking
    }

    console.log(`[LOGIN AUDIT] [${monthLabel}] ${auditEntry.status}: ${auditEntry.email} via ${auditEntry.authMethod} from ${auditEntry.ip} (${auditEntry.device}) at ${istString}`);

    return res.status(200).json({
      success: true,
      message: 'Login event recorded for active month',
      logId: auditEntry.id,
      month: monthLabel,
      authMethod: auditEntry.authMethod,
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
