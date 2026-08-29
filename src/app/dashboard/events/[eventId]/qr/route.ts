import { NextRequest } from 'next/server';
import { getOrganizationEvent } from '@/features/events/queries';
import { generateGuestQrSvg } from '@/features/guest-sessions/qr';
import {
  guestJoinUrl,
  qrDownloadFilename,
} from '@/features/guest-sessions/urls';
import {
  getCurrentUser,
  getPrimaryOrganization,
} from '@/features/organizations/queries';
import { getPublicEnv } from '@/lib/env';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new Response('Not found', { status: 404 });
  const organization = await getPrimaryOrganization(user.id);
  if (!organization) return new Response('Not found', { status: 404 });
  const { eventId } = await params;
  const event = await getOrganizationEvent(organization.id, eventId);
  if (!event) return new Response('Not found', { status: 404 });

  const joinUrl = guestJoinUrl(getPublicEnv().NEXT_PUBLIC_SITE_URL, event.slug);
  const svg = await generateGuestQrSvg(joinUrl);
  const download = request.nextUrl.searchParams.get('download') === '1';
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${qrDownloadFilename(event.slug)}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
