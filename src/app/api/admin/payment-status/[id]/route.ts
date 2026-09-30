// API to manually update a single attendee's payment status (admin only)
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await context.params;
  const { payment_status, payment_notes } = await request.json();

  const valid = ['pending_review', 'paid', 'suspicious', 'not_paid'];
  if (!valid.includes(payment_status)) {
    return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('attendees')
    .update({
      payment_status,
      payment_notes: payment_notes ?? null,
      payment_verified_at: payment_status === 'paid' ? new Date().toISOString() : null,
    })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
