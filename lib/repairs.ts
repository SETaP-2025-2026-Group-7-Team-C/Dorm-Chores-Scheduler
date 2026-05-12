import { logAuditEvent } from './audit';
import { formatErrorMessage } from './errors';
import { createInAppNotification } from './notifications';
import { supabase } from './supabase';

/** Input for creating a repair request. */
export interface RepairRequestData {
  title: string;
  description: string;
  location: string;
  urgency?: 'low' | 'medium' | 'high';
}

/** Fields allowed when updating a repair request. */
export interface RepairRequestUpdateData extends Partial<RepairRequestData> {
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'resolved';
  resolution_notes?: string;
}

/** Workflow status used by the UI layer. */
export type RepairWorkflowStatus = 'pending' | 'in_progress' | 'resolved';

function toDbRepairStatus(status: string): string {
  return status === 'resolved' ? 'completed' : status;
}

async function notifySafely(
  userId: string,
  preferenceKey: Parameters<typeof createInAppNotification>[1],
  title: string,
  message: string,
  type: string,
): Promise<void> {
  try {
    await createInAppNotification(userId, preferenceKey, title, message, type);
  } catch (error) {
    // Notifications must never block core repair flows.
    console.warn('Notification delivery failed', error);
  }
}

/**
 * Create a repair request
 */
export async function createRepairRequest(
  dormId: string,
  userId: string,
  requestData: RepairRequestData,
) {
  if (!dormId || !userId) {
    throw new Error('Missing required fields');
  }

  if (!requestData.title?.trim()) {
    throw new Error('Repair title is required');
  }

  if (!requestData.description?.trim()) {
    throw new Error('Repair description is required');
  }

  if (!requestData.location?.trim()) {
    throw new Error('Repair location is required');
  }

  if (requestData.urgency && !['low', 'medium', 'high'].includes(requestData.urgency)) {
    throw new Error('Repair urgency must be low, medium, or high');
  }

  const { data, error } = await supabase
    .from('repair_requests')
    .insert([
      {
        dorm_id: dormId,
        submitted_by: userId,
        title: requestData.title.trim(),
        description: requestData.description.trim(),
        location: requestData.location.trim(),
        urgency: requestData.urgency ?? 'low',
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }

  // Notify manager that a new repair request was submitted.
  const { data: dorm, error: dormError } = await supabase
    .from('dorms')
    .select('created_by')
    .eq('id', dormId)
    .single();

  if (!dormError && dorm?.created_by && dorm.created_by !== userId) {
    await notifySafely(
      dorm.created_by,
      'new_repair_request',
      'New repair request',
      `A new repair request "${requestData.title.trim()}" was submitted.`,
      'repair',
    );
  }

  await logAuditEvent({
    actorId: userId,
    dormId,
    entityType: 'repair_request',
    entityId: data.id,
    action: 'create',
    payload: {
      title: data.title,
      urgency: data.urgency,
      status: data.status,
    },
  });

  return data;
}

/**
 * Update a repair request
 */
export async function updateRepairRequest(requestId: string, updatedData: RepairRequestUpdateData) {
  if (!requestId) {
    throw new Error('Request ID is required');
  }

  if (updatedData.title !== undefined && !updatedData.title.trim()) {
    throw new Error('Repair title cannot be empty');
  }

  if (updatedData.description !== undefined && !updatedData.description.trim()) {
    throw new Error('Repair description cannot be empty');
  }

  if (updatedData.location !== undefined && !updatedData.location.trim()) {
    throw new Error('Repair location cannot be empty');
  }

  if (
    updatedData.urgency !== undefined &&
    !['low', 'medium', 'high'].includes(updatedData.urgency)
  ) {
    throw new Error('Repair urgency must be low, medium, or high');
  }

  if (
    updatedData.status !== undefined &&
    !['pending', 'in_progress', 'completed', 'rejected', 'resolved'].includes(updatedData.status)
  ) {
    throw new Error('Repair status is invalid');
  }

  const payload: RepairRequestUpdateData = {
    ...updatedData,
    ...(updatedData.title !== undefined ? { title: updatedData.title.trim() } : {}),
    ...(updatedData.description !== undefined
      ? { description: updatedData.description.trim() }
      : {}),
    ...(updatedData.location !== undefined ? { location: updatedData.location.trim() } : {}),
    ...(updatedData.status !== undefined
      ? {
          status: toDbRepairStatus(updatedData.status) as RepairRequestUpdateData['status'],
        }
      : {}),
  };

  const { data, error } = await supabase
    .from('repair_requests')
    .update(payload)
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Repair request not found');
    }
    throw new Error(formatErrorMessage(error.message));
  }

  return data;
}

/**
 * Delete a repair request
 */
export async function deleteRepairRequest(requestId: string) {
  if (!requestId) {
    throw new Error('Request ID is required');
  }

  const { error: lookupError } = await supabase
    .from('repair_requests')
    .select('id')
    .eq('id', requestId)
    .single();

  if (lookupError) {
    if (lookupError.code === 'PGRST116') {
      throw new Error('Repair request not found');
    }
    throw new Error(formatErrorMessage(lookupError.message));
  }

  const { error } = await supabase.from('repair_requests').delete().eq('id', requestId);

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }
}

/** Returns all repair requests for a dorm. */
export async function getRepairRequests(dormId: string) {
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase
    .from('repair_requests')
    .select('*')
    .eq('dorm_id', dormId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatErrorMessage(error.message));

  return data;
}
/** Returns a repair request by id. */
export async function getRepairRequestById(requestId: string) {
  if (!requestId) throw new Error('Request ID is required');

  const { data, error } = await supabase
    .from('repair_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(formatErrorMessage(error.message));
  }

  return data;
}
/** Returns repair requests submitted by a user. */
export async function getRepairRequestsByReporter(userId: string) {
  if (!userId) throw new Error('User ID is required');

  const { data, error } = await supabase
    .from('repair_requests')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(formatErrorMessage(error.message));

  return data;
}

/** Updates workflow status and notifies the reporter. */
export async function updateRepairStatus(requestId: string, status: RepairWorkflowStatus) {
  if (!requestId) {
    throw new Error('Request ID is required');
  }

  if (!['pending', 'in_progress', 'resolved'].includes(status)) {
    throw new Error('Repair status is invalid');
  }

  const dbStatus = toDbRepairStatus(status);

  const { data, error } = await supabase
    .from('repair_requests')
    .update({ status: dbStatus })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Repair request not found');
    }
    throw new Error(formatErrorMessage(error.message));
  }

  if (data?.submitted_by) {
    await notifySafely(
      data.submitted_by,
      'repair_status_updated',
      'Repair status updated',
      `"${data.title || 'Your repair request'}" is now ${status.replace('_', ' ')}.`,
      'repair',
    );
  }

  await logAuditEvent({
    dormId: data?.dorm_id || null,
    entityType: 'repair_request',
    entityId: requestId,
    action: 'status_update',
    payload: {
      status,
    },
  });

  return {
    ...data,
    status,
  };
}
