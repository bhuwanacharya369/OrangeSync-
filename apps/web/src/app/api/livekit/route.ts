import { AccessToken } from 'livekit-server-sdk';
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const room = searchParams.get('room');
  
  let user = null;
  const authHeader = request.headers.get('authorization');
  
  if (authHeader) {
     const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
     const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key';
     const mobileClient = createSupabaseClient(supabaseUrl, supabaseKey);
     const token = authHeader.replace('Bearer ', '');
     const { data } = await mobileClient.auth.getUser(token);
     user = data.user;
  } else {
     const cookieStore = await cookies();
     const webClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock_key',
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
     );
     const { data } = await webClient.auth.getUser();
     user = data.user;
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
  }

  if (!room) {
    return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY || 'mock_key';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'mock_secret';
  
  const participantName = (user.user_metadata?.full_name || user.email) as string;

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: participantName,
  });

  at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

  return NextResponse.json({ token: await at.toJwt() });
}
