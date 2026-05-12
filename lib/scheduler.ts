import { logAuditEvent } from './audit';
import { createChore } from './chores';
import { getChoreTemplates } from './choreTemplates';
import { getDormMembers } from './dorms';
import { formatErrorMessage } from './errors';
import { createInAppNotification } from './notifications';
import { supabase } from './supabase';

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns the Monday start of week as a date string. */
export function getWeekStartDate(date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return toDateOnly(d);
}

function scoreHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

async function getActiveOptOutSet(dormId: string, category: string | null): Promise<Set<string>> {
  const query = supabase.from('chore_opt_outs').select('user_id, category').eq('dorm_id', dormId);

  const { data, error } = await query;
  if (error) {
    const code = String(error.code || '');
    if (code === '42P01' || code === 'PGRST205') {
      return new Set();
    }
    throw new Error(formatErrorMessage(error.message));
  }

  return new Set(
    (data || [])
      // Only opt out if they opted out of ALL (!row.category) OR the specific category matches.
      .filter((row: any) => !row.category || row.category === category)
      .map((row: any) => row.user_id),
  );
}

async function getHistoricalCompletionCount(dormId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('chore_assignments')
    .select('assigned_to, assignment_status')
    .eq('dorm_id', dormId)
    .eq('assignment_status', 'completed');

  if (error) {
    const code = String(error.code || '');
    if (code === '42P01' || code === 'PGRST205') {
      return {};
    }
    throw new Error(formatErrorMessage(error.message));
  }

  const counts: Record<string, number> = {};
  (data || []).forEach((row: any) => {
    if (!row.assigned_to) return;
    counts[row.assigned_to] = (counts[row.assigned_to] || 0) + 1;
  });
  return counts;
}

async function notifyWeeklyAssignment(userId: string, choreTitle: string): Promise<void> {
  try {
    await createInAppNotification(
      userId,
      'weekly_schedule_generated',
      'Weekly chores assigned',
      `You have a new weekly chore: "${choreTitle}".`,
      'chore',
    );
  } catch (error) {
    console.warn('Weekly assignment notification failed', error);
  }
}

/** Generates weekly chores from templates with fair assignment. */
export async function generateWeeklyAssignments(
  dormId: string,
  actorId: string,
  weekStartDate?: string,
): Promise<{ runId: string; createdCount: number }> {
  if (!dormId) throw new Error('Dorm ID is required');
  if (!actorId) throw new Error('Actor ID is required');

  const weekStart = weekStartDate || getWeekStartDate(new Date());
  const deterministicSeed = `${dormId}:${weekStart}`;

  const { data: existingRun, error: runLookupError } = await supabase
    .from('chore_schedule_runs')
    .select('id')
    .eq('dorm_id', dormId)
    .eq('week_start_date', weekStart)
    .maybeSingle();

  if (runLookupError && runLookupError.code !== 'PGRST116') {
    throw new Error(formatErrorMessage(runLookupError.message));
  }

  let runId: string;
  const assignedTemplateIds = new Set<string>();

  // Fetch existing assignments if the run already exists to prevent duplication
  if (existingRun?.id) {
    runId = existingRun.id;

    const { data: existingAssignments } = await supabase
      .from('chore_assignments')
      .select('template_id')
      .eq('schedule_run_id', runId);

    if (existingAssignments) {
      existingAssignments.forEach((a: any) => assignedTemplateIds.add(a.template_id));
    }
  } else {
    const { data: insertedRun, error: insertRunError } = await supabase
      .from('chore_schedule_runs')
      .insert({
        dorm_id: dormId,
        week_start_date: weekStart,
        deterministic_seed: deterministicSeed,
        generated_by: actorId,
      })
      .select('id')
      .single();

    if (insertRunError) throw new Error(formatErrorMessage(insertRunError.message));
    runId = insertedRun.id;
  }

  const templates = await getChoreTemplates(dormId, false);
  if (templates.length === 0) {
    return { runId, createdCount: 0 };
  }

  const members = await getDormMembers(dormId);
  const memberIds = members.map((m) => m.user_id);
  if (memberIds.length === 0) {
    return { runId, createdCount: 0 };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, availability_status')
    .in('id', memberIds);

  if (profilesError) throw new Error(formatErrorMessage(profilesError.message));

  const unavailable = new Set(
    (profiles || [])
      .filter((p: any) => String(p.availability_status) === 'unavailable')
      .map((p: any) => p.id),
  );

  const completionCounts = await getHistoricalCompletionCount(dormId);

  let createdCount = 0;
  for (const template of templates) {
    // Skip if this template was already assigned in this week's run
    if (assignedTemplateIds.has(template.id)) {
      continue;
    }

    const optOutSet = await getActiveOptOutSet(dormId, template.category || null);
    const eligible = memberIds.filter((id) => !unavailable.has(id) && !optOutSet.has(id));
    if (eligible.length === 0) continue;

    const ranked = [...eligible].sort((a, b) => {
      const countDiff = (completionCounts[a] || 0) - (completionCounts[b] || 0);
      if (countDiff !== 0) return countDiff;
      const hashA = scoreHash(`${deterministicSeed}:${template.id}:${a}`);
      const hashB = scoreHash(`${deterministicSeed}:${template.id}:${b}`);
      return hashA - hashB;
    });

    const assignedTo = ranked[0];

    // Removed the hardcoded isRecurring and frequency fields that forced repetition
    const chore = await createChore(dormId, {
      title: template.title,
      description: template.description || undefined,
      status: 'pending',
      meta: {
        category: template.category,
        due_in_days: template.default_due_in_days,
        assignedTo,
      },
    });

    await supabase.from('chore_assignments').insert({
      schedule_run_id: runId,
      dorm_id: dormId,
      chore_id: chore.id,
      template_id: template.id,
      assigned_to: assignedTo,
      assignment_status: 'pending',
    });

    completionCounts[assignedTo] = (completionCounts[assignedTo] || 0) + 1;
    createdCount += 1;
    await notifyWeeklyAssignment(assignedTo, template.title);
  }

  // Only log if we actually created something new
  if (createdCount > 0) {
    await logAuditEvent({
      actorId,
      dormId,
      entityType: 'weekly_schedule',
      entityId: runId,
      action: 'generate',
      payload: { weekStart, createdCount, deterministicSeed },
    });
  }

  return { runId, createdCount };
}
