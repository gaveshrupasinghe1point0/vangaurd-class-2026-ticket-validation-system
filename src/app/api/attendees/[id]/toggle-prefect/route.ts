import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const { is_prefect } = await request.json();

    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('attendees')
      .update({ is_prefect })
      .eq('id', id);

    if (error) {
      console.error('Toggle prefect error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
