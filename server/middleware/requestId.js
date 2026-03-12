const crypto = require('crypto');

/**
 * Attach a unique request ID to every request.
 * Available as req.id and returned in X-Request-ID header.
 */
function requestId(req, res, next) {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
}

module.exports = requestId;
