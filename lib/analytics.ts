import { getChores } from './chores';
import { supabase } from './supabase';

/** Returns a date string in YYYY MM DD format using UTC. */
function dateOnly(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Returns the Monday start of week for a date in UTC. */
function weekStart(date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns a new date with a number of days added in UTC. */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Summary counts and completion rate for a week window. */
export interface WeeklyChoreSummary {
  weekStartDate: string;
  weekEndDate: string;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  completionRate: number;
}

/** Per user completion totals across chores. */
export interface UserCompletionHistoryItem {
  userId: string;
  displayName?: string;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
}

/** Returns weekly counts and completion rate for a dorm. */
export async function getWeeklyChoreSummary(
  dormId: string,
  anchorDate = new Date(),
): Promise<WeeklyChoreSummary> {
  const ws = weekStart(anchorDate);
  const we = addDays(ws, 6);
  const chores = await getChores(dormId);

  const inWindow = chores.filter((c) => {
    const created = new Date(c.created_at);
    return created >= ws && created <= addDays(we, 1);
  });

  const completed = inWindow.filter((c) => c.status === 'completed').length;
  const inProgress = inWindow.filter((c) => c.status === 'in_progress').length;
  const pending = inWindow.filter(
    (c) => c.status !== 'completed' && c.status !== 'in_progress',
  ).length;
  const total = inWindow.length;

  return {
    weekStartDate: dateOnly(ws),
    weekEndDate: dateOnly(we),
    total,
    completed,
    inProgress,
    pending,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

/** Returns per user completion totals for a dorm. */
export async function getUserCompletionHistory(
  dormId: string,
): Promise<UserCompletionHistoryItem[]> {
  const chores = await getChores(dormId);
  const byUser: Record<string, UserCompletionHistoryItem> = {};

  chores.forEach((c) => {
    const userId = c.meta?.assignedTo;
    if (!userId) return;
    if (!byUser[userId]) {
      byUser[userId] = {
        userId,
        completedCount: 0,
        inProgressCount: 0,
        pendingCount: 0,
      };
    }

    if (c.status === 'completed') byUser[userId].completedCount += 1;
    else if (c.status === 'in_progress') byUser[userId].inProgressCount += 1;
    else byUser[userId].pendingCount += 1;
  });

  const rows = Object.values(byUser).sort((a, b) => b.completedCount - a.completedCount);
  if (rows.length === 0) return rows;

  const userIds = rows.map((r) => r.userId);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const nameById: Record<string, string> = {};
  (profiles || []).forEach((p: any) => {
    nameById[p.id] = p.display_name;
  });

  return rows.map((r) => ({
    ...r,
    displayName: nameById[r.userId] || undefined,
  }));
}
