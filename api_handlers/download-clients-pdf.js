// api_handlers/download-clients-pdf.js
// Generates and streams clients_data.pdf containing verified 24-hour client login ledger
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { setCorsHeaders, verifySessionAndRole } = require('./security-utils');

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "GET, OPTIONS", contentType: false })) return;

  if (req.method !== 'GET') {
    res.setHeader('Content-Type', 'application/json');
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  // Enforce verified admin authentication before allowing PDF generation or download
  const { user, isAdmin, error } = await verifySessionAndRole(req);
  if (error || !isAdmin) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(403).json({ error: { message: "Access Denied: Administrator privileges required to download client data." } });
  }

  try {
    const pdfPath = path.join(__dirname, '..', 'clients_data.pdf');
    const scriptPath = path.join(__dirname, '..', 'generate_clients_pdf.py');

    // Regenerate PDF with fresh 24h ledger
    try {
      execSync(`python "${scriptPath}"`, { timeout: 8000 });
    } catch (err) {
      console.warn("Python PDF regeneration notice:", err.message);
    }

    if (!fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ error: { message: "clients_data.pdf not found." } });
    }

    const stat = fs.statSync(pdfPath);
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': stat.size,
      'Content-Disposition': 'attachment; filename="clients_data.pdf"',
      'Cache-Control': 'no-cache'
    });

    const readStream = fs.createReadStream(pdfPath);
    readStream.pipe(res);
  } catch (error) {
    console.error("Error serving clients_data.pdf:", error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  }
};
