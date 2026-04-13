import { updateRepairStatus } from './repairs';
import { supabase } from './supabase';

jest.mock('./supabase', () => {
  const mockSingle = jest.fn();

  const mockQueryBuilder: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: mockSingle,
  };

  return {
    supabase: {
      from: jest.fn(() => mockQueryBuilder),
      auth: {},
    },
  };
});

describe('updateRepairStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updates status to pending', async () => {
    const builder = (supabase.from as jest.Mock)();

    builder.single
      .mockResolvedValueOnce({ data: { id: '123' }, error: null }) // existence check
      .mockResolvedValueOnce({ data: { id: '123', status: 'pending' }, error: null }); // update

    const updated = await updateRepairStatus('123', 'pending');
    expect(updated.status).toBe('pending');
  });

  test('updates status to resolved', async () => {
    const builder = (supabase.from as jest.Mock)();

    builder.single
      .mockResolvedValueOnce({ data: { id: '123' }, error: null })
      .mockResolvedValueOnce({ data: { id: '123', status: 'resolved' }, error: null });

    const updated = await updateRepairStatus('123', 'resolved');
    expect(updated.status).toBe('resolved');
  });

  test('throws for invalid status', async () => {
    await expect(updateRepairStatus('123', 'banana' as any)).rejects.toThrow('Invalid status');
  });

  test('throws for uppercase status', async () => {
    await expect(updateRepairStatus('123', 'PENDING' as any)).rejects.toThrow('Invalid status');
  });

  test('throws for empty status', async () => {
    await expect(updateRepairStatus('123', '' as any)).rejects.toThrow('Invalid status');
  });

  test('throws for non-existent request', async () => {
    const builder = (supabase.from as jest.Mock)();

    builder.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    await expect(updateRepairStatus('999', 'pending')).rejects.toThrow('Repair request not found');
  });

  test('does NOT call update() when request does not exist', async () => {
    const builder = (supabase.from as jest.Mock)();

    builder.single.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116' },
    });

    await expect(updateRepairStatus('999', 'pending')).rejects.toThrow();
    expect(builder.update).not.toHaveBeenCalled();
  });

  test('calls Supabase with correct table and filters', async () => {
    const builder = (supabase.from as jest.Mock)();

    builder.single
      .mockResolvedValueOnce({ data: { id: '123' }, error: null })
      .mockResolvedValueOnce({ data: { id: '123', status: 'in_progress' }, error: null });

    await updateRepairStatus('123', 'in_progress');

    expect(supabase.from).toHaveBeenCalledWith('repairs');
    expect(builder.eq).toHaveBeenCalledWith('id', '123');
  });

  test('throws when Supabase update fails', async () => {
    const builder = (supabase.from as jest.Mock)();

    builder.single
      .mockResolvedValueOnce({ data: { id: '123' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: 'Database offline' } });

    await expect(updateRepairStatus('123', 'pending')).rejects.toThrow('Database offline');
  });

  test('throws when requestId is empty', async () => {
    await expect(updateRepairStatus('', 'pending')).rejects.toThrow();
  });

  test('throws when requestId is whitespace', async () => {
    await expect(updateRepairStatus('   ', 'pending')).rejects.toThrow();
  });

  test('throws when requestId is null', async () => {
    await expect(updateRepairStatus(null as any, 'pending')).rejects.toThrow();
  });

  test('throws when requestId is undefined', async () => {
    await expect(updateRepairStatus(undefined as any, 'pending')).rejects.toThrow();
  });
});
