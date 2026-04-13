import { supabase } from './supabase';
import { ValidationError, formatErrorMessage } from './errors';

export type RepairStatus = 'pending' | 'in_progress' | 'resolved';

const VALID_STATUSES: RepairStatus[] = ['pending', 'in_progress', 'resolved'];

export async function updateRepairStatus(requestId: string, status: RepairStatus) {
  if (!VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Invalid status: ${status}`);
  }

  const { error: fetchError } = await supabase
    .from('repairs')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new ValidationError(`Repair request not found: ${requestId}`);
    }
    throw new Error(formatErrorMessage(fetchError.message));
  }

  const { data, error: updateError } = await supabase
    .from('repairs')
    .update({ status })
    .eq('id', requestId)
    .select()
    .single();

  if (updateError) {
    throw new Error(formatErrorMessage(updateError.message));
  }

  return data;
}
