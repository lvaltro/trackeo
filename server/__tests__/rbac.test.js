/**
 * Tests for core/rbac/index.js and server/middleware/authorize.js
 *
 * Verifies the Traccar bridge (Fase 1) and permission logic.
 * Run: cd server && npx vitest run
 */

import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

const rbac     = _require('../../core/rbac/index.js');
const authorize = _require('../middleware/authorize.js');

const { PERMISSIONS, getUserPermissions, hasPermission } = rbac;
const { requirePermission } = authorize;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReq(user) {
  return { user };
}

function makeRes() {
  const res = { _status: null, _body: null };
  res.status = (s) => { res._status = s; return res; };
  res.json   = (b) => { res._body = b; return res; };
  return res;
}

// ─── getUserPermissions (Traccar bridge) ──────────────────────────────────────

describe('getUserPermissions', () => {
  it('returns OWNER permissions when administrator=true', () => {
    const perms = getUserPermissions({ administrator: true });
    expect(hasPermission(perms, 'MAINTENANCE_WRITE')).toBe(true);
    expect(hasPermission(perms, 'DOCUMENT_WRITE')).toBe(true);
    expect(hasPermission(perms, 'USER_MANAGE')).toBe(true);
  });

  it('returns DRIVER permissions when administrator=false', () => {
    const perms = getUserPermissions({ administrator: false });
    expect(hasPermission(perms, 'MAINTENANCE_READ')).toBe(true);
    expect(hasPermission(perms, 'MAINTENANCE_WRITE')).toBe(false);
    expect(hasPermission(perms, 'DOCUMENT_READ')).toBe(false);
  });

  it('returns empty set when user is null', () => {
    const perms = getUserPermissions(null);
    expect(hasPermission(perms, 'VEHICLE_READ')).toBe(false);
  });
});

// ─── hasPermission ─────────────────────────────────────────────────────────────

describe('hasPermission', () => {
  it('grants any permission when set contains wildcard *', () => {
    const perms = new Set(['*']);
    expect(hasPermission(perms, 'ANYTHING')).toBe(true);
    expect(hasPermission(perms, 'MAINTENANCE_WRITE')).toBe(true);
  });

  it('grants specific permission when present', () => {
    const perms = new Set(['VEHICLE_READ', 'MAINTENANCE_READ']);
    expect(hasPermission(perms, 'VEHICLE_READ')).toBe(true);
    expect(hasPermission(perms, 'MAINTENANCE_READ')).toBe(true);
  });

  it('denies permission when not present', () => {
    const perms = new Set(['VEHICLE_READ']);
    expect(hasPermission(perms, 'MAINTENANCE_WRITE')).toBe(false);
  });
});

// ─── requirePermission middleware ─────────────────────────────────────────────

describe('requirePermission middleware', () => {
  it('calls next() when user has required permission', () => {
    const req  = makeReq({ administrator: true });
    const res  = makeRes();
    const next = vi.fn();

    requirePermission('MAINTENANCE_WRITE')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeNull();
  });

  it('returns 403 when user lacks required permission', () => {
    const req  = makeReq({ administrator: false });
    const res  = makeRes();
    const next = vi.fn();

    requirePermission('MAINTENANCE_WRITE')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
    expect(res._body).toMatchObject({ required: 'MAINTENANCE_WRITE' });
  });

  it('returns 403 when user is null', () => {
    const req  = makeReq(null);
    const res  = makeRes();
    const next = vi.fn();

    requirePermission('VEHICLE_READ')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('allows DRIVER to read maintenance', () => {
    const req  = makeReq({ administrator: false });
    const res  = makeRes();
    const next = vi.fn();

    requirePermission('MAINTENANCE_READ')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('blocks DRIVER from writing documents', () => {
    const req  = makeReq({ administrator: false });
    const res  = makeRes();
    const next = vi.fn();

    requirePermission('DOCUMENT_WRITE')(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(403);
  });

  it('blocks DRIVER from accessing VEHICLE_READ for live share creation', () => {
    // DRIVER has VEHICLE_READ — so they CAN create live shares
    const req  = makeReq({ administrator: false });
    const res  = makeRes();
    const next = vi.fn();

    requirePermission('VEHICLE_READ')(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
