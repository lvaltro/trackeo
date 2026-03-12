'use strict';

/**
 * server/lib/logger.js
 * Structured logging via pino.
 * Streams to stdout (PM2 captures to pm2-out.log / pm2-error.log).
 * Avoids blocking the event loop — replaces the previous fs.appendFile approach.
 *
 * API is backward-compatible: logError(context, message, detail)
 */

const pino = require('pino');

const _logger = pino({
  level: process.env.LOG_LEVEL || 'warn',
  base: { service: 'trackeo-backend' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Log an error with context.
 * @param {string} context - Module/area identifier (e.g. 'Maintenance:create')
 * @param {string} message - Human-readable error message
 * @param {string|object} [detail] - Additional detail (string or structured object)
 */
function logError(context, message, detail = '') {
  _logger.error({ context, detail }, message);
}

/**
 * Log an info message (use sparingly in production).
 * @param {string} context
 * @param {string} message
 * @param {object} [meta]
 */
function logInfo(context, message, meta = {}) {
  _logger.info({ context, ...meta }, message);
}

module.exports = { logError, logInfo, logger: _logger };
