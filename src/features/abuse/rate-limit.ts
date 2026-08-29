import 'server-only';
import { createRateLimitKey } from '@/features/abuse/ip';
import { getServerEnv } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';

export async function consumeJoinRateLimit(eventSlug: string, ip: string) {
  const env = getServerEnv();
  const keyHash = await createRateLimitKey({
    secret: env.ABUSE_RATE_LIMIT_SECRET,
    scope: 'guest_join',
    eventSlug,
    ip,
  });
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('consume_join_rate_limit', {
    requested_scope: 'guest_join',
    requested_key_hash: keyHash,
    window_seconds: 600,
    max_attempts: 20,
  });
  if (error || !data[0]) throw new Error('JOIN_RATE_LIMIT_FAILED');
  return data[0];
}
