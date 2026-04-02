/**
 * Tests for core/documents/index.js
 * Run: cd server && npx vitest run
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

// ─── Mock supabaseLib ─────────────────────────────────────────────────────────

let mockFrom, builder, mockClient;

function resetBuilder() {
  const mockSingle = vi.fn();
  builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    eq:     vi.fn(() => builder),
    gte:    vi.fn(() => builder),
    lte:    vi.fn(() => builder),
    order:  vi.fn(() => builder),
    single: vi.fn((...a) => mockSingle(...a)),
    _single: mockSingle,
  };
  mockFrom = vi.fn(() => builder);
  mockClient = { from: mockFrom };
}

let documents;
beforeAll(() => {
  resetBuilder();
  const supabaseLib = _require('../../core/lib/supabaseClient.js');
  supabaseLib.getClient = vi.fn(() => mockClient);
  documents = _require('../../core/documents/index.js');
});

beforeEach(() => {
  resetBuilder();
  mockClient.from = mockFrom;
});

// ─── calcStatus (pure function — no DB) ──────────────────────────────────────
// We test this indirectly via create(), but the logic is worth testing directly.
// calcStatus is not exported, so we test through observable behavior.

describe('create — status calculation', () => {
  it('sets status "expired" for past dates', async () => {
    let insertedRow;
    builder.insert.mockImplementation((row) => { insertedRow = row; return builder; });
    builder.single.mockResolvedValueOnce({ data: { id: 'doc-1', status: 'expired' }, error: null });

    await documents.create('v1', {
      type: 'licencia', title: 'Licencia', expires_at: '2020-01-01',
    });

    expect(insertedRow.status).toBe('expired');
  });

  it('sets status "ok" for dates far in the future', async () => {
    let insertedRow;
    builder.insert.mockImplementation((row) => { insertedRow = row; return builder; });
    builder.single.mockResolvedValueOnce({ data: { id: 'doc-1', status: 'ok' }, error: null });

    const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    await documents.create('v1', {
      type: 'licencia', title: 'Licencia', expires_at: futureDate,
    });

    expect(insertedRow.status).toBe('ok');
  });

  it('sets status "expiring" for dates within 30 days', async () => {
    let insertedRow;
    builder.insert.mockImplementation((row) => { insertedRow = row; return builder; });
    builder.single.mockResolvedValueOnce({ data: { id: 'doc-1' }, error: null });

    const soonDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    await documents.create('v1', {
      type: 'licencia', title: 'Licencia', expires_at: soonDate,
    });

    expect(insertedRow.status).toBe('expiring');
  });
});

// ─── create — validation ──────────────────────────────────────────────────────

describe('create — validation', () => {
  it('throws on invalid document type', async () => {
    await expect(
      documents.create('v1', { type: 'invalid_type', title: 'Test', expires_at: '2030-01-01' })
    ).rejects.toThrow('Tipo inválido');
  });

  it('throws when title is missing', async () => {
    await expect(
      documents.create('v1', { type: 'licencia', expires_at: '2030-01-01' })
    ).rejects.toThrow('"title"');
  });

  it('throws when expires_at is missing', async () => {
    await expect(
      documents.create('v1', { type: 'licencia', title: 'Test' })
    ).rejects.toThrow('"expires_at"');
  });

  it('stores organization_id when provided', async () => {
    let insertedRow;
    builder.insert.mockImplementation((row) => { insertedRow = row; return builder; });
    builder.single.mockResolvedValueOnce({ data: { id: 'd1' }, error: null });

    await documents.create('v1',
      { type: 'licencia', title: 'Test', expires_at: '2030-01-01' },
      'org-uuid'
    );

    expect(insertedRow.organization_id).toBe('org-uuid');
  });

  it('defaults reminder_days to [30, 7, 0]', async () => {
    let insertedRow;
    builder.insert.mockImplementation((row) => { insertedRow = row; return builder; });
    builder.single.mockResolvedValueOnce({ data: { id: 'd1' }, error: null });

    await documents.create('v1', { type: 'licencia', title: 'Test', expires_at: '2030-01-01' });

    expect(insertedRow.reminder_days).toEqual([30, 7, 0]);
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('calls delete with correct filters', async () => {
    builder.eq
      .mockReturnValueOnce(builder)
      .mockReturnValueOnce({ error: null });

    await documents.remove('doc-uuid', 'v1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'doc-uuid');
  });

  it('throws when delete fails', async () => {
    builder.eq
      .mockReturnValueOnce(builder)
      .mockReturnValueOnce({ error: new Error('delete failed') });

    await expect(documents.remove('doc-uuid', 'v1')).rejects.toThrow('delete failed');
  });
});
