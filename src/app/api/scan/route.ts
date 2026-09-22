import { createClient, createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import type { ScanResult } from '@/types';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json<ScanResult>(
      { status: 'invalid', message: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Only sentinels (and admins) can scan
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['sentinel', 'admin'].includes(profile.role)) {
    return NextResponse.json<ScanResult>(
      { status: 'invalid', message: 'Unauthorized' },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json<ScanResult>(
      { status: 'invalid', message: 'No QR token provided' },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Find the attendee with this token
  const { data: attendee, error: findError } = await adminClient
    .from('attendees')
    .select('*')
    .eq('qr_token', token)
    .single();

  if (findError || !attendee) {
    return NextResponse.json<ScanResult>({
      status: 'invalid',
      message: 'QR code not recognised. This ticket does not exist.',
    });
  }

  // Already used?
  if (attendee.qr_used) {
    return NextResponse.json<ScanResult>({
      status: 'already_used',
      message: 'This QR code has already been scanned.',
      attendee,
    });
  }

  // Atomically mark as used — only update if qr_used is still false
  const { data: updated, error: updateError } = await adminClient
    .from('attendees')
    .update({
      qr_used: true,
      qr_used_at: new Date().toISOString(),
      qr_used_by: user.id,
    })
    .eq('qr_token', token)
    .eq('qr_used', false) // prevents race conditions
    .select()
    .single();

  if (updateError || !updated) {
    // Race condition — another sentinel scanned at the same time
    const { data: recheckData } = await adminClient
      .from('attendees')
      .select('*')
      .eq('qr_token', token)
      .single();

    return NextResponse.json<ScanResult>({
      status: 'already_used',
      message: 'This QR code was just scanned by another sentinel.',
      attendee: recheckData ?? attendee,
    });
  }

  return NextResponse.json<ScanResult>({
    status: 'granted',
    message: 'Entry granted.',
    attendee: updated,
  });
}
