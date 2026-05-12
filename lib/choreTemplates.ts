import { formatErrorMessage } from './errors';
import { supabase } from './supabase';

/** Template record used for weekly schedule creation. */
export interface ChoreTemplate {
  id: string;
  dorm_id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: string | null;
  default_due_in_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Input for creating a template. */
export interface CreateChoreTemplateInput {
  title: string;
  description?: string | null;
  category?: string | null;
  default_due_in_days?: number;
}

/** Input for updating a template. */
export interface UpdateChoreTemplateInput {
  title?: string;
  description?: string | null;
  category?: string | null;
  default_due_in_days?: number;
  is_active?: boolean;
}

/** Returns templates for a dorm with optional inactive rows. */
export async function getChoreTemplates(
  dormId: string,
  includeInactive = false,
): Promise<ChoreTemplate[]> {
  if (!dormId) throw new Error('Dorm ID is required');

  let query = supabase
    .from('chore_templates')
    .select('*')
    .eq('dorm_id', dormId)
    .order('created_at', { ascending: false });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(formatErrorMessage(error.message));

  return (data || []) as ChoreTemplate[];
}

/** Creates a new chore template. */
export async function createChoreTemplate(
  dormId: string,
  userId: string,
  input: CreateChoreTemplateInput,
): Promise<ChoreTemplate> {
  if (!dormId) throw new Error('Dorm ID is required');
  if (!userId) throw new Error('User ID is required');

  const title = String(input.title || '').trim();
  if (!title) throw new Error('Template title is required');

  const dueInDays = input.default_due_in_days ?? 7;
  if (dueInDays < 1 || dueInDays > 365) {
    throw new Error('Default due days must be between 1 and 365');
  }

  const payload = {
    dorm_id: dormId,
    created_by: userId,
    title,
    description: input.description?.trim() || null,
    category: input.category?.trim() || null,
    default_due_in_days: dueInDays,
    is_active: true,
  };

  const { data, error } = await supabase.from('chore_templates').insert(payload).select().single();
  if (error) throw new Error(formatErrorMessage(error.message));

  return data as ChoreTemplate;
}

/** Updates fields on a chore template. */
export async function updateChoreTemplate(
  templateId: string,
  input: UpdateChoreTemplateInput,
): Promise<ChoreTemplate> {
  if (!templateId) throw new Error('Template ID is required');

  const payload: Record<string, any> = {};
  if (input.title !== undefined) {
    const title = input.title.trim();
    if (!title) throw new Error('Template title cannot be empty');
    payload.title = title;
  }
  if (input.description !== undefined) payload.description = input.description?.trim() || null;
  if (input.category !== undefined) payload.category = input.category?.trim() || null;
  if (input.default_due_in_days !== undefined) {
    if (input.default_due_in_days < 1 || input.default_due_in_days > 365) {
      throw new Error('Default due days must be between 1 and 365');
    }
    payload.default_due_in_days = input.default_due_in_days;
  }
  if (input.is_active !== undefined) payload.is_active = input.is_active;

  const { data, error } = await supabase
    .from('chore_templates')
    .update(payload)
    .eq('id', templateId)
    .select()
    .single();

  if (error) throw new Error(formatErrorMessage(error.message));
  return data as ChoreTemplate;
}

/** Deletes a chore template by id. */
export async function deleteChoreTemplate(templateId: string): Promise<void> {
  if (!templateId) throw new Error('Template ID is required');
  const { error } = await supabase.from('chore_templates').delete().eq('id', templateId);
  if (error) throw new Error(formatErrorMessage(error.message));
}
