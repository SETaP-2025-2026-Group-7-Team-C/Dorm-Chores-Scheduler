import { getChores } from './chores';
import { formatErrorMessage } from './errors';
import { createInAppNotification } from './notifications';
import { supabase } from './supabase';

function dateOnly(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

async function notifyReminder(userId: string, count: number): Promise<void> {
  try {
    await createInAppNotification(
      userId,
      'daily_chore_reminder',
      'Daily chore reminder',
      `You have ${count} uncompleted chore${count === 1 ? '' : 's'} to review today.`,
      'chore',
    );
  } catch (error) {
    console.warn('Daily reminder delivery failed', error);
  }
}

/** Sends daily reminder notifications for a dorm. */
export async function runDailyChoreRemindersForDorm(
  dormId: string,
  runDate = new Date(),
): Promise<{ usersNotified: number }> {
  if (!dormId) throw new Error('Dorm ID is required');

  const today = dateOnly(runDate);
  const chores = await getChores(dormId);

  const pendingByUser: Record<string, number> = {};
  chores
    .filter((c) => c.status !== 'completed' && !!c.meta?.assignedTo)
    .forEach((c) => {
      const userId = c.meta?.assignedTo as string;
      pendingByUser[userId] = (pendingByUser[userId] || 0) + 1;
    });

  let usersNotified = 0;
  for (const [userId, count] of Object.entries(pendingByUser)) {
    const { data: existingRun, error: existingRunError } = await supabase
      .from('chore_reminder_runs')
      .select('id')
      .eq('dorm_id', dormId)
      .eq('user_id', userId)
      .eq('run_date', today)
      .maybeSingle();

    if (existingRunError && existingRunError.code !== 'PGRST116') {
      throw new Error(formatErrorMessage(existingRunError.message));
    }

    if (existingRun?.id) continue;

    await notifyReminder(userId, count);
    usersNotified += 1;

    const { error: insertRunError } = await supabase.from('chore_reminder_runs').insert({
      dorm_id: dormId,
      user_id: userId,
      run_date: today,
      reminder_count: count,
    });

    if (insertRunError) {
      throw new Error(formatErrorMessage(insertRunError.message));
    }
  }

  return { usersNotified };
}
