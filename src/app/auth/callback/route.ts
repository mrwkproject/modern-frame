import { NextResponse, type NextRequest } from 'next/server';
import { safeAuthRedirect } from '@/features/auth/decisions';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const destination = safeAuthRedirect(
    request.nextUrl.searchParams.get('next'),
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, request.url));
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set(
    'message',
    'The confirmation link is invalid or expired. Request a new one and try again.',
  );
  return NextResponse.redirect(loginUrl);
}
