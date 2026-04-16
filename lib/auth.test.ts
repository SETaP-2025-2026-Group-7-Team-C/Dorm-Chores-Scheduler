import {
  getCurrentUser,
  getUserRole,
  isAuthenticated,
  resetPassword,
  signInUser,
  signOutUser,
  signUpUser,
  updateDisplayName,
} from './auth';
import { UnauthorisedError, ValidationError } from './errors';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    single: jest.fn(),
  },
}));

describe('Authentication Functions', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signInUser', () => {
    it('successfully signs in with valid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: '1' }, session: { access_token: 'token' } },
        error: null,
      });

      const data = await signInUser('test@example.com', 'ValidPass1!');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass1!',
      });
      expect(data.user?.id).toBe('1');
    });

    it('throws UnauthorisedError on wrong password/invalid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid login credentials' },
      });

      await expect(signInUser('test@example.com', 'WrongPass1!')).rejects.toThrow(
        UnauthorisedError,
      );
    });

    it('throws validation error with invalid email', async () => {
      await expect(signInUser('invalid-email', 'Password12!')).rejects.toThrow(ValidationError);
      expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('signUpUser', () => {
    it('successfully signs up with valid input', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: '1' } },
        error: null,
      });

      const data = await signUpUser('test@example.com', 'ValidPass1!', 'John Doe', 'student');
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'ValidPass1!',
        options: {
          data: {
            display_name: 'John Doe',
            is_manager: false,
          },
        },
      });
      expect(data.user?.id).toBe('1');
    });

    it('throws validation error for duplicate email (if supabase returns already registered)', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { message: 'already registered' },
      });

      await expect(
        signUpUser('test@example.com', 'ValidPass1!', 'John Doe', 'student'),
      ).rejects.toThrow(ValidationError);
    });

    it('throws validation error for weak password', async () => {
      await expect(signUpUser('test@example.com', 'weak', 'John Doe', 'student')).rejects.toThrow(
        ValidationError,
      );
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });

    it('throws validation error for invalid display name', async () => {
      await expect(signUpUser('test@example.com', 'ValidPass1!', 'A', 'student')).rejects.toThrow(
        ValidationError,
      );
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });
  });

  describe('updateDisplayName', () => {
    const mockUserId = '123-abc';

    it('successfully updates a valid display name', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await updateDisplayName(mockUserId, 'John Doe');
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });

    it('throws validation error on blank name', async () => {
      await expect(updateDisplayName(mockUserId, '   ')).rejects.toThrow(ValidationError);
    });

    it('throws validation error when name contains numbers', async () => {
      await expect(updateDisplayName(mockUserId, 'John123')).rejects.toThrow(ValidationError);
    });

    it('throws validation error when name is too short', async () => {
      await expect(updateDisplayName(mockUserId, 'A')).rejects.toThrow(ValidationError);
    });

    it('throws validation error when name is too long', async () => {
      const longName = 'A'.repeat(51);
      await expect(updateDisplayName(mockUserId, longName)).rejects.toThrow(ValidationError);
    });

    it('throws validation error for SQL injection attempt', async () => {
      await expect(updateDisplayName(mockUserId, 'John; DROP TABLE users;')).rejects.toThrow(
        ValidationError,
      );
    });
  });

  describe('signOutUser', () => {
    it('clears session correctly without error', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });

      await signOutUser();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('throws error when sign out fails', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({
        error: { message: 'Failed to sign out' },
      });

      await expect(signOutUser()).rejects.toThrow('Failed to sign out');
    });
  });

  describe('resetPassword', () => {
    it('calls reset password with valid email', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({ error: null });

      await resetPassword('test@example.com');
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('throws validation error on invalid email', async () => {
      await expect(resetPassword('invalid-email')).rejects.toThrow(ValidationError);
      expect(supabase.auth.resetPasswordForEmail).not.toHaveBeenCalled();
    });

    it('throws error if resetPasswordForEmail fails (e.g., unregistered if API responds differently)', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        error: { message: 'User not found' },
      });

      await expect(resetPassword('unregistered@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('getCurrentUser', () => {
    it('returns authenticated user with role', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'mock-user-id', email: 'test@example.com' } },
        error: null,
      });

      // Mock getUserRole call
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: { is_manager: true },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      });

      const user = await getCurrentUser();
      expect(user).toEqual({
        id: 'mock-user-id',
        email: 'test@example.com',
        role: 'manager',
        avatarUrl: null,
        displayName: null,
      });
    });

    it('returns null if there is no user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });
  });

  describe('getUserRole', () => {
    it('returns manager role', async () => {
      (supabase.from as jest.Mock)()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: { is_manager: true },
          error: null,
        });

      const role = await getUserRole('mock-id');
      expect(role).toBe('manager');
    });

    it('returns student role', async () => {
      (supabase.from as jest.Mock)()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: { is_manager: false },
          error: null,
        });

      const role = await getUserRole('mock-id');
      expect(role).toBe('student');
    });

    it('returns null for unknown/unregistered user (PGRST116)', async () => {
      (supabase.from as jest.Mock)()
        .select()
        .eq()
        .single.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        });

      const role = await getUserRole('mock-id');
      expect(role).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true with an active user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'mock-id' } },
      });

      const authed = await isAuthenticated();
      expect(authed).toBe(true);
    });

    it('returns false without an active user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
        data: { user: null },
      });

      const authed = await isAuthenticated();
      expect(authed).toBe(false);
    });
  });
});
