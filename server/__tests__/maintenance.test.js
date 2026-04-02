/**
 * Tests for core/maintenance/index.js
 *
 * Strategy: use createRequire to load CJS modules directly and replace
 * supabaseLib.getClient with a mock before requiring the module under test.
 * This bypasses vi.mock() CJS interception issues entirely.
 *
 * Run: cd server && npx vitest run
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { createRequire } from 'module';

const _require = createRequire(import.meta.url);

// ─── Mock client setup ────────────────────────────────────────────────────────

let mockFrom, builder, mockClient;

function resetBuilder() {
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockDelete = vi.fn();
  const mockEq     = vi.fn();
  const mockOrder  = vi.fn();
  const mockSelect = vi.fn();

  builder = {
    _spies: { mockSingle, mockInsert, mockUpdate, mockDelete, mockEq, mockOrder, mockSelect },
    insert: vi.fn((...a) => { mockInsert(...a); return builder; }),
    update: vi.fn((...a) => { mockUpdate(...a); return builder; }),
    delete: vi.fn((...a) => { mockDelete(...a); return builder; }),
    select: vi.fn((...a) => { mockSelect(...a); return builder; }),
    eq:     vi.fn((...a) => { mockEq(...a);     return builder; }),
    order:  vi.fn((...a) => mockOrder(...a)),
    single: vi.fn((...a) => mockSingle(...a)),
  };

  mockFrom = vi.fn(() => builder);
  mockClient = { from: mockFrom };
}

// ─── Wire mock before module loads ───────────────────────────────────────────

let maintenance;
beforeAll(() => {
  resetBuilder();

  // Replace getClient on the supabaseLib module object BEFORE maintenance loads.
  // Since CJS module exports are mutable objects shared by all requirers,
  // maintenance's `supabaseLib.getClient()` calls will use this mock.
  const supabaseLib = _require('../../core/lib/supabaseClient.js');
  supabaseLib.getClient = vi.fn(() => mockClient);

  maintenance = _require('../../core/maintenance/index.js');
});

beforeEach(() => {
  resetBuilder();
  // Update mockClient so subsequent getClient() calls return the fresh builder
  mockClient.from = mockFrom;
});

// ─── listByVehicle ────────────────────────────────────────────────────────────

describe('listByVehicle', () => {
  it('queries maintenance_records table', async () => {
    builder.order.mockResolvedValueOnce({ data: [], error: null });
    await maintenance.listByVehicle('v1');
    expect(mockFrom).toHaveBeenCalledWith('maintenance_records');
  });

  it('returns empty array when no records exist', async () => {
    builder.order.mockResolvedValueOnce({ data: [], error: null });
    expect(await maintenance.listByVehicle('v1')).toEqual([]);
  });

  it('returns records when they exist', async () => {
    const rows = [{ id: 'r1', vehicle_id: 'v1', type: 'oil_change', title: 'Cambio aceite' }];
    builder.order.mockResolvedValueOnce({ data: rows, error: null });
    const result = await maintenance.listByVehicle('v1');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('oil_change');
  });

  it('throws when Supabase returns an error', async () => {
    builder.order.mockResolvedValueOnce({ data: null, error: new Error('DB connection failed') });
    await expect(maintenance.listByVehicle('v1')).rejects.toThrow('DB connection failed');
  });
});

// ─── create ──────────────────────────────────────────────────────────────────

describe('create', () => {
  it('creates a record and returns it', async () => {
    const created = { id: 'r-new', vehicle_id: 'v1', type: 'oil_change', title: 'Aceite 5W40' };
    builder.single.mockResolvedValueOnce({ data: created, error: null });
    const result = await maintenance.create('v1', { type: 'oil_change', title: 'Aceite 5W40' });
    expect(result).toMatchObject({ type: 'oil_change', title: 'Aceite 5W40' });
  });

  it('throws when Supabase insert fails', async () => {
    builder.single.mockResolvedValueOnce({ data: null, error: new Error('insert failed') });
    await expect(
      maintenance.create('v1', { type: 'oil_change', title: 'Aceite' })
    ).rejects.toThrow('insert failed');
  });

  it('strips protected fields from input', async () => {
    builder.single.mockResolvedValueOnce({ data: { id: 'srv' }, error: null });
    await maintenance.create('v1', {
      id: 'injected-id', vehicle_id: 'injected-vid',
      created_at: '2020-01-01', updated_at: '2020-01-01',
      type: 'brake_inspection', title: 'Frenos',
    });
    const arg = builder.insert.mock.calls[0][0];
    expect(arg.id).toBeUndefined();
    expect(arg.created_at).toBeUndefined();
    expect(arg.vehicle_id).toBe('v1');
  });

  it('stores organization_id when provided', async () => {
    builder.single.mockResolvedValueOnce({ data: { id: 'r1' }, error: null });
    await maintenance.create('v1', { type: 'oil_change', title: 'Test' }, 'org-uuid');
    expect(builder.insert.mock.calls[0][0].organization_id).toBe('org-uuid');
  });

  it('stores null organization_id when not provided', async () => {
    builder.single.mockResolvedValueOnce({ data: { id: 'r1' }, error: null });
    await maintenance.create('v1', { type: 'oil_change', title: 'Test' });
    expect(builder.insert.mock.calls[0][0].organization_id).toBeNull();
  });
});

// ─── update ──────────────────────────────────────────────────────────────────

describe('update', () => {
  it('returns updated record', async () => {
    builder.single.mockResolvedValueOnce({ data: { id: 'r1', title: 'Actualizado' }, error: null });
    const result = await maintenance.update('r1', 'v1', { title: 'Actualizado' });
    expect(result.title).toBe('Actualizado');
  });

  it('throws when update fails', async () => {
    builder.single.mockResolvedValueOnce({ data: null, error: new Error('update failed') });
    await expect(maintenance.update('r1', 'v1', { title: 'X' })).rejects.toThrow('update failed');
  });

  it('strips protected fields from update input', async () => {
    builder.single.mockResolvedValueOnce({ data: { id: 'r1' }, error: null });
    await maintenance.update('r1', 'v1', { id: 'hacked', vehicle_id: 'hacked', title: 'OK' });
    const arg = builder.update.mock.calls[0][0];
    expect(arg.id).toBeUndefined();
    expect(arg.vehicle_id).toBeUndefined();
    expect(arg.title).toBe('OK');
  });
});

// ─── remove ──────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('calls delete with correct id filter', async () => {
    builder.eq
      .mockReturnValueOnce(builder)
      .mockReturnValueOnce({ error: null });
    await maintenance.remove('r1', 'v1');
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith('id', 'r1');
  });

  it('throws when delete fails', async () => {
    builder.eq
      .mockReturnValueOnce(builder)
      .mockReturnValueOnce({ error: new Error('delete failed') });
    await expect(maintenance.remove('r1', 'v1')).rejects.toThrow('delete failed');
  });
});
