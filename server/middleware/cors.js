// Origins from env var (comma-separated) take precedence over the hardcoded defaults.
// Example: CORS_ALLOWED_ORIGINS=https://app.trackeo.cl,https://trackeo.cl
const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://trackeo.cl',
  'https://www.trackeo.cl',
  'https://app.trackeo.cl',
  'https://personas.trackeo.cl',
  'https://api.trackeo.cl',
];

function getAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ORIGINS;
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * CORS middleware with origin whitelist.
 */
function cors(req, res, next) {
  const origin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'Origin no permitido.' });
  }
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
}

module.exports = cors;
