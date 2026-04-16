import { getCurrentUser } from './auth';
import {
  createDorm,
  createManagerDormLinkPayload,
  createManagerDormManualCode,
  deleteDorm,
  getDormById,
  getDormStats,
  getDormsByManager,
  getManagerOverview,
  joinDorm,
  leaveDorm,
  linkDormToManagerByJoinCode,
  linkDormToManagerByManualCode,
  linkDormToManagerByQr,
  parseManagerDormLinkPayload,
  parseManagerDormManualCode,
  updateDorm,
} from './dorms';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('./auth', () => ({
  getCurrentUser: jest.fn(),
}));

describe('Dorms System', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockReturnThis(),
      match: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('getDormById', () => {
    it('returns a dorm for a valid ID', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dorm-1' },
        error: null,
      });
      const dorm = await getDormById('dorm-1');
      expect(dorm?.id).toBe('dorm-1');
    });

    it('returns null for a non-existent ID', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });
      const dorm = await getDormById('bad-id');
      expect(dorm).toBeNull();
    });
  });

  describe('getDormsByManager', () => {
    it('returns dorms created by manager', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [{ id: 'dorm-1', created_by: 'mgr-1' }],
        error: null,
      });
      const dorms = await getDormsByManager('mgr-1');
      expect(dorms).toHaveLength(1);
      expect(dorms[0].created_by).toBe('mgr-1');
    });
  });

  describe('createDorm', () => {
    it('creates a dorm with valid data', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ count: 0, error: null });
      mockSupabase.eq.mockResolvedValueOnce({ count: 0, error: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dorm-1', name: 'Maple' },
        error: null,
      });
      const dorm = await createDorm({ name: 'Maple' }, 'user-1');
      expect(dorm.name).toBe('Maple');
    });

    it('throws error when user has reached max created dorms', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ count: 3, error: null });
      await expect(createDorm({ name: 'Maple' }, 'user-1')).rejects.toThrow(
        'You can only create up to 3 dorms. Delete one you created to make room.',
      );
    });

    it('throws error if name is missing', async () => {
      await expect(createDorm({ name: '' }, 'user-1')).rejects.toThrow('Dorm name is required');
    });
  });

  describe('updateDorm', () => {
    it('updates a dorm successfully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dorm-1', name: 'Oak' },
        error: null,
      });
      const dorm = await updateDorm('dorm-1', { name: 'Oak' });
      expect(dorm.name).toBe('Oak');
    });
  });

  describe('deleteDorm', () => {
    it('deletes a dorm successfully', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValueOnce({ id: 'user-1' });
      mockSupabase.single.mockResolvedValueOnce({
        data: { created_by: 'user-1' },
        error: null,
      });
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'dorm-1' },
        error: null,
      });
      await expect(deleteDorm('dorm-1')).resolves.not.toThrow();
    });
  });

  describe('joinDorm', () => {
    it('joins a dorm successfully', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ count: 0, error: null });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dorm-1' },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { user_id: 'user-1', dorm_id: 'dorm-1' },
        error: null,
      });

      const member = await joinDorm('user-1', 'CODE12');
      expect(member.user_id).toBe('user-1');
      expect(member.dorm_id).toBe('dorm-1');
    });

    it('throws error when user has reached max dorm memberships', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ count: 5, error: null });
      await expect(joinDorm('user-1', 'CODE12')).rejects.toThrow(
        'You can only be part of up to 5 dorms.',
      );
    });
  });

  describe('leaveDorm', () => {
    it('leaves a dorm successfully', async () => {
      mockSupabase.match.mockResolvedValueOnce({ error: null });
      await expect(leaveDorm('user-1', 'dorm-1')).resolves.not.toThrow();
    });
  });

  describe('manager dorm QR linking', () => {
    it('builds QR payload from a valid dorm', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'dorm-1', join_code: 'CODE12' },
        error: null,
      });

      const payload = await createManagerDormLinkPayload('dorm-1');
      expect(payload).toContain('dcs://manager-link?');
      expect(payload).toContain('dormId=dorm-1');
      expect(payload).toContain('joinCode=CODE12');
    });

    it('parses a valid manager-dorm QR payload', () => {
      const parsed = parseManagerDormLinkPayload(
        'dcs://manager-link?dormId=dorm-1&joinCode=abc123',
      );
      expect(parsed).toEqual({ dormId: 'dorm-1', joinCode: 'ABC123' });
    });

    it('links dorm to manager from QR payload', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: { is_manager: true }, error: null })
        .mockResolvedValueOnce({ data: { id: 'dorm-1', join_code: 'CODE12' }, error: null });
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'dorm-1', name: 'Maple', join_code: 'CODE12', created_by: 'mgr-1' },
        error: null,
      });

      const linked = await linkDormToManagerByQr(
        'mgr-1',
        'dcs://manager-link?dormId=dorm-1&joinCode=CODE12',
      );

      expect(linked.id).toBe('dorm-1');
      expect(mockSupabase.update).toHaveBeenCalledWith({ created_by: 'mgr-1' });
    });

    it('links dorm to manager from manual join code', async () => {
      mockSupabase.single
        .mockResolvedValueOnce({ data: { is_manager: true }, error: null })
        .mockResolvedValueOnce({
          data: { id: 'dorm-1', name: 'Maple', join_code: 'CODE12', created_by: 'mgr-1' },
          error: null,
        });
      mockSupabase.limit.mockResolvedValueOnce({ data: [{ id: 'dorm-1' }], error: null });
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: { id: 'dorm-1', name: 'Maple', join_code: 'CODE12', created_by: 'mgr-1' },
        error: null,
      });

      const linked = await linkDormToManagerByJoinCode('mgr-1', 'code12');

      expect(linked.id).toBe('dorm-1');
      expect(mockSupabase.update).toHaveBeenCalledWith({ created_by: 'mgr-1' });
    });

    it('builds and parses complex manager connect code', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          join_code: 'CODE12',
        },
        error: null,
      });

      const code = await createManagerDormManualCode('dorm-1');
      expect(code.startsWith('DCSM-CODE12-')).toBe(true);

      const parsed = parseManagerDormManualCode(code);
      expect(parsed).toEqual({
        dormId: '123e4567-e89b-12d3-a456-426614174000',
        joinCode: 'CODE12',
      });
    });

    it('links dorm to manager from complex manager connect code', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          join_code: 'CODE12',
        },
        error: null,
      });

      const code = await createManagerDormManualCode('dorm-1');

      mockSupabase.single
        .mockResolvedValueOnce({ data: { is_manager: true }, error: null })
        .mockResolvedValueOnce({
          data: { id: '123e4567-e89b-12d3-a456-426614174000', join_code: 'CODE12' },
          error: null,
        });
      mockSupabase.maybeSingle.mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Maple',
          join_code: 'CODE12',
          created_by: 'mgr-1',
        },
        error: null,
      });

      const linked = await linkDormToManagerByManualCode('mgr-1', code);
      expect(linked.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('throws for invalid manual join code', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { is_manager: true }, error: null });
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });

      await expect(linkDormToManagerByJoinCode('mgr-1', 'BAD123')).rejects.toThrow(
        'Invalid join code or dorm not found',
      );
    });

    it('throws when a join code maps to multiple dorms', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { is_manager: true }, error: null });
      mockSupabase.limit.mockResolvedValueOnce({
        data: [{ id: 'dorm-1' }, { id: 'dorm-2' }],
        error: null,
      });

      await expect(linkDormToManagerByJoinCode('mgr-1', 'CODE12')).rejects.toThrow(
        'This join code matches multiple dorms. Please use the manager connect code.',
      );
    });

    it('throws a clear error when manager link update returns no rows', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { is_manager: true }, error: null });
      mockSupabase.limit.mockResolvedValueOnce({ data: [{ id: 'dorm-1' }], error: null });
      mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      await expect(linkDormToManagerByJoinCode('mgr-1', 'CODE12')).rejects.toThrow(
        'Unable to link this dorm right now. Verify your database update policy for manager linking.',
      );
    });
  });

  describe('getDormStats', () => {
    it('returns stats for a dorm with data', async () => {
      mockSupabase.match
        .mockResolvedValueOnce({ count: 10, error: null })
        .mockResolvedValueOnce({ count: 7, error: null })
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ count: 4, error: null });
      mockSupabase.in.mockResolvedValueOnce({ count: 2, error: null });

      const stats = await getDormStats('dorm-1');
      expect(stats.choreCompletionRate).toBe(70);
      expect(stats.openRepairs).toBe(2);
      expect(stats.memberCount).toBe(4);
    });

    it('returns zeroed stats for an empty dorm', async () => {
      mockSupabase.match
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockResolvedValueOnce({ count: 0, error: null })
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ count: 0, error: null });
      mockSupabase.in.mockResolvedValueOnce({ count: 0, error: null });

      const stats = await getDormStats('dorm-empty');
      expect(stats).toEqual({
        choreCompletionRate: 0,
        openRepairs: 0,
        memberCount: 0,
        totalChores: 0,
        completedChores: 0,
      });
    });

    it('throws for invalid dormId', async () => {
      await expect(getDormStats('')).rejects.toThrow('Dorm ID is required');
    });
  });

  describe('getManagerOverview', () => {
    it('returns aggregated stats for manager with multiple dorms', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [
          { id: 'dorm-1', created_by: 'mgr-1' },
          { id: 'dorm-2', created_by: 'mgr-1' },
        ],
        error: null,
      });

      mockSupabase.match
        .mockResolvedValueOnce({ count: 10, error: null })
        .mockResolvedValueOnce({ count: 6, error: null })
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ count: 4, error: null })
        .mockResolvedValueOnce({ count: 5, error: null })
        .mockResolvedValueOnce({ count: 5, error: null })
        .mockReturnValueOnce(mockSupabase)
        .mockResolvedValueOnce({ count: 3, error: null });

      mockSupabase.in
        .mockResolvedValueOnce({ count: 3, error: null })
        .mockResolvedValueOnce({ count: 1, error: null });

      const overview = await getManagerOverview('mgr-1');
      expect(overview).toEqual({
        dormCount: 2,
        choreCompletionRate: 73,
        openRepairs: 4,
        memberCount: 7,
      });
    });

    it('returns zeroed stats for manager with no dorms', async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: [], error: null });

      const overview = await getManagerOverview('mgr-no-dorms');
      expect(overview).toEqual({
        dormCount: 0,
        choreCompletionRate: 0,
        openRepairs: 0,
        memberCount: 0,
      });
    });
  });
});
