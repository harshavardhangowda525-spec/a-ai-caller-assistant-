import 'server-only';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export interface AuthedUser {
  id: string;
  email: string;
}

/**
 * Require an authenticated app user for a route handler. Returns the user, or a
 * NextResponse (401) to return early.
 */
export async function requireUser(): Promise<AuthedUser | NextResponse> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  return { id: user.id, email: user.email ?? '' };
}

/** Write an audit log entry (best-effort). */
export async function audit(
  actor: string | null,
  action: string,
  entity?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await getAdminClient().from('audit_logs').insert({
      actor,
      action,
      entity: entity ?? null,
      entity_id: entityId ?? null,
      metadata: metadata ?? null,
    });
  } catch {
    // Never let auditing failure break the request.
  }
}
