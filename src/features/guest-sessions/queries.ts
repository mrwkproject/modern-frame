import 'server-only';
import { createPublicClient } from '@/lib/supabase/public';

export async function createGuestSession(eventSlug: string, tokenHash: string) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('create_guest_session', {
    event_slug: eventSlug,
    guest_token_hash: tokenHash,
  });
  if (error || !data[0]) return null;
  return data[0];
}

export async function validateGuestSession(
  eventSlug: string,
  tokenHash: string,
) {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc('validate_guest_session', {
    event_slug: eventSlug,
    guest_token_hash: tokenHash,
  });
  if (error || !data[0]) return { valid: false, expires_at: null };
  return data[0];
}
