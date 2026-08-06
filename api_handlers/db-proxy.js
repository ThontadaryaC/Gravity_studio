const { validateCSRF } = require("./security-utils");

module.exports = async (req, res) => {
  // CORS Headers
  const origin = req.headers.origin;
  const allowedOrigins = [
    "https://antigravitystudios.in",
    "https://www.antigravitystudios.in",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:5173",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500"
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey, Prefer, x-client-info, Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, ETag");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const supabaseUrl = (process.env.SUPABASE_URL || "").trim();
  const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || "").trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: { message: "Supabase environment variables are missing on the server." } });
  }

  // Parse target URL
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let subpath = urlObj.pathname.replace(/^\/api\/db-proxy/, '');
  
  // Remove Vercel rewrite parameter to prevent polluting Supabase API filters
  urlObj.searchParams.delete('path');
  
  const targetUrl = `${supabaseUrl.replace(/\/$/, '')}${subpath}${urlObj.search}`;

  // Read request body for write methods
  let body = undefined;
  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    if (req.body !== undefined && req.body !== null) {
      if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
        body = req.body;
      } else {
        body = JSON.stringify(req.body);
      }
    } else {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      body = Buffer.concat(buffers);
    }
  }

  // Copy and configure request headers, whitelisting standard safe headers with correct casing
  const headers = {};
  const casingMap = {
    'content-type': 'Content-Type',
    'prefer': 'Prefer',
    'range': 'Range',
    'x-client-info': 'x-client-info',
    'accept': 'Accept',
    'user-agent': 'User-Agent'
  };

  for (const [key, val] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    if (casingMap[lowerKey]) {
      headers[casingMap[lowerKey]] = val;
    }
  }

  const DUMMY_KEY = "safe-dummy-anon-key";
  
  // Resolve apikey and standardize case to standard 'apikey' (all lowercase)
  const apiKeyVal = req.headers["apikey"] || req.headers["Apikey"] || req.headers["APIKEY"];
  delete headers["apikey"];
  delete headers["Apikey"];
  delete headers["APIKEY"];
  if (!apiKeyVal || apiKeyVal === DUMMY_KEY) {
    headers["apikey"] = supabaseAnonKey;
  } else {
    headers["apikey"] = apiKeyVal;
  }

  // Resolve Authorization and standardize case to standard 'Authorization' (capital A)
  const authHeaderVal = req.headers["authorization"] || req.headers["Authorization"] || req.headers["AUTHORIZATION"];
  delete headers["authorization"];
  delete headers["Authorization"];
  delete headers["AUTHORIZATION"];
  if (!authHeaderVal || authHeaderVal === `Bearer ${DUMMY_KEY}` || authHeaderVal.toLowerCase() === `bearer ${DUMMY_KEY}`) {
    headers["Authorization"] = `Bearer ${supabaseAnonKey}`;
  } else {
    headers["Authorization"] = authHeaderVal;
  }

  try {
    const fetchOptions = {
      method: req.method,
      headers: headers
    };

    // Only include body for methods that accept it to prevent 400 Bad Request issues in fetch/gateways
    if (body !== undefined && req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
      fetchOptions.body = body;
    }

    const fetchResponse = await fetch(targetUrl, fetchOptions);

    // Copy status and headers from response
    res.status(fetchResponse.status);
    
    for (const [key, value] of fetchResponse.headers.entries()) {
      const lowerKey = key.toLowerCase();
      // Skip connection and transfer-related headers to let the server runtime handle them
      if (['connection', 'content-length', 'transfer-encoding', 'keep-alive', 'content-encoding'].includes(lowerKey)) {
        continue;
      }
      res.setHeader(key, value);
    }

    // Read response body as Buffer to prevent binary corruption (e.g. PDFs, images)
    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Log failures server-side for real-time debugging
    if (!fetchResponse.ok) {
      console.error(`[Supabase Proxy Error] Target URL ${targetUrl} returned status ${fetchResponse.status}. Body:`, buffer.toString('utf8'));
    }

    if (buffer.length > 0) {
      const contentType = fetchResponse.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          return res.json(JSON.parse(buffer.toString('utf8')));
        } catch (e) {
          return res.end(buffer);
        }
      }
      return res.end(buffer);
    }
    return res.end();

  } catch (err) {
    console.error("Supabase Proxy Error:", err);
    return res.status(500).json({ error: { message: `Supabase Proxy error: ${err.message}` } });
  }
};
