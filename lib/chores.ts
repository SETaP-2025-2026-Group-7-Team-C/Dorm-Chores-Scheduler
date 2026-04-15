import { getDormMembers } from './dorms';
import { formatErrorMessage } from './errors';
import { createInAppNotification } from './inAppNotifications';
import { supabase } from './supabase';

const MAX_CHORES_PER_USER = 100;
const MAX_CHORES_PER_DORM = 500;

export interface ChoreMeta {
  due_in_days?: number;
  assignedTo?: string | null;
  category?: string | null;
  isRecurring?: boolean | null;
  frequency?: string | null;
  rotation?: string[];
  rotIdx?: number;
}

export interface ChoreData {
  title: string;
  description?: string;
  status?: string;
  due_in_days?: number;
  meta?: ChoreMeta;
}

export interface Chore extends ChoreData {
  id: string;
  dorm_id: string;
  created_at: string;
  assignedName?: string;
}

function normalizeUnassignedStatus(chore: Chore): Chore {
  if (!chore.meta?.assignedTo && chore.status !== 'completed') {
    return {
      ...chore,
      status: 'unassigned',
    };
  }
  return chore;
}

function shuffleIds(ids: string[]): string[] {
  return [...ids].sort(() => Math.random() - 0.5);
}

async function ensureDormChoreCapacity(dormId: string): Promise<void> {
  const { count, error } = await supabase
    .from('chores')
    .select('id', { count: 'exact', head: true })
    .eq('dorm_id', dormId);

  if (error) throw new Error(formatErrorMessage(error.message));
  if ((count || 0) >= MAX_CHORES_PER_DORM) {
    throw new Error(`Dorm chore limit reached (${MAX_CHORES_PER_DORM}).`);
  }
}

async function getEligibleAssignees(dormId: string, memberIds: string[]): Promise<string[]> {
  if (memberIds.length === 0) return [];

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, availability_status')
    .in('id', memberIds);

  if (profileError) throw new Error(formatErrorMessage(profileError.message));

  const unavailableSet = new Set(
    (profiles || [])
      .filter((p: any) => p.availability_status === 'unavailable')
      .map((p: any) => p.id),
  );

  const { data: dormChores, error: choreError } = await supabase
    .from('chores')
    .select('id, dorm_id, created_at, status, description, title')
    .eq('dorm_id', dormId);

  if (choreError) throw new Error(formatErrorMessage(choreError.message));

  const activeCountByUser: Record<string, number> = {};
  (dormChores || [])
    .map(parseChore)
    .filter((c) => c.status !== 'completed' && !!c.meta?.assignedTo)
    .forEach((c) => {
      const assignedId = c.meta?.assignedTo as string;
      activeCountByUser[assignedId] = (activeCountByUser[assignedId] || 0) + 1;
    });

  return memberIds.filter(
    (memberId) =>
      !unavailableSet.has(memberId) && (activeCountByUser[memberId] || 0) < MAX_CHORES_PER_USER,
  );
}

async function autoAssignUnassignedChores(dormId: string, chores: Chore[]): Promise<Chore[]> {
  const unassignedChores = chores.filter((c) => !c.meta?.assignedTo && c.status !== 'completed');
  if (unassignedChores.length === 0) return chores;

  const members = await getDormMembers(dormId);
  const memberIds = (members || []).map((m) => m.user_id);
  const eligibleIds = await getEligibleAssignees(dormId, memberIds);
  if (eligibleIds.length === 0) return chores.map(normalizeUnassignedStatus);

  const activeCountByUser: Record<string, number> = {};
  chores
    .filter((c) => c.status !== 'completed' && !!c.meta?.assignedTo)
    .forEach((c) => {
      const assignedId = c.meta?.assignedTo as string;
      activeCountByUser[assignedId] = (activeCountByUser[assignedId] || 0) + 1;
    });

  const result: Chore[] = [...chores];
  for (const chore of unassignedChores) {
    const nextAssignee = eligibleIds.find(
      (id) => (activeCountByUser[id] || 0) < MAX_CHORES_PER_USER,
    );
    if (!nextAssignee) {
      break;
    }

    const updatedMeta = {
      ...chore.meta,
      assignedTo: nextAssignee,
      rotation: [nextAssignee, ...shuffleIds(eligibleIds.filter((id) => id !== nextAssignee))],
      rotIdx: 0,
    };

    const { data: updated, error } = await supabase
      .from('chores')
      .update(
        packChoreData({
          ...chore,
          status: 'assigned',
          meta: updatedMeta,
        }),
      )
      .eq('id', chore.id)
      .select()
      .single();

    if (error) {
      throw new Error(formatErrorMessage(error.message));
    }

    const updatedParsed = parseChore(updated);
    const idx = result.findIndex((c) => c.id === chore.id);
    if (idx !== -1) result[idx] = updatedParsed;
    activeCountByUser[nextAssignee] = (activeCountByUser[nextAssignee] || 0) + 1;
  }

  return result.map(normalizeUnassignedStatus);
}

export function packChoreData(data: ChoreData): any {
  const payload: any = {
    title: data.title,
    status: data.status,
  };
  if (data.meta) {
    const metaStr = JSON.stringify(data.meta);
    payload.description = `${data.description || ''}___META=${metaStr}`;
  } else {
    payload.description = data.description || null;
  }
  return payload;
}

export function parseChore(data: any): Chore {
  const chore: Chore = { ...data };
  if (chore.description && chore.description.includes('___META=')) {
    const parts = chore.description.split('___META=');
    chore.description = parts[0];
    try {
      chore.meta = JSON.parse(parts[1]);
    } catch (e) {
      chore.meta = {};
    }
  } else {
    chore.meta = {};
  }
  return chore;
}

export async function getChores(dormId: string): Promise<Chore[]> {
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .eq('dorm_id', dormId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatErrorMessage(error.message));
  const parsedChores = (data as any[]).map(parseChore);
  const chores = await autoAssignUnassignedChores(dormId, parsedChores);

  const assigneeIds = [
    ...new Set(chores.map((c) => c.meta?.assignedTo).filter(Boolean)),
  ] as string[];
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', assigneeIds);

    if (profiles) {
      const profileMap = profiles.reduce(
        (acc, p) => {
          acc[p.id] = p.display_name;
          return acc;
        },
        {} as Record<string, string>,
      );

      chores.forEach((c) => {
        if (c.meta?.assignedTo) {
          c.assignedName = profileMap[c.meta.assignedTo] || 'Unknown User';
        }
      });
    }
  }

  return chores;
}

export async function getChoreById(choreId: string): Promise<Chore | null> {
  if (!choreId) throw new Error('Chore ID is required');

  const { data, error } = await supabase.from('chores').select('*').eq('id', choreId).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(formatErrorMessage(error.message));
  }
  return normalizeUnassignedStatus(parseChore(data));
}

export async function createChore(dormId: string, choreData: ChoreData): Promise<Chore> {
  if (!dormId) throw new Error('Dorm ID is required');
  if (!choreData.title || choreData.title.trim() === '') {
    throw new Error('Chore title is required');
  }

  await ensureDormChoreCapacity(dormId);

  const members = await getDormMembers(dormId);
  const memberIds = (members || []).map((m) => m.user_id);
  const eligibleIds = await getEligibleAssignees(dormId, memberIds);

  const requestedAssignee = choreData.meta?.assignedTo;
  const canUseRequestedAssignee = !!requestedAssignee && eligibleIds.includes(requestedAssignee);

  if (canUseRequestedAssignee) {
    const remaining = eligibleIds.filter((id) => id !== requestedAssignee);
    choreData.meta = {
      ...choreData.meta,
      assignedTo: requestedAssignee,
      rotation: [requestedAssignee, ...shuffleIds(remaining)],
      rotIdx: 0,
    };
  } else if (eligibleIds.length > 0) {
    const rotation = shuffleIds(eligibleIds);
    choreData.meta = {
      ...choreData.meta,
      assignedTo: rotation[0],
      rotation,
      rotIdx: 0,
    };
  } else {
    choreData.meta = {
      ...choreData.meta,
      assignedTo: null,
      rotation: [],
      rotIdx: 0,
    };
  }

  choreData.status = choreData.meta?.assignedTo ? choreData.status || 'assigned' : 'unassigned';

  const { data, error } = await supabase
    .from('chores')
    .insert([
      {
        dorm_id: dormId,
        ...packChoreData(choreData),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(formatErrorMessage(error.message));
  return normalizeUnassignedStatus(parseChore(data));
}

export async function updateChore(
  choreId: string,
  updatedData: Partial<ChoreData>,
): Promise<Chore> {
  if (!choreId) throw new Error('Chore ID is required');
  if (updatedData.title !== undefined && updatedData.title.trim() === '') {
    throw new Error('Chore title cannot be empty');
  }

  const baseChore = await getChoreById(choreId);
  if (!baseChore) throw new Error('Chore not found');

  const mergedMeta = { ...baseChore.meta, ...updatedData.meta };

  const { data, error } = await supabase
    .from('chores')
    .update(
      packChoreData({
        ...baseChore,
        ...updatedData,
        meta: mergedMeta,
      }),
    )
    .eq('id', choreId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error('Chore not found');
    throw new Error(formatErrorMessage(error.message));
  }
  return normalizeUnassignedStatus(parseChore(data));
}

export async function deleteChore(choreId: string): Promise<void> {
  if (!choreId) throw new Error('Chore ID is required');

  const { error } = await supabase.from('chores').delete().eq('id', choreId);

  if (error) throw new Error(formatErrorMessage(error.message));
}

export async function markChoreComplete(choreId: string): Promise<Chore> {
  if (!choreId) throw new Error('Chore ID is required');

  const chore = await getChoreById(choreId);
  if (!chore) throw new Error('Chore not found');
  if (chore.status === 'completed') throw new Error('Chore is already completed');

  const completedChore = await updateChore(choreId, { status: 'completed' });

  if (chore.meta?.assignedTo) {
    await createInAppNotification(
      chore.meta.assignedTo,
      'chore_completed',
      'Chore completed',
      `"${chore.title}" was marked as completed.`,
      'chore',
    );
  }

  if (chore.meta?.isRecurring) {
    const { assignedTo, rotation, rotIdx, ...baseMeta } = chore.meta;
    await createChore(chore.dorm_id, {
      title: chore.title,
      description: chore.description,
      status: 'assigned',
      meta: {
        ...baseMeta,
      },
    });
  }

  return completedChore;
}
