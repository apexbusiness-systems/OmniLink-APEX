import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

interface DeviceInfo {
  device_info: Record<string, unknown>;
  last_seen: string;
  device_id: string;
  user_id: string;
  status?: 'trusted' | 'suspect' | 'blocked';
}

interface DeviceRegistryResponse {
  devices: DeviceInfo[];
}

function getSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Fetch device registry directly from Supabase device_registry table
 * Replaces Lovable API dependency
 */
async function getDeviceRegistry(userId: string): Promise<DeviceRegistryResponse> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('device_registry')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch device registry: ${error.message}`);
  }

  const devices: DeviceInfo[] = (data || []).map((d) => ({
    device_id: d.device_id,
    user_id: d.user_id,
    device_info: d.device_info as Record<string, unknown>,
    last_seen: d.last_seen,
    status: d.status,
  }));

  return { devices };
}

/**
 * Upsert device directly to Supabase device_registry table
 * Replaces Lovable API dependency
 */
async function upsertDevice(userId: string, device: DeviceInfo): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('device_registry')
    .upsert({
      user_id: userId,
      device_id: device.device_id,
      device_info: device.device_info,
      status: device.status || 'suspect',
      last_seen: device.last_seen,
    }, {
      onConflict: 'user_id,device_id',
    });

  if (error) {
    throw new Error(`Failed to upsert device: ${error.message}`);
  }
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function unauthorized(): Response {
  return json({ error: 'unauthorized' }, 401);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get userId from header or query params
    let userId = req.headers.get('x-user-id') ?? new URL(req.url).searchParams.get('user_id');
    
    // If no userId in header, try to get from Supabase auth
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          userId = user.id;
        } else {
          return unauthorized();
        }
      } else {
        return unauthorized();
      }
    }

    if (!userId) {
      return unauthorized();
    }

    if (req.method === 'GET') {
      try {
        const registry = await getDeviceRegistry(userId);
        return json(registry, 200);
      } catch (error) {
        console.error('Device registry fetch failed:', error);
        return json(
          {
            error: 'registry_fetch_failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          500
        );
      }
    }

    if (req.method === 'POST') {
      try {
        const body = (await req.json()) as { device: DeviceInfo };
        if (!body?.device?.device_id) {
          return json({ error: 'invalid_payload', message: 'Missing device_id' }, 400);
        }
        await upsertDevice(userId, body.device);
        return json({ status: 'ok' }, 200);
      } catch (error) {
        console.error('Device upsert failed:', error);
        return json(
          {
            error: 'upsert_failed',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          500
        );
      }
    }

    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('Lovable device function error:', error);
    return json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

