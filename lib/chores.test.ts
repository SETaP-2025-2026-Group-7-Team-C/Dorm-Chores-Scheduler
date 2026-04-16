import {
  createChore,
  deleteChore,
  getChoreById,
  getChores,
  markChoreComplete,
  updateChore,
} from './chores';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Chores System', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };
    (supabase.from as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('getChores', () => {
    it('returns all chores for a populated dorm', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [{ id: '1', title: 'Sweep' }],
        error: null,
      });
      const chores = await getChores('dorm-123');
      expect(chores).toHaveLength(1);
    });

    it('returns empty array for an empty dorm', async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: [], error: null });
      const chores = await getChores('empty-dorm');
      expect(chores).toEqual([]);
    });

    it('throws error for missing dormId', async () => {
      await expect(getChores('')).rejects.toThrow('Dorm ID is required');
    });
  });

  describe('getChoreById', () => {
    it('returns a chore for a valid ID', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { id: 'chore-1' }, error: null });
      const chore = await getChoreById('chore-1');
      expect(chore?.id).toBe('chore-1');
    });

    it('returns null for a non-existent ID', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      const chore = await getChoreById('bad-id');
      expect(chore).toBeNull();
    });
  });

  describe('createChore', () => {
    it('creates a chore with valid data', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: { id: '1', title: 'Clean' }, error: null });
      const chore = await createChore('dorm-1', { title: 'Clean' });
      expect(chore.title).toBe('Clean');
    });

    it('creates chore as pending when no eligible members are available', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ count: 0, error: null });
      mockSupabase.order.mockResolvedValueOnce({
        data: [{ user_id: 'user-1' }],
        error: null,
      });
      mockSupabase.in.mockResolvedValueOnce({
        data: [{ id: 'user-1', availability_status: 'unavailable' }],
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({ data: { id: '1', title: 'Clean' }, error: null });

      await createChore('dorm-1', { title: 'Clean' });

      const insertedPayload = mockSupabase.insert.mock.calls[0][0][0];
      expect(insertedPayload.status).toBe('pending');
      expect(insertedPayload.description).toContain('"assignedTo":null');
    });

    it('throws error if dorm has reached max chore limit', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ count: 500, error: null });
      await expect(createChore('dorm-1', { title: 'Clean' })).rejects.toThrow(
        'Dorm chore limit reached (500).',
      );
    });

    it('throws error if title is missing', async () => {
      await expect(createChore('dorm-1', { title: '' })).rejects.toThrow('Chore title is required');
    });

    it('throws error if dormId is invalid/missing', async () => {
      await expect(createChore('', { title: 'Clean' })).rejects.toThrow('Dorm ID is required');
    });
  });

  describe('updateChore', () => {
    it('updates a chore successfully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', title: 'Old Title', meta: {} },
        error: null,
      });
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', title: 'New Title' },
        error: null,
      });

      const chore = await updateChore('1', { title: 'New Title' });
      expect(chore.title).toBe('New Title');
    });

    it('throws error if chore is non-existent', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      await expect(updateChore('bad-id', { title: 'x' })).rejects.toThrow('Chore not found');
    });

    it('throws error on invalid data', async () => {
      await expect(updateChore('1', { title: '' })).rejects.toThrow('Chore title cannot be empty');
    });
  });

  describe('deleteChore', () => {
    it('deletes a valid chore successfully', async () => {
      mockSupabase.eq.mockResolvedValueOnce({ error: null });
      await expect(deleteChore('chore-1')).resolves.not.toThrow();
    });

    it('throws error if id is missing', async () => {
      await expect(deleteChore('')).rejects.toThrow('Chore ID is required');
    });
  });

  describe('markChoreComplete', () => {
    it('marks chore as complete', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', status: 'pending', title: 'Sweep', meta: {} },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', status: 'pending', title: 'Sweep', meta: {} },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', status: 'completed' },
        error: null,
      });

      const chore = await markChoreComplete('1');
      expect(chore.status).toBe('completed');
    });

    it('throws error if already completed', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: '1', status: 'completed' },
        error: null,
      });
      await expect(markChoreComplete('1')).rejects.toThrow('Chore is already completed');
    });

    it('throws error if absent', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });
      await expect(markChoreComplete('bad-id')).rejects.toThrow('Chore not found');
    });
  });
});
