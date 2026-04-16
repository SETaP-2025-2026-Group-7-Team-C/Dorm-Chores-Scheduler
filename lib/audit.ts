import { supabase } from './supabase';

export interface AuditEventInput {
  actorId?: string | null;
  dormId?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  payload?: Record<string, any>;
}

export async function logAuditEvent(event: AuditEventInput): Promise<void> {
  if (!event.entityType || !event.action) return;

  try {
    await supabase.from('audit_logs').insert({
      actor_id: event.actorId || null,
      dorm_id: event.dormId || null,
      entity_type: event.entityType,
      entity_id: event.entityId || null,
      action: event.action,
      payload: event.payload || {},
    });
  } catch (error) {
    // Audit logging must not break app flows.
    console.warn('Audit logging failed', error);
  }
}
