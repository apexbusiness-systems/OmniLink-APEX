import { postAuditEvent } from '@/integrations/lovable/client';
import type { AuditEventEnvelope } from '@/integrations/lovable/types';
import { logError } from '@/lib/monitoring';

function unauthorized(): Response {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleLovableAudit(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as AuditEventEnvelope;
    if (!body?.event) {
      return new Response(JSON.stringify({ error: 'invalid_payload' }), { status: 400 });
    }

    await postAuditEvent(body.event);
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await logError(error as Error, { action: 'lovable_audit_proxy' });
    return new Response(JSON.stringify({ error: 'server_error' }), { status: 500 });
  }
}

// Default export for serverless platforms (e.g., Vercel/Netlify style)
export default handleLovableAudit;

