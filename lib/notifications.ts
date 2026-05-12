import { formatErrorMessage } from './errors';
import { supabase } from './supabase';

/** Notification preference keys stored per user. */
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

// Get user notification preferences
/** Returns saved notification preferences for a user. */
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
/** Updates notification preferences for a user. */
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

// Create in-app notification
/** Creates an in app notification and records metrics. */
export async function createInAppNotification(
  userId: string,
  preferenceKey: PreferenceKey,
  title: string,
  message: string,
  type: string,
) {
  const startedAt = Date.now();
  let delivered = false;
  let errorMessage: string | null = null;

  const { data: prefsRow, error: prefsError } = await supabase
    .from('notification_preferences')
    .select('preferences')
    .eq('user_id', userId)
    .single();

  if (prefsError && prefsError.code !== 'PGRST116') {
    errorMessage = formatErrorMessage(prefsError.message);
    await recordNotificationMetric(
      userId,
      preferenceKey,
      false,
      Date.now() - startedAt,
      errorMessage,
    );
    throw new Error(errorMessage);
  }

  const preferences = prefsRow?.preferences ?? {};

  // Global notification toggle
  if (preferences['all_notifications'] === false) {
    await recordNotificationMetric(
      userId,
      preferenceKey,
      false,
      Date.now() - startedAt,
      'Muted globally',
    );
    return;
  }

  // Specific notification toggle
  if (preferences[preferenceKey] === false) {
    await recordNotificationMetric(
      userId,
      preferenceKey,
      false,
      Date.now() - startedAt,
      'Muted by preference',
    );
    return;
  }

  const { error } = await supabase.from('in_app_notifications').insert({
    user_id: userId,
    title,
    message,
    type,
  });

  if (error) {
    errorMessage = formatErrorMessage(error.message);
    await recordNotificationMetric(
      userId,
      preferenceKey,
      false,
      Date.now() - startedAt,
      errorMessage,
    );
    throw new Error(errorMessage);
  }

  delivered = true;
  await recordNotificationMetric(userId, preferenceKey, delivered, Date.now() - startedAt, null);
}

// Get in-app notifications
/** Returns in app notifications for a user. */
export async function getInAppNotifications(userId: string) {
  const { data, error } = await supabase
    .from('in_app_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }

  return data;
}

// Mark notification as read
/** Marks a notification as read. */
export async function markNotificationAsRead(notificationId: string) {
  const { error } = await supabase
    .from('in_app_notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }
}

async function recordNotificationMetric(
  userId: string,
  preferenceKey: string,
  delivered: boolean,
  latencyMs: number,
  errorMessage: string | null,
) {
  try {
    await supabase.from('notification_delivery_metrics').insert({
      user_id: userId,
      preference_key: preferenceKey,
      delivered,
      latency_ms: latencyMs,
      error_message: errorMessage,
    });
  } catch (error) {
    console.warn('Failed to record notification metric', error);
  }
}
