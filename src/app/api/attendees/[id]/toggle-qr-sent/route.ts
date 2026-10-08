import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const { qr_sent } = await request.json();

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('attendees')
      .update({ qr_sent })
      .eq('id', id);

    if (error) {
      console.error('Toggle qr_sent error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
