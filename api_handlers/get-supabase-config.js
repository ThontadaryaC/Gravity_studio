const { setCorsHeaders, checkRateLimit } = require("./security-utils");

module.exports = async (req, res) => {
  if (setCorsHeaders(req, res, { methods: "GET, OPTIONS" })) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: { message: "Method Not Allowed" } });
  }

  // Rate limiting: 60 requests per minute per IP
  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "global";
  const rateLimitOk = await checkRateLimit(`get_supabase_config:${ip}`, 60, 60);
  if (!rateLimitOk) {
    return res.status(429).json({ error: { message: "Too many requests. Please wait." } });
  }

  const hasConfig = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
  if (!hasConfig) {
    return res.status(500).json({ error: { message: "Supabase connection is not configured on the server." } });
  }

  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const supabaseUrl = `${protocol}://${host}/api/db-proxy`;
  const supabaseKey = "safe-dummy-anon-key";

  return res.status(200).json({ supabaseUrl, supabaseKey });
};
