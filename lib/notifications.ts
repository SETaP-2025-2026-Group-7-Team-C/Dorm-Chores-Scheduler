import { formatErrorMessage } from './errors';
import { supabase } from './supabase';

// Get user notification preferences
export async function getNotificationSettings(userId: string) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .single();

  if (error) {
    // No row yet → return empty (all default ON)
    if (error.code === 'PGRST116') return {};
    throw new Error(formatErrorMessage(error.message));
  }

  return data?.preferences ?? {};
}

// Update notification preferences
export async function updateNotificationSettings(
  userId: string,
  settings: Record<string, boolean>,
) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert({
      user_id: userId,
      preferences: settings,
    })
    .select()
    .single();

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }

  return data;
}
