import type { AuthError } from '@supabase/supabase-js';

export function friendlyAuthError(error: AuthError) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'The email or password is incorrect. Check your details and try again.';
    case 'email_not_confirmed':
      return 'Confirm your email address before signing in.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account already exists for this email. Try signing in instead.';
    case 'weak_password':
      return 'Choose a stronger password with at least 8 characters.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a moment, then try again.';
    default:
      return 'We could not complete that request. Check your connection and try again.';
  }
}
