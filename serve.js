const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;

// Simple manual loader for .env files in local development
if (fs.existsSync('.env')) {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    envContent.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key && !key.startsWith('#')) {
          process.env[key] = value;
        }
      }
    });
    console.log("Loaded local .env configurations successfully.");
  } catch (err) {
    console.warn("Failed to load local .env file:", err.message);
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Intercept and route all API calls locally
  if (pathname.startsWith('/api/')) {
    // Decorate response object with standard Vercel serverless helpers
    res.status = function(code) {
      this.statusCode = code;
      return this;
    };
    res.json = function(obj) {
      if (!this.writableEnded) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(obj));
      }
      return this;
    };

    // Buffer stream to support JSON and raw request body parsing locally
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', async () => {
      if (body) {
        try {
          if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
            req.body = JSON.parse(body);
          } else {
            req.body = body;
          }
        } catch (e) {
          req.body = body;
        }
      }

      try {
        // Dynamically clear cache to allow hot-reloading api handlers
        delete require.cache[require.resolve('./api/index')];
        const apiIndex = require('./api/index');
        await apiIndex(req, res);
      } catch (err) {
        console.error("Local API Handler Execution Error:", err);
        if (!res.writableEnded) {
          res.status(500).json({ error: { message: "Internal Local API Error: " + err.message } });
        }
      }
    });
    return;
  }

  // Decode URL to handle spaces/special characters in filenames
  const decodedUrl = decodeURIComponent(req.url);
  let filePath = '.' + decodedUrl.split('?')[0]; // Strip query parameters
  
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`Gravity Studios Local Web Server is now ACTIVE!`);
  console.log(`Please open: http://localhost:${PORT}/`);
  console.log(`==================================================\n`);
});
