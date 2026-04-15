import { supabase } from './supabase';

export type PreferenceKey =
  | 'new_chore_assignment'
  | 'chore_due_soon'
  | 'chore_overdue'
  | 'chore_completed'
  | 'new_repair_request'
  | 'repair_status_updated'
  | 'repair_comment'
  | 'daily_chore_reminder'
  | 'weekly_schedule_generated'
  | 'system_announcement'
  | 'account_activity_update';

export async function createInAppNotification(
  userId: string,
  preferenceKey: PreferenceKey,
  title: string,
  message: string,
  type: string,
) {
  const { data: prefsRow, error: prefsError } = await supabase
    .from('notification_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .single();

  if (prefsError && prefsError.code !== 'PGRST116') {
    throw new Error(prefsError.message);
  }

  const preferences = prefsRow?.preferences ?? {};

  // Global notification toggle
  if (preferences['all_notifications'] === false) {
    return;
  }

  // Specific notification toggle
  if (preferences[preferenceKey] === false) {
    return;
  }

  const { error } = await supabase.from('in_app_notifications').insert({
    user_id: userId,
    title,
    message,
    type,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getInAppNotifications(userId: string) {
  const { data, error } = await supabase
    .from('in_app_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('in_app_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    throw new Error(error.message);
  }
}
