/**
 * Tests for core/audit/index.js
 *
 * Key property: logAudit() NEVER throws, regardless of Supabase errors.
 * Run: cd server && npx vitest run
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

// ─── Mock supabaseLib ─────────────────────────────────────────────────────────

let mockInsert, mockFrom, mockClient;

beforeAll(() => {
  mockInsert = vi.fn();
  mockFrom   = vi.fn(() => ({ insert: mockInsert }));
  mockClient = { from: mockFrom };

  const supabaseLib = _require('../../core/lib/supabaseClient.js');
  supabaseLib.getClient = vi.fn(() => mockClient);
});

beforeEach(() => vi.clearAllMocks());

const audit = _require('../../core/audit/index.js');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('logAudit', () => {
  it('inserts a row into audit_logs', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await audit.logAudit({ action: 'MAINTENANCE_CREATE', resourceType: 'maintenance_record', resourceId: 'uuid-1' });

    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      action: 'MAINTENANCE_CREATE',
      resource_type: 'maintenance_record',
      resource_id: 'uuid-1',
    }));
  });

  it('never throws when Supabase returns an error', async () => {
    mockInsert.mockResolvedValueOnce({ error: new Error('DB unavailable') });

    await expect(
      audit.logAudit({ action: 'DOCUMENT_DELETE' })
    ).resolves.toBeUndefined();
  });

  it('never throws when Supabase throws an exception', async () => {
    mockInsert.mockRejectedValueOnce(new Error('Network error'));

    await expect(
      audit.logAudit({ action: 'LIVE_SHARE_CREATE' })
    ).resolves.toBeUndefined();
  });

  it('never throws when getClient() fails (env vars missing)', async () => {
    const supabaseLib = _require('../../core/lib/supabaseClient.js');
    const original = supabaseLib.getClient;
    supabaseLib.getClient = vi.fn(() => { throw new Error('SUPABASE_URL no configurado'); });

    await expect(
      audit.logAudit({ action: 'NOTIFICATION_CREATE' })
    ).resolves.toBeUndefined();

    supabaseLib.getClient = original;
  });

  it('stores traccarEmail and traccarUserId', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await audit.logAudit({
      action: 'DOCUMENT_UPDATE',
      traccarEmail: 'user@trackeo.cl',
      traccarUserId: 42,
    });

    const call = mockInsert.mock.calls[0][0];
    expect(call.traccar_email).toBe('user@trackeo.cl');
    expect(call.traccar_user_id).toBe('42'); // must be string
  });

  it('defaults changes to empty object when not provided', async () => {
    mockInsert.mockResolvedValueOnce({ error: null });

    await audit.logAudit({ action: 'MAINTENANCE_DELETE' });

    expect(mockInsert.mock.calls[0][0].changes).toEqual({});
  });
});
