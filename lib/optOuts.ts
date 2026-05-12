import { formatErrorMessage } from './errors';
import { supabase } from './supabase';

/** Opt out record for a user and optional category. */
export interface ChoreOptOut {
  id: string;
  user_id: string;
  dorm_id: string;
  user_name?: string | null;
  category: string | null;
  reason: string | null;
  created_at: string;
}

/** Returns opt outs for a user in a dorm. */
export async function getChoreOptOuts(userId: string, dormId: string): Promise<ChoreOptOut[]> {
  if (!userId) throw new Error('User ID is required');
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase
    .from('chore_opt_outs')
    .select('*')
    .eq('user_id', userId)
    .eq('dorm_id', dormId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatErrorMessage(error.message));
  return (data || []) as ChoreOptOut[];
}

/** Returns opt outs for all users in a dorm. */
export async function getDormChoreOptOuts(dormId: string): Promise<ChoreOptOut[]> {
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase
    .from('chore_opt_outs')
    .select('*')
    .eq('dorm_id', dormId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatErrorMessage(error.message));
  const rows = (data || []) as ChoreOptOut[];
  if (!rows.length) return rows;

  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  if (profilesError) throw new Error(formatErrorMessage(profilesError.message));

  const nameById: Record<string, string> = {};
  (profiles || []).forEach((p: any) => {
    nameById[p.id] = p.display_name || 'Dorm member';
  });

  return rows.map((r) => ({
    ...r,
    user_name: nameById[r.user_id] || 'Dorm member',
  }));
}

/** Creates a new opt out record. */
export async function createChoreOptOut(
  userId: string,
  dormId: string,
  input: {
    category?: string | null;
    reason?: string | null;
  },
): Promise<ChoreOptOut> {
  if (!userId) throw new Error('User ID is required');
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase
    .from('chore_opt_outs')
    .insert({
      user_id: userId,
      dorm_id: dormId,
      category: input.category || null,
      reason: input.reason || null,
    })
    .select()
    .single();

  if (error) throw new Error(formatErrorMessage(error.message));
  return data as ChoreOptOut;
}

/** Deletes an opt out record by id. */
export async function deleteChoreOptOut(optOutId: string): Promise<void> {
  if (!optOutId) throw new Error('Opt-out ID is required');
  const { error } = await supabase.from('chore_opt_outs').delete().eq('id', optOutId);
  if (error) throw new Error(formatErrorMessage(error.message));
}
