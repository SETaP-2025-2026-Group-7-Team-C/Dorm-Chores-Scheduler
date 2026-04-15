import * as FileSystem from 'expo-file-system';
import { UnauthorisedError, ValidationError, formatErrorMessage } from './errors';
import { supabase } from './supabase';
import {
  normaliseEmail,
  validateDisplayName,
  validateResetPasswordFields,
  validateSignInFields,
  validateSignUpFields,
} from './validation';

export async function signInUser(email: string, password: string) {
  const normEmail = normaliseEmail(email);
  validateSignInFields(normEmail, password);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normEmail,
    password,
  });

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      throw new UnauthorisedError('Invalid login credentials');
    }
    throw new Error(formatErrorMessage(error.message)); // Other unknown errors
  }

  return data;
}

export async function signUpUser(
  email: string,
  password: string,
  displayName: string,
  role: string,
) {
  const normEmail = normaliseEmail(email);

  validateDisplayName(displayName);
  validateSignUpFields(normEmail, password);

  const { data, error } = await supabase.auth.signUp({
    email: normEmail,
    password,
    options: {
      data: {
        display_name: displayName,
        is_manager: role === 'manager',
      },
    },
  });

  if (error) {
    if (error.message.includes('already registered')) {
      throw new ValidationError('User already registered');
    }
    throw new Error(formatErrorMessage(error.message));
  }

  return data;
}

export async function updateDisplayName(userId: string, newDisplayName: string) {
  validateDisplayName(newDisplayName);

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: newDisplayName })
    .eq('id', userId);

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }
}

export async function softDeleteCurrentUser(userId: string) {
  if (!userId) {
    throw new Error('User ID is required.');
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      display_name: 'Deleted User',
      avatar_url: null,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }
}
export async function isSoftDeletedUser(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('is_deleted')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return false;
    }
    throw new Error(formatErrorMessage(error.message));
  }

  return data?.is_deleted === true;
}

export async function resetPassword(email: string) {
  const normEmail = normaliseEmail(email);
  validateResetPasswordFields(normEmail);

  const { error } = await supabase.auth.resetPasswordForEmail(normEmail);

  if (error) {
    // Note: Suapbase typically doesn't reveal if user exists by default for security,
    // but we handle error if explicit.
    throw new Error(formatErrorMessage(error.message));
  }
}

export async function getCurrentUser() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('display_name, is_manager, avatar_url')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(formatErrorMessage(profileError.message));
  }

  const role = profile?.is_manager ? 'manager' : 'student';

  return {
    ...user,
    role,
    displayName: profile?.display_name || null,
    avatarUrl: profile?.avatar_url || null,
  };
}

export async function getUserRole(userId: string): Promise<'student' | 'manager' | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_manager')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // The user profile was not found
    }
    throw new Error(formatErrorMessage(error.message));
  }

  return data?.is_manager ? 'manager' : 'student';
}

export async function isAuthenticated(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return !!user;
}

export async function uploadProfilePicture(userId: string, localUri: string): Promise<string> {
  if (!userId) throw new Error('User ID is required to upload profile picture.');
  if (!localUri) throw new Error('A valid local file URI is required.');

  try {
    const rawExt = localUri.split('.').pop()?.toLowerCase() || 'jpeg';
    const allowedExtensions = ['jpeg', 'jpg', 'png', 'webp'];
    if (!allowedExtensions.includes(rawExt)) {
      throw new Error(`Invalid file type. Allowed: ${allowedExtensions.join(', ')}.`);
    }

    const fileExt = rawExt === 'jpg' ? 'jpeg' : rawExt;
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const contentType = `image/${fileExt}`;

    // get current avatar
    const { data: profile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (profileFetchError && profileFetchError.code !== 'PGRST116') {
      console.error('Issue verifying previous profile image:', profileFetchError.message);
    }

    // fetch buffer natively
    const fileInstance = new FileSystem.File(localUri);
    const arrayBuffer = await fileInstance.arrayBuffer();

    // 1mb limit
    const MAX_SIZE_BYTES = 1048576;
    if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
      throw new Error(
        `File is too large (${(arrayBuffer.byteLength / 1048576).toFixed(2)} MB). Max size permitted is 1.0 MB.`,
      );
    }

    const { error: uploadError } = await supabase.storage
      .from('User Avatars')
      .upload(fileName, arrayBuffer, {
        upsert: true,
        contentType,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data } = supabase.storage.from('User Avatars').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', userId);

    if (updateError) throw new Error(`Failed to update profile: ${updateError.message}`);

    // replace old avatar
    if (profile?.avatar_url) {
      const match = profile.avatar_url.match(/\/User%20Avatars\/(.+)$/);
      if (match && match[1]) {
        const oldFilePath = decodeURIComponent(match[1]);
        const { error: removeError } = await supabase.storage
          .from('User Avatars')
          .remove([oldFilePath]);

        if (removeError) {
          console.warn('Failed to delete old profile picture:', removeError.message);
        }
      }
    }

    return publicUrl;
  } catch (error: any) {
    throw new Error(error.message || 'An error occurred while uploading.');
  }
}
