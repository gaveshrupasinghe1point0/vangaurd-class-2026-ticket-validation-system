import { createClient, createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import JSZip from 'jszip';

export const maxDuration = 60; // Allow up to 60s for downloading receipts

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const adminClient = createAdminClient();

  // Fetch all attendee data including payment & receipt info
  const { data: attendees, error } = await adminClient
    .from('attendees')
    .select(`
      id, full_name, nic, email, phone, qr_used, qr_used_at,
      payment_status, receipt_url, receipt_amount, receipt_payment_time,
      receipt_transaction_ref, payment_notes, payment_verified_at,
      is_prefect, qr_sent, created_at,
      sentinel:profiles!attendees_qr_used_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const zip = new JSZip();

  // 1. Build CSV of all attendee details
  const escapeCsv = (val: unknown) => {
    if (val === null || val === undefined) return '""';
    return '"' + String(val).replace(/"/g, '""') + '"';
  };

  const headers = [
    'Full Name',
    'NIC',
    'Email',
    'Phone',
    'Ticket Tier / Type',
    'Payment Status',
    'Receipt Amount (LKR)',
    'Payment Time',
    'Transaction Ref',
    'Payment Notes',
    'Payment Verified At',
    'Check-in Status',
    'Check-in Time',
    'Scanned By',
    'QR Sent',
    'Receipt File Saved In Zip',
    'Receipt URL',
    'Registration Date',
  ];

  // Helper to sanitize filenames
  const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Map receipt downloads
  const receiptFolder = zip.folder('payment-slips');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const downloadTasks = (attendees || []).map(async (a: any, idx: number) => {
    let savedFilename = '';

    if (a.receipt_url) {
      try {
        const urlObj = new URL(a.receipt_url);
        const pathParts = urlObj.pathname.split('.');
        const ext = pathParts.length > 1 ? `.${pathParts.pop()?.toLowerCase()}` : '.jpg';
        
        // Clean descriptive filename: 001_NIC_FullName.ext
        const cleanName = `${String(idx + 1).padStart(3, '0')}_${sanitize(a.nic || 'NO_NIC')}_${sanitize(a.full_name || 'Attendee')}${ext}`;
        savedFilename = `payment-slips/${cleanName}`;

        const res = await fetch(a.receipt_url);
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          receiptFolder?.file(cleanName, arrayBuffer);
        } else {
          savedFilename = 'Download failed (URL unreachable)';
        }
      } catch (err) {
        console.error(`Failed to download receipt for ${a.full_name}:`, err);
        savedFilename = 'Download error';
      }
    } else {
      savedFilename = 'No receipt uploaded';
    }

    const tier = a.is_prefect
      ? 'Prefect (4,000)'
      : a.receipt_amount === 7000
      ? 'Standard (7,000)'
      : 'Early Bird (6,500)';

    return [
      escapeCsv(a.full_name),
      escapeCsv(a.nic),
      escapeCsv(a.email),
      escapeCsv(a.phone),
      escapeCsv(tier),
      escapeCsv(a.payment_status || 'not_paid'),
      escapeCsv(a.receipt_amount || ''),
      escapeCsv(a.receipt_payment_time || ''),
      escapeCsv(a.receipt_transaction_ref || ''),
      escapeCsv(a.payment_notes || ''),
      escapeCsv(a.payment_verified_at ? new Date(a.payment_verified_at).toLocaleString() : ''),
      escapeCsv(a.qr_used ? 'Checked In' : 'Pending'),
      escapeCsv(a.qr_used_at ? new Date(a.qr_used_at).toLocaleString() : ''),
      escapeCsv(a.sentinel?.full_name || ''),
      escapeCsv(a.qr_sent ? 'Yes' : 'No'),
      escapeCsv(savedFilename),
      escapeCsv(a.receipt_url || ''),
      escapeCsv(new Date(a.created_at).toLocaleString()),
    ];
  });

  const rows = await Promise.all(downloadTasks);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  zip.file('attendees-full-information.csv', csvContent);

  // Generate ZIP file
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const dateStr = new Date().toISOString().split('T')[0];

  return new NextResponse(zipBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="vanguard-attendees-and-slips-${dateStr}.zip"`,
    },
  });
}
