const { logError } = require('../lib/logger');

/**
 * Global error handler. Must be registered LAST (after all routes).
 * Catches unhandled errors from async route handlers.
 */
function errorHandler(err, req, res, _next) {
  const requestId = req.id || 'unknown';
  const status = err.statusCode || err.status || 500;

  logError('UnhandledError', err.message, {
    requestId,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(status).json({
    error: status >= 500 ? 'Error interno del servidor.' : err.message,
    requestId,
  });
}

module.exports = errorHandler;
