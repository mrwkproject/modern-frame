const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SITE_URL',
];

for (const name of required) {
  if (!process.env[name])
    throw new Error(`Missing required production variable: ${name}`);
}

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL);
if (
  siteUrl.protocol !== 'https:' ||
  ['localhost', '127.0.0.1', '::1'].includes(siteUrl.hostname)
) {
  throw new Error(
    'NEXT_PUBLIC_SITE_URL must be a public HTTPS origin for deployment.',
  );
}

console.log(`Production public environment is valid for ${siteUrl.origin}.`);
