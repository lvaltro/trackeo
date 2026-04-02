/**
 * Tests for server/middleware/validate.js
 * Pure middleware — no DB, no mocking needed.
 * Run: cd server && npx vitest run
 */

import { describe, it, expect, vi } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);
const { validateBody, validateQuery } = _require('../middleware/validate.js');

const { z } = _require('zod');

// ─── validateBody ─────────────────────────────────────────────────────────────

describe('validateBody', () => {
  const schema = z.object({
    name:  z.string().min(1),
    email: z.string().email(),
    age:   z.number().int().positive().optional(),
  });

  const middleware = validateBody(schema);

  function makeReq(body) {
    return { body };
  }

  function makeRes() {
    const res = { _status: 200, _json: null };
    res.status = vi.fn((code) => { res._status = code; return res; });
    res.json   = vi.fn((data) => { res._json = data; return res; });
    return res;
  }

  it('calls next() and sets req.validated on valid input', () => {
    const req  = makeReq({ name: 'Luciano', email: 'l@test.cl' });
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.validated).toEqual({ name: 'Luciano', email: 'l@test.cl' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 when required field is missing', () => {
    const req  = makeReq({ email: 'l@test.cl' }); // missing name
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res._json.error).toBe('Datos inválidos.');
    expect(res._json.issues).toBeInstanceOf(Array);
    expect(res._json.issues[0].path).toBe('name');
  });

  it('returns 400 on invalid email format', () => {
    const req  = makeReq({ name: 'Test', email: 'not-an-email' });
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
    expect(res._json.issues[0].path).toBe('email');
  });

  it('strips unknown fields (Zod strict passthrough default)', () => {
    const req  = makeReq({ name: 'Test', email: 'a@b.cl', unknown: 'hacked' });
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    // Zod strips unknown fields by default
    expect(req.validated.unknown).toBeUndefined();
  });

  it('reports multiple validation errors at once', () => {
    const req  = makeReq({ age: -1 }); // missing name, missing email, negative age
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res._status).toBe(400);
    expect(res._json.issues.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── validateQuery ────────────────────────────────────────────────────────────

describe('validateQuery', () => {
  const schema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
  });

  const middleware = validateQuery(schema);

  function makeReq(query) {
    return { query };
  }

  function makeRes() {
    const res = {};
    res.status = vi.fn(() => res);
    res.json   = vi.fn(() => res);
    return res;
  }

  it('calls next() on valid query', () => {
    const req  = makeReq({ limit: '50' });
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.validatedQuery.limit).toBe(50);
  });

  it('calls next() with no query params when all optional', () => {
    const req  = makeReq({});
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 400 on invalid query param', () => {
    const req  = makeReq({ limit: '999' }); // exceeds max 100
    const res  = makeRes();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
