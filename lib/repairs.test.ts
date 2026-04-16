import {
  createRepairRequest,
  deleteRepairRequest,
  getRepairRequestById,
  getRepairRequests,
  getRepairRequestsByReporter,
  updateRepairRequest,
  updateRepairStatus,
} from './repairs';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Repairs System', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('createRepairRequest', () => {
    it('creates a repair request with valid data', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'repair-1', title: 'Leaking tap' },
        error: null,
      });

      const result = await createRepairRequest('dorm-1', 'user-1', {
        title: 'Leaking tap',
        description: 'Kitchen sink is leaking overnight',
        location: 'kitchen',
        urgency: 'high',
      });

      expect(result.id).toBe('repair-1');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('throws error when required fields are missing', async () => {
      await expect(
        createRepairRequest('dorm-1', 'user-1', {
          title: 'Leaking tap',
          description: '',
          location: 'kitchen',
        }),
      ).rejects.toThrow('Repair description is required');
    });

    it('throws error for invalid dormId', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: {
          message:
            'insert or update on table "repair_requests" violates foreign key constraint "repair_requests_dorm_id_fkey"',
          code: '23503',
        },
      });

      await expect(
        createRepairRequest('invalid-dorm-id', 'user-1', {
          title: 'Leaking tap',
          description: 'Kitchen sink is leaking overnight',
          location: 'kitchen',
          urgency: 'medium',
        }),
      ).rejects.toThrow(
        'Insert or update on table "repair_requests" violates foreign key constraint "repair_requests_dorm_id_fkey"',
      );
    });
  });

  describe('updateRepairRequest', () => {
    it('updates an existing request with valid data', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'repair-1', status: 'in_progress' },
        error: null,
      });

      const updated = await updateRepairRequest('repair-1', {
        status: 'in_progress',
        resolution_notes: 'Parts ordered',
      });

      expect(updated.status).toBe('in_progress');
      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'in_progress',
        resolution_notes: 'Parts ordered',
      });
    });

    it('throws error for non-existent request', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      await expect(updateRepairRequest('missing-request', { status: 'completed' })).rejects.toThrow(
        'Repair request not found',
      );
    });
  });

  describe('deleteRepairRequest', () => {
    it('deletes an existing request', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 'repair-1' }, error: null });
      mockSupabase.eq.mockReturnValueOnce(mockSupabase).mockResolvedValueOnce({ error: null });

      await expect(deleteRepairRequest('repair-1')).resolves.not.toThrow();
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('throws error for non-existent request', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      await expect(deleteRepairRequest('missing-request')).rejects.toThrow(
        'Repair request not found',
      );
    });
  });

  describe('getRepairRequests', () => {
    it('returns requests for a populated dorm', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [{ id: 'repair-1', dorm_id: 'dorm-1' }],
        error: null,
      });

      const results = await getRepairRequests('dorm-1');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('repair-1');
    });

    it('returns empty array for an empty dorm', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const results = await getRepairRequests('dorm-empty');
      expect(results).toEqual([]);
    });

    it('throws error for invalid dormId', async () => {
      await expect(getRepairRequests('')).rejects.toThrow('Dorm ID is required');
    });
  });

  describe('getRepairRequestById', () => {
    it('returns a request for a valid ID', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'repair-1', title: 'Broken sink' },
        error: null,
      });

      const result = await getRepairRequestById('repair-1');
      expect(result?.id).toBe('repair-1');
    });

    it('returns null for a non-existent ID', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      const result = await getRepairRequestById('missing-id');
      expect(result).toBeNull();
    });
  });

  describe('getRepairRequestsByReporter', () => {
    it('returns requests for a user with requests', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [{ id: 'repair-1', submitted_by: 'user-1' }],
        error: null,
      });

      const results = await getRepairRequestsByReporter('user-1');
      expect(results).toHaveLength(1);
      expect(results[0].submitted_by).toBe('user-1');
    });

    it('returns empty list for a user with no requests', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const results = await getRepairRequestsByReporter('user-no-requests');
      expect(results).toEqual([]);
    });
  });

  describe('updateRepairStatus', () => {
    it('updates status to pending', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'repair-1', status: 'pending' },
        error: null,
      });

      const result = await updateRepairStatus('repair-1', 'pending');
      expect(result.status).toBe('pending');
    });

    it('updates status to in_progress', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'repair-1', status: 'in_progress' },
        error: null,
      });

      const result = await updateRepairStatus('repair-1', 'in_progress');
      expect(result.status).toBe('in_progress');
    });

    it('updates status to resolved', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'repair-1', status: 'completed' },
        error: null,
      });

      const result = await updateRepairStatus('repair-1', 'resolved');
      expect(result.status).toBe('resolved');
      expect(mockSupabase.update).toHaveBeenCalledWith({ status: 'completed' });
    });

    it('throws for invalid status string', async () => {
      await expect(updateRepairStatus('repair-1', 'bad' as any)).rejects.toThrow(
        'Repair status is invalid',
      );
    });

    it('throws for non-existent request', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      await expect(updateRepairStatus('missing-request', 'resolved')).rejects.toThrow(
        'Repair request not found',
      );
    });
  });
});
