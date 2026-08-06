const url = require('url');

const handlers = {
  '/api/admin-action': require('../api_handlers/admin-action'),
  '/api/admin-login': require('../api_handlers/admin-login'),
  '/api/chat': require('../api_handlers/chat'),
  '/api/claim-admin-role': require('../api_handlers/claim-admin-role'),
  '/api/create-razorpay-order': require('../api_handlers/create-razorpay-order'),
  '/api/delete-notification': require('../api_handlers/delete-notification'),
  '/api/delete-profile': require('../api_handlers/delete-profile'),
  '/api/get-all-users': require('../api_handlers/get-all-users'),
  '/api/get-claimed-roles': require('../api_handlers/get-claimed-roles'),
  '/api/get-payments-log': require('../api_handlers/get-payments-log'),
  '/api/get-razorpay-key': require('../api_handlers/get-razorpay-key'),
  '/api/get-refund-claims': require('../api_handlers/get-refund-claims'),
  '/api/get-supabase-config': require('../api_handlers/get-supabase-config'),
  '/api/submit-dispute': require('../api_handlers/submit-dispute'),
  '/api/verify-razorpay-signature': require('../api_handlers/verify-razorpay-signature')
};

module.exports = async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = parsedUrl.pathname.replace(/\/$/, ''); // Normalize trailing slashes

  // Support Netlify functions compatibility path rewrite
  if (pathname.startsWith('/.netlify/functions')) {
    pathname = pathname.replace('/.netlify/functions', '/api');
  }

  // Handle database proxy routing
  if (pathname.startsWith('/api/db-proxy')) {
    try {
      const handler = require('../api_handlers/db-proxy');
      return await handler(req, res);
    } catch (err) {
      console.error(`Error executing database proxy handler:`, err);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: { message: "Internal Server Error" } });
    }
  }

  const handler = handlers[pathname];

  if (handler) {
    try {
      return await handler(req, res);
    } catch (err) {
      console.error(`Error executing handler for ${pathname}:`, err);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ error: { message: "Internal Server Error" } });
    }
  }

  res.setHeader('Content-Type', 'text/plain');
  return res.status(404).end(`404 Not Found: No handler configured for ${pathname}`);
};
