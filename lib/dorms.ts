import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from './auth';
import { formatErrorMessage } from './errors';
import { supabase } from './supabase';

const MAX_DORMS_CREATED_PER_USER = 3;
const MAX_DORM_MEMBERSHIPS_PER_USER = 5;
const MANAGER_QR_PREFIX = 'dcs://manager-link';
const MANAGER_MANUAL_PREFIX = 'DCSM';

function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = error.code || '';
  const message = String(error.message || '').toLowerCase();

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('could not find the table') ||
    message.includes('schema cache')
  );
}

function isPermissionDeniedError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '').toUpperCase();
  const message = String(error.message || '').toLowerCase();

  return (
    code === '42501' ||
    code === 'PGRST301' ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  );
}

async function deleteByDormId(table: string, dormId: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('dorm_id', dormId);
  if (error && !isMissingTableError(error)) {
    throw new Error(formatErrorMessage(error.message));
  }
}

async function tryDeleteDormRow(dormId: string) {
  return await supabase.from('dorms').delete().eq('id', dormId).select('id').maybeSingle();
}

export interface DormData {
  name: string;
  join_code?: string;
}

export interface Dorm {
  id: string;
  name: string;
  join_code: string;
  created_by: string;
  created_at: string;
}

export interface DormMember {
  user_id: string;
  dorm_id: string;
  joined_at: string;
}

export interface DormStats {
  choreCompletionRate: number;
  openRepairs: number;
  memberCount: number;
  totalChores: number;
  completedChores: number;
}

export interface ManagerOverview {
  dormCount: number;
  choreCompletionRate: number;
  openRepairs: number;
  memberCount: number;
}

export interface ManagerDormLinkPayload {
  dormId: string;
  joinCode: string;
}

function calculateManagerCodeChecksum(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36).toUpperCase().padStart(4, '0').slice(-4);
}

function toUuidFromCompact(compact: string): string {
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20, 32)}`.toLowerCase();
}

export function parseManagerDormLinkPayload(rawPayload: string): ManagerDormLinkPayload {
  if (!rawPayload?.trim()) {
    throw new Error('QR code is empty');
  }

  if (!rawPayload.startsWith(MANAGER_QR_PREFIX)) {
    throw new Error('Invalid QR code for dorm-manager linking');
  }

  const url = new URL(rawPayload);
  const dormId = (url.searchParams.get('dormId') || '').trim();
  const joinCode = (url.searchParams.get('joinCode') || '').trim().toUpperCase();

  if (!dormId || !joinCode) {
    throw new Error('QR code is missing required dorm details');
  }

  return { dormId, joinCode };
}

export async function createManagerDormLinkPayload(dormId: string): Promise<string> {
  if (!dormId) {
    throw new Error('Dorm ID is required');
  }

  const dorm = await getDormById(dormId);
  if (!dorm) {
    throw new Error('Dorm not found');
  }

  const query = new URLSearchParams({
    dormId: dorm.id,
    joinCode: dorm.join_code,
  });

  return `${MANAGER_QR_PREFIX}?${query.toString()}`;
}

export async function createManagerDormManualCode(dormId: string): Promise<string> {
  if (!dormId) {
    throw new Error('Dorm ID is required');
  }

  const dorm = await getDormById(dormId);
  if (!dorm) {
    throw new Error('Dorm not found');
  }

  const compactDormId = dorm.id.replace(/-/g, '').toUpperCase();
  const normalizedJoinCode = dorm.join_code.trim().toUpperCase();
  const checksum = calculateManagerCodeChecksum(`${normalizedJoinCode}${compactDormId}`);

  return [
    MANAGER_MANUAL_PREFIX,
    normalizedJoinCode,
    compactDormId.slice(0, 8),
    compactDormId.slice(8, 16),
    compactDormId.slice(16, 24),
    compactDormId.slice(24, 32),
    checksum,
  ].join('-');
}

export function parseManagerDormManualCode(manualCode: string): ManagerDormLinkPayload {
  const raw = manualCode.trim().toUpperCase();
  const parts = raw.split('-');

  if (parts.length !== 7 || parts[0] !== MANAGER_MANUAL_PREFIX) {
    throw new Error('Invalid manager connect code format');
  }

  const [, joinCode, id1, id2, id3, id4, checksum] = parts;
  const compactDormId = `${id1}${id2}${id3}${id4}`;

  if (!/^[A-Z0-9]{6}$/.test(joinCode)) {
    throw new Error('Invalid manager connect code join segment');
  }

  if (!/^[0-9A-F]{32}$/.test(compactDormId)) {
    throw new Error('Invalid manager connect code dorm segment');
  }

  const expectedChecksum = calculateManagerCodeChecksum(`${joinCode}${compactDormId}`);
  if (checksum !== expectedChecksum) {
    throw new Error('Manager connect code checksum is invalid');
  }

  return {
    joinCode,
    dormId: toUuidFromCompact(compactDormId),
  };
}

export async function linkDormToManagerByQr(
  managerUserId: string,
  qrPayload: string,
): Promise<Dorm> {
  if (!managerUserId) {
    throw new Error('Manager user ID is required');
  }

  const parsed = parseManagerDormLinkPayload(qrPayload);

  const { data: managerProfile, error: managerProfileError } = await supabase
    .from('profiles')
    .select('is_manager')
    .eq('id', managerUserId)
    .single();

  if (managerProfileError) {
    throw new Error(formatErrorMessage(managerProfileError.message));
  }

  if (!managerProfile?.is_manager) {
    throw new Error('Only managers can link dorms by QR code');
  }

  const { data: dorm, error: dormError } = await supabase
    .from('dorms')
    .select('id, join_code')
    .eq('id', parsed.dormId)
    .single();

  if (dormError || !dorm) {
    throw new Error('Dorm not found for this QR code');
  }

  if (String(dorm.join_code).toUpperCase() !== parsed.joinCode) {
    throw new Error('QR code does not match dorm details');
  }

  const { data: updatedDorm, error: updateError } = await supabase
    .from('dorms')
    .update({ created_by: managerUserId })
    .eq('id', parsed.dormId)
    .select('*')
    .maybeSingle();

  if (updateError) {
    throw new Error(formatErrorMessage(updateError.message));
  }

  if (!updatedDorm) {
    throw new Error('Unable to link this dorm right now. Please try again.');
  }

  return updatedDorm as Dorm;
}

export async function linkDormToManagerByJoinCode(
  managerUserId: string,
  joinCode: string,
): Promise<Dorm> {
  if (!managerUserId) {
    throw new Error('Manager user ID is required');
  }

  const normalizedJoinCode = joinCode.trim().toUpperCase();
  if (!normalizedJoinCode) {
    throw new Error('Join code is required');
  }

  const { data: managerProfile, error: managerProfileError } = await supabase
    .from('profiles')
    .select('is_manager')
    .eq('id', managerUserId)
    .single();

  if (managerProfileError) {
    throw new Error(formatErrorMessage(managerProfileError.message));
  }

  if (!managerProfile?.is_manager) {
    throw new Error('Only managers can link dorms by join code');
  }

  const { data: dormMatches, error: dormError } = await supabase
    .from('dorms')
    .select('id')
    .eq('join_code', normalizedJoinCode)
    .limit(2);

  if (dormError) {
    throw new Error(formatErrorMessage(dormError.message));
  }

  if (!dormMatches || dormMatches.length === 0) {
    throw new Error('Invalid join code or dorm not found');
  }

  if (dormMatches.length > 1) {
    throw new Error('This join code matches multiple dorms. Please use the manager connect code.');
  }

  const dorm = dormMatches[0];

  const { data: updatedDorm, error: updateError } = await supabase
    .from('dorms')
    .update({ created_by: managerUserId })
    .eq('id', dorm.id)
    .select('*')
    .maybeSingle();

  if (updateError) {
    throw new Error(formatErrorMessage(updateError.message));
  }

  if (!updatedDorm) {
    throw new Error('Unable to link this dorm right now. Please try again.');
  }

  return updatedDorm as Dorm;
}

export async function linkDormToManagerByManualCode(
  managerUserId: string,
  manualCode: string,
): Promise<Dorm> {
  if (!managerUserId) {
    throw new Error('Manager user ID is required');
  }

  const parsed = parseManagerDormManualCode(manualCode);

  const { data: managerProfile, error: managerProfileError } = await supabase
    .from('profiles')
    .select('is_manager')
    .eq('id', managerUserId)
    .single();

  if (managerProfileError) {
    throw new Error(formatErrorMessage(managerProfileError.message));
  }

  if (!managerProfile?.is_manager) {
    throw new Error('Only managers can link dorms by manager connect code');
  }

  const { data: dorm, error: dormError } = await supabase
    .from('dorms')
    .select('id, join_code')
    .eq('id', parsed.dormId)
    .single();

  if (dormError || !dorm) {
    throw new Error('Dorm not found for this manager connect code');
  }

  if (String(dorm.join_code).toUpperCase() !== parsed.joinCode) {
    throw new Error('Manager connect code does not match dorm details');
  }

  const { data: updatedDorm, error: updateError } = await supabase
    .from('dorms')
    .update({ created_by: managerUserId })
    .eq('id', parsed.dormId)
    .select('*')
    .maybeSingle();

  if (updateError) {
    throw new Error(formatErrorMessage(updateError.message));
  }

  if (!updatedDorm) {
    throw new Error('Unable to link this dorm right now. Please try again.');
  }

  return updatedDorm as Dorm;
}

export async function getDormById(dormId: string): Promise<Dorm | null> {
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase.from('dorms').select('*').eq('id', dormId).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(formatErrorMessage(error.message));
  }
  return data as Dorm;
}

export async function getDormsByManager(userId: string): Promise<Dorm[]> {
  if (!userId) throw new Error('User ID is required');

  const { data, error } = await supabase
    .from('dorms')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatErrorMessage(error.message));
  return data as Dorm[];
}

export async function getDormMembers(dormId: string): Promise<DormMember[]> {
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase
    .from('dorm_members')
    .select('*')
    .eq('dorm_id', dormId)
    .order('joined_at', { ascending: false });

  if (error) throw new Error(formatErrorMessage(error.message));
  return data as DormMember[];
}

export async function generateInviteCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createDorm(dormData: DormData, userId: string): Promise<Dorm> {
  if (!dormData.name || dormData.name.trim() === '') {
    throw new Error('Dorm name is required');
  }
  if (!userId) throw new Error('User ID is required');

  const { count: createdCount, error: createdCountError } = await supabase
    .from('dorms')
    .select('id', { count: 'exact', head: true })
    .eq('created_by', userId);

  if (createdCountError) throw new Error(formatErrorMessage(createdCountError.message));
  if ((createdCount || 0) >= MAX_DORMS_CREATED_PER_USER) {
    throw new Error(
      `You can only create up to ${MAX_DORMS_CREATED_PER_USER} dorms. Delete one you created to make room.`,
    );
  }

  const { count: membershipCount, error: membershipCountError } = await supabase
    .from('dorm_members')
    .select('dorm_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (membershipCountError) throw new Error(formatErrorMessage(membershipCountError.message));
  if ((membershipCount || 0) >= MAX_DORM_MEMBERSHIPS_PER_USER) {
    throw new Error(`You can only be part of up to ${MAX_DORM_MEMBERSHIPS_PER_USER} dorms.`);
  }

  const joinCode = await generateInviteCode();

  const { data, error } = await supabase
    .from('dorms')
    .insert([
      {
        name: dormData.name.trim(),
        join_code: joinCode,
        created_by: userId,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(formatErrorMessage(error.message));
  return data as Dorm;
}

export async function updateDorm(dormId: string, updatedData: Partial<DormData>): Promise<Dorm> {
  if (!dormId) throw new Error('Dorm ID is required');
  if (updatedData.name !== undefined && updatedData.name.trim() === '') {
    throw new Error('Dorm name cannot be empty');
  }

  const { data, error } = await supabase
    .from('dorms')
    .update(updatedData)
    .eq('id', dormId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Dorm not found');
    throw new Error(formatErrorMessage(error.message));
  }
  return data as Dorm;
}

export async function deleteDorm(dormId: string): Promise<void> {
  if (!dormId) throw new Error('Dorm ID is required');

  const user = await getCurrentUser();
  if (!user) throw new Error('User not authenticated');

  const { data: dorm, error: fetchError } = await supabase
    .from('dorms')
    .select('created_by')
    .eq('id', dormId)
    .single();

  if (fetchError) throw new Error(formatErrorMessage(fetchError.message));
  if (!dorm) throw new Error('Dorm not found');

  if (dorm.created_by !== user.id) {
    throw new Error('Only the creator of the dorm can delete it.');
  }

  const firstAttempt = await tryDeleteDormRow(dormId);
  if (!firstAttempt.error && firstAttempt.data) {
    return;
  }

  if (firstAttempt.error && firstAttempt.error.code === '23503') {
    await deleteByDormId('chores', dormId);
    await deleteByDormId('repair_requests', dormId);
    await deleteByDormId('repairs', dormId);
    await deleteByDormId('dorm_members', dormId);

    const retryAttempt = await tryDeleteDormRow(dormId);
    if (retryAttempt.error) throw new Error(formatErrorMessage(retryAttempt.error.message));
    if (!retryAttempt.data) {
      throw new Error('Dorm was not deleted. You may not have permission to delete this dorm.');
    }
    return;
  }

  if (firstAttempt.error) {
    throw new Error(formatErrorMessage(firstAttempt.error.message));
  }

  if (!firstAttempt.data) {
    throw new Error('Dorm was not deleted. You may not have permission to delete this dorm.');
  }
}

export async function joinDorm(userId: string, joinCode: string): Promise<DormMember> {
  if (!userId) throw new Error('User ID is required');
  if (!joinCode) throw new Error('Join code is required');

  const { count: membershipCount, error: membershipCountError } = await supabase
    .from('dorm_members')
    .select('dorm_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (membershipCountError) throw new Error(formatErrorMessage(membershipCountError.message));
  if ((membershipCount || 0) >= MAX_DORM_MEMBERSHIPS_PER_USER) {
    throw new Error(`You can only be part of up to ${MAX_DORM_MEMBERSHIPS_PER_USER} dorms.`);
  }

  const { data: dorm, error: dormError } = await supabase
    .from('dorms')
    .select('*')
    .eq('join_code', joinCode.trim().toUpperCase())
    .single();

  if (dormError || !dorm) {
    throw new Error('Invalid join code or dorm not found');
  }

  const { data, error } = await supabase
    .from('dorm_members')
    .insert([
      {
        user_id: userId,
        dorm_id: dorm.id,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('User is already in a dorm');
    }
    throw new Error(formatErrorMessage(error.message));
  }

  return data as DormMember;
}

export async function leaveDorm(userId: string, dormId: string): Promise<void> {
  if (!userId) throw new Error('User ID is required');
  if (!dormId) throw new Error('Dorm ID is required');

  const { error } = await supabase
    .from('dorm_members')
    .delete()
    .match({ user_id: userId, dorm_id: dormId });

  if (error) throw new Error(formatErrorMessage(error.message));
}

export async function leaveDormAsManager(managerUserId: string, dormId: string): Promise<void> {
  if (!managerUserId) throw new Error('Manager user ID is required');
  if (!dormId) throw new Error('Dorm ID is required');

  const { data: managerProfile, error: managerProfileError } = await supabase
    .from('profiles')
    .select('is_manager')
    .eq('id', managerUserId)
    .single();

  if (managerProfileError) {
    throw new Error(formatErrorMessage(managerProfileError.message));
  }

  if (!managerProfile?.is_manager) {
    throw new Error('Only managers can leave managed dorms');
  }

  const { data: dorm, error: dormError } = await supabase
    .from('dorms')
    .select('created_by')
    .eq('id', dormId)
    .single();

  if (dormError) {
    if (dormError.code === 'PGRST116') {
      throw new Error('Dorm not found');
    }
    throw new Error(formatErrorMessage(dormError.message));
  }

  if (dorm.created_by !== managerUserId) {
    throw new Error('You are no longer assigned as the manager for this dorm.');
  }

  const { data: members, error: membersError } = await supabase
    .from('dorm_members')
    .select('user_id')
    .eq('dorm_id', dormId)
    .neq('user_id', managerUserId)
    .order('joined_at', { ascending: true })
    .limit(1);

  if (membersError) {
    throw new Error(formatErrorMessage(membersError.message));
  }

  const newOwnerId = members?.[0]?.user_id;
  if (!newOwnerId) {
    throw new Error(
      'This dorm has no other members to transfer to. Ask a resident to join first, then try leaving again.',
    );
  }

  const { data: updatedDorm, error: updateError } = await supabase
    .from('dorms')
    .update({ created_by: newOwnerId })
    .eq('id', dormId)
    .eq('created_by', managerUserId)
    .select('id')
    .maybeSingle();

  if (updateError) {
    if (isPermissionDeniedError(updateError)) {
      throw new Error('You do not have permission to leave this dorm.');
    }
    throw new Error(formatErrorMessage(updateError.message));
  }

  if (!updatedDorm) {
    throw new Error('Unable to leave this dorm right now. Please try again.');
  }
}

export async function inviteUserToDorm(userId: string, dormId: string): Promise<DormMember> {
  if (!userId) throw new Error('User ID is required');
  if (!dormId) throw new Error('Dorm ID is required');

  const { count: membershipCount, error: membershipCountError } = await supabase
    .from('dorm_members')
    .select('dorm_id', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (membershipCountError) throw new Error(formatErrorMessage(membershipCountError.message));
  if ((membershipCount || 0) >= MAX_DORM_MEMBERSHIPS_PER_USER) {
    throw new Error(`You can only be part of up to ${MAX_DORM_MEMBERSHIPS_PER_USER} dorms.`);
  }

  const { data, error } = await supabase
    .from('dorm_members')
    .insert([
      {
        user_id: userId,
        dorm_id: dormId,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('User is already in a dorm');
    }
    throw new Error(formatErrorMessage(error.message));
  }

  return data as DormMember;
}

export async function getActiveDormId(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user?.id) return null;

  try {
    const activeDormId = await AsyncStorage.getItem(`active_dorm_id_${user.id}`);
    if (activeDormId) {
      const { data, error } = await supabase
        .from('dorm_members')
        .select('dorm_id')
        .eq('user_id', user.id)
        .eq('dorm_id', activeDormId)
        .single();

      if (!error && data) {
        return activeDormId;
      }
    }
  } catch (err) {
    console.warn('Failed to read active dorm from storage', err);
  }

  const { data: members, error } = await supabase
    .from('dorm_members')
    .select('dorm_id')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1);

  if (error || !members || members.length === 0) return null;
  return members[0].dorm_id;
}

export async function setActiveDormId(dormId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.id) return;
  await AsyncStorage.setItem(`active_dorm_id_${user.id}`, dormId);
}

export async function getDormStats(dormId: string): Promise<DormStats> {
  if (!dormId) throw new Error('Dorm ID is required');

  const [totalChoresResult, completedChoresResult, openRepairsResult, memberCountResult] =
    await Promise.all([
      supabase
        .from('chores')
        .select('id', { count: 'exact', head: true })
        .match({ dorm_id: dormId }),
      supabase
        .from('chores')
        .select('id', { count: 'exact', head: true })
        .match({ dorm_id: dormId, status: 'completed' }),
      supabase
        .from('repair_requests')
        .select('id', { count: 'exact', head: true })
        .match({ dorm_id: dormId })
        .in('status', ['pending', 'in_progress']),
      supabase
        .from('dorm_members')
        .select('user_id', { count: 'exact', head: true })
        .match({ dorm_id: dormId }),
    ]);

  if (totalChoresResult.error) throw new Error(formatErrorMessage(totalChoresResult.error.message));
  if (completedChoresResult.error) {
    throw new Error(formatErrorMessage(completedChoresResult.error.message));
  }
  if (openRepairsResult.error) throw new Error(formatErrorMessage(openRepairsResult.error.message));
  if (memberCountResult.error) throw new Error(formatErrorMessage(memberCountResult.error.message));

  const totalChores = totalChoresResult.count || 0;
  const completedChores = completedChoresResult.count || 0;
  const openRepairs = openRepairsResult.count || 0;
  const memberCount = memberCountResult.count || 0;

  return {
    choreCompletionRate: totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0,
    openRepairs,
    memberCount,
    totalChores,
    completedChores,
  };
}

export async function getManagerOverview(managerId: string): Promise<ManagerOverview> {
  if (!managerId) throw new Error('Manager ID is required');

  const dorms = await getDormsByManager(managerId);
  if (dorms.length === 0) {
    return {
      dormCount: 0,
      choreCompletionRate: 0,
      openRepairs: 0,
      memberCount: 0,
    };
  }

  let totalOpenRepairs = 0;
  let totalMembers = 0;
  let totalChores = 0;
  let completedChores = 0;

  for (const dorm of dorms) {
    const stats = await getDormStats(dorm.id);
    totalOpenRepairs += stats.openRepairs;
    totalMembers += stats.memberCount;
    totalChores += stats.totalChores;
    completedChores += stats.completedChores;
  }

  return {
    dormCount: dorms.length,
    choreCompletionRate: totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0,
    openRepairs: totalOpenRepairs,
    memberCount: totalMembers,
  };
}
