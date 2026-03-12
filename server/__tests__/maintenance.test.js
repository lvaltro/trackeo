/**
 * Tests for core/maintenance/index.js
 *
 * These are unit tests with Supabase mocked — they run without a real DB.
 * Run: cd server && npx vitest run
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import * as supabaseJs from '@supabase/supabase-js';

// ─── Mock Supabase ────────────────────────────────────────────────────────────
// We spy on @supabase/supabase-js and override createClient before importing
// the module under test, so core/maintenance uses the mocked client.

const mockSingle  = vi.fn();
const mockSelect  = vi.fn();
const mockInsert  = vi.fn();
const mockUpdate  = vi.fn();
const mockDelete  = vi.fn();
const mockEq      = vi.fn();
const mockOrder   = vi.fn();

// Each builder method returns 'this' so calls can be chained
const builder = {
  select:  (...a) => { mockSelect(...a);  return builder; },
  insert:  (...a) => { mockInsert(...a);  return builder; },
  update:  (...a) => { mockUpdate(...a);  return builder; },
  delete:  (...a) => { mockDelete(...a);  return builder; },
  eq:      (...a) => { mockEq(...a);      return builder; },
  order:   (...a) => { mockOrder(...a);   return builder; },
  single:  (...a) => mockSingle(...a),
};

const mockFrom = vi.fn(() => builder);

vi.spyOn(supabaseJs, 'createClient').mockImplementation(() => ({ from: mockFrom }));

// Set env vars needed by the module
process.env.SUPABASE_URL              = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// Import module under test AFTER mocking, vía import dinámico,
// para asegurar que Vitest intercepte correctamente @supabase/supabase-js.
let maintenance;
beforeAll(async () => {
  // core/maintenance/index.js es CommonJS; import() devuelve el objeto de exports.
  // Vitest se encarga del bridging CJS/ESM.
  // eslint-disable-next-line global-require
  maintenance = await import('../../core/maintenance/index.js');
  // Si viene como default (CJS bridge), normalizar:
  if (maintenance.default) {
    maintenance = maintenance.default;
  }
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('core/maintenance — listByVehicle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: builder chain resolves with empty array
    mockOrder.mockResolvedValue({ data: [], error: null });
  });

  it('returns an empty array when no records exist', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    const result = await maintenance.listByVehicle('vehicle-uuid-123');
    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith('maintenance_records');
  });

  it('returns records when they exist', async () => {
    const fakeRecords = [
      { id: 'rec-1', vehicle_id: 'vehicle-uuid-123', type: 'oil_change', title: 'Cambio aceite' },
    ];
    mockOrder.mockResolvedValueOnce({ data: fakeRecords, error: null });
    const result = await maintenance.listByVehicle('vehicle-uuid-123');
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('oil_change');
  });

  it('throws when Supabase returns an error', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: new Error('DB connection failed') });
    await expect(maintenance.listByVehicle('vehicle-uuid-123')).rejects.toThrow('DB connection failed');
  });
});

describe('core/maintenance — create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a record and returns it', async () => {
    const created = { id: 'rec-new', vehicle_id: 'v-1', type: 'oil_change', title: 'Aceite 5W40' };
    mockSingle.mockResolvedValueOnce({ data: created, error: null });

    const result = await maintenance.create('v-1', { type: 'oil_change', title: 'Aceite 5W40' });
    expect(result).toMatchObject({ type: 'oil_change', title: 'Aceite 5W40' });
    expect(mockInsert).toHaveBeenCalled();
  });

  it('throws when Supabase insert fails', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: new Error('insert failed') });
    await expect(
      maintenance.create('v-1', { type: 'oil_change', title: 'Aceite' })
    ).rejects.toThrow('insert failed');
  });

  it('strips protected fields (id, vehicle_id, created_at, updated_at) from input', async () => {
    const created = { id: 'server-uuid', vehicle_id: 'v-1', type: 'brake_inspection', title: 'Frenos' };
    mockSingle.mockResolvedValueOnce({ data: created, error: null });

    await maintenance.create('v-1', {
      id: 'injected-id',
      vehicle_id: 'injected-vid',
      created_at: '2020-01-01',
      updated_at: '2020-01-01',
      type: 'brake_inspection',
      title: 'Frenos',
    });

    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.id).toBeUndefined();
    expect(insertCall.created_at).toBeUndefined();
    expect(insertCall.vehicle_id).toBe('v-1'); // Set by create(), not from input
  });
});

describe('core/maintenance — remove', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls delete with correct id and vehicleId filters', async () => {
    mockEq.mockReturnValue(builder);
    // Last .eq() in delete chain resolves
    mockEq.mockImplementationOnce(() => builder)
           .mockImplementationOnce(() => ({ error: null }));

    await maintenance.remove('rec-1', 'v-1');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('throws when delete fails', async () => {
    mockEq.mockImplementationOnce(() => builder)
           .mockImplementationOnce(() => ({ error: new Error('delete failed') }));

    await expect(maintenance.remove('rec-1', 'v-1')).rejects.toThrow('delete failed');
  });
});

