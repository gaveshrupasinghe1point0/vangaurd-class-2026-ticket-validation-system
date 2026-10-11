import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await context.params;
  const { amount } = await request.json();

  const numAmount = Number(amount);
  if (![6500, 7000, 4000].includes(numAmount)) {
    return NextResponse.json({ error: 'Invalid ticket amount.' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('attendees')
    .update({ receipt_amount: numAmount })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
