import { formatErrorMessage } from './errors';
import { supabase } from './supabase';

export interface RepairRequestData {
  title: string;
  description: string;
  location: string;
  urgency?: 'low' | 'medium' | 'high';
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

  return data;
}

/**
 * Update a repair request
 */
export async function updateRepairRequest(
  requestId: string,
  updatedData: Partial<RepairRequestData> & {
    status?: 'pending' | 'in_progress' | 'completed' | 'rejected';
    resolution_notes?: string;
  },
) {
  if (!requestId) {
    throw new Error('Request ID is required');
  }

  const { data, error } = await supabase
    .from('repair_requests')
    .update(updatedData)
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

  const { error } = await supabase.from('repair_requests').delete().eq('id', requestId);

  if (error) {
    throw new Error(formatErrorMessage(error.message));
  }
}

export async function getRepairRequests(dormId: string) {
  if (!dormId) throw new Error('Dorm ID is required');

  const { data, error } = await supabase
    .from('repair_requests')
    .select('*')
    .eq('dorm_id', dormId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}
export async function getRepairRequestById(requestId: string) {
  if (!requestId) throw new Error('Request ID is required');

  const { data, error } = await supabase
    .from('repair_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  return data;
}
export async function getRepairRequestsByReporter(userId: string) {
  if (!userId) throw new Error('User ID is required');

  const { data, error } = await supabase
    .from('repair_requests')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
}
