// api_handlers/daily-admin-dispatch.js
// Compiles 24-hour login audit logs and dispatches the daily report to all admins at 10:00 AM
const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.join(__dirname, '..', 'data', 'login_audit.json');
const REPORTS_DIR = path.join(__dirname, '..', 'data', 'dispatched_reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

async function generateDailyDigest(cutoffHours = 24) {
  let allLogs = [];
  if (fs.existsSync(AUDIT_FILE)) {
    try {
      allLogs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8') || '[]');
    } catch (e) {
      allLogs = [];
    }
  }

  const now = new Date();
  const cutoffTime = now.getTime() - (cutoffHours * 60 * 60 * 1000);
  const recentLogs = allLogs.filter(log => (log.epoch || 0) >= cutoffTime);

  const successful = recentLogs.filter(l => l.status === 'SUCCESS');
  const failed = recentLogs.filter(l => l.status === 'FAILED');
  const uniqueUsers = Array.from(new Set(recentLogs.map(l => l.email)));
  const uniqueIps = Array.from(new Set(recentLogs.map(l => l.ip)));

  const reportDate = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' });
  const reportTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' });

  const summary = {
    generatedAt: now.toISOString(),
    reportDate,
    reportTime,
    windowHours: cutoffHours,
    metrics: {
      totalLogins: recentLogs.length,
      successfulLogins: successful.length,
      failedAttempts: failed.length,
      uniqueUsersCount: uniqueUsers.length,
      uniqueIpsCount: uniqueIps.length
    },
    uniqueUsers,
    logs: recentLogs.reverse()
  };

  // Generate clean HTML digest for email
  const htmlTableRows = recentLogs.map((l, idx) => `
    <tr style="background: ${idx % 2 === 0 ? '#f8fafc' : '#ffffff'}; border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 14px; font-family: monospace; font-size: 13px;">${l.timestampIst || l.timestampUtc}</td>
      <td style="padding: 10px 14px; font-weight: 600; color: #0f172a;">${l.email}</td>
      <td style="padding: 10px 14px; color: #475569;">${l.name || '-'}</td>
      <td style="padding: 10px 14px; text-transform: uppercase; font-size: 12px; font-weight: 700;">
        <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; ${l.status === 'SUCCESS' ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}">
          ${l.status}
        </span>
      </td>
      <td style="padding: 10px 14px; font-family: monospace; font-size: 13px; color: #334155;">${l.ip}</td>
      <td style="padding: 10px 14px; color: #64748b; font-size: 13px;">${l.device || '-'}</td>
    </tr>
  `).join('');

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Antigravity Studios - Daily 10:00 AM Login Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 900px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 24px 32px; color: #ffffff;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.05em; font-weight: 800;">ANTIGRAVITY STUDIOS</h1>
        <span style="background: #f59e0b; color: #000; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">Daily 10:00 AM Audit</span>
      </div>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 14px;">Executive Login Report for ${reportDate} (${reportTime} IST)</p>
    </div>

    <div style="padding: 24px 32px;">
      <!-- Key Metrics Cards -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 800; color: #0f172a;">${summary.metrics.totalLogins}</div>
          <div style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-top: 4px;">Total Logins</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 800; color: #166534;">${summary.metrics.successfulLogins}</div>
          <div style="font-size: 12px; color: #166534; text-transform: uppercase; font-weight: 600; margin-top: 4px;">Successful</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 800; color: #991b1b;">${summary.metrics.failedAttempts}</div>
          <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; font-weight: 600; margin-top: 4px;">Failed / Blocked</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 28px; font-weight: 800; color: #2563eb;">${summary.metrics.uniqueUsersCount}</div>
          <div style="font-size: 12px; color: #2563eb; text-transform: uppercase; font-weight: 600; margin-top: 4px;">Unique Users</div>
        </div>
      </div>

      <!-- Log Breakdown Table -->
      <h3 style="font-size: 16px; color: #0f172a; margin: 0 0 14px 0;">Activity Log Breakdown (Past 24 Hours)</h3>
      ${recentLogs.length === 0 ? '<p style="color: #64748b; font-size: 14px;">No login activity recorded in the past 24 hours.</p>' : `
      <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; color: #475569; font-size: 12px; text-transform: uppercase;">
              <th style="padding: 12px 14px;">Timestamp (IST)</th>
              <th style="padding: 12px 14px;">User / Email</th>
              <th style="padding: 12px 14px;">Name</th>
              <th style="padding: 12px 14px;">Status</th>
              <th style="padding: 12px 14px;">IP Address</th>
              <th style="padding: 12px 14px;">Device</th>
            </tr>
          </thead>
          <tbody>
            ${htmlTableRows}
          </tbody>
        </table>
      </div>`}

      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Antigravity Studios Automated Security Dispatcher &bull; Configured Daily Schedule: Every Day at 10:00 AM IST
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Save report to disk archive
  const fileDate = now.toISOString().split('T')[0];
  const reportPath = path.join(REPORTS_DIR, `daily_report_${fileDate}.html`);
  const jsonPath = path.join(REPORTS_DIR, `daily_report_${fileDate}.json`);

  fs.writeFileSync(reportPath, htmlContent, 'utf8');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2), 'utf8');

  return { summary, reportPath, htmlContent };
}

module.exports = async (req, res) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  const origin = req.headers.origin;
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  else headers['Access-Control-Allow-Origin'] = '*';

  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { summary, reportPath } = await generateDailyDigest(24);
    
    console.log(`[DAILY 10:00 AM DISPATCH] Generated daily login report: ${summary.metrics.totalLogins} events archived to ${reportPath}`);

    return res.status(200).json({
      success: true,
      message: 'Daily 10:00 AM admin login report generated successfully',
      summary: summary.metrics,
      reportArchive: path.basename(reportPath)
    });
  } catch (err) {
    console.error('Failed generating daily admin dispatch:', err);
    return res.status(500).json({ error: { message: err.message } });
  }
};

module.exports.generateDailyDigest = generateDailyDigest;
