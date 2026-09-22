import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch all attendees with their scanning sentinel
  const { data: attendees, error } = await supabase
    .from('attendees')
    .select(`
      full_name, nic, email, phone, qr_used, qr_used_at,
      sentinel:profiles!attendees_qr_used_by_fkey(full_name)
    `)
    // Sort so checked-in people show up first, by check-in time
    .order('qr_used', { ascending: false })
    .order('qr_used_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Helper to safely format CSV cells (handles commas and quotes in data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const escapeCsv = (val: any) => {
    if (!val) return '""';
    return '"' + String(val).replace(/"/g, '""') + '"';
  };

  const headers = ['Full Name', 'NIC', 'Email', 'Phone', 'Status', 'Entry Time', 'Scanned By'];
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (attendees || []).map((a: any) => [
    escapeCsv(a.full_name),
    escapeCsv(a.nic),
    escapeCsv(a.email),
    escapeCsv(a.phone),
    escapeCsv(a.qr_used ? 'Checked In' : 'Pending'),
    escapeCsv(a.qr_used_at ? new Date(a.qr_used_at).toLocaleString() : ''),
    escapeCsv(a.sentinel?.full_name || '')
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="vanguard-2026-report-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}
