import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { parseBankSMS } from '@/lib/sms-parser';

export async function POST(request: Request) {
  // Auth check — admin only
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { smsText } = body;

  if (!smsText?.trim()) {
    return NextResponse.json({ error: 'No SMS text provided.' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const parsed = parseBankSMS(smsText);

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No valid bank SMS messages found in the text.' }, { status: 400 });
  }

  // Detect reference crashes — same NIC appearing in multiple SMS messages
  const nicCounts: Record<string, number> = {};
  for (const sms of parsed) {
    if (sms.nic) nicCounts[sms.nic] = (nicCounts[sms.nic] ?? 0) + 1;
  }
  const crashedNICs = new Set(Object.entries(nicCounts).filter(([, count]) => count > 1).map(([nic]) => nic));

  const results = {
    matched: [] as { nic: string; name: string; amount: number; time: string }[],
    suspicious: [] as { nic: string; reason: string; amount: number }[],
    notFound: [] as { nic: string; reference: string }[],
    crashes: [] as { nic: string; transactions: { amount: number; time: string; balance: number }[]; registeredName: string; receiptUrl: string }[],
  };

  for (const sms of parsed) {
    // Handle reference crashes — do NOT auto-approve, collect for manual review
    if (crashedNICs.has(sms.nic)) {
      let crashEntry = results.crashes.find(c => c.nic === sms.nic);
      if (!crashEntry) {
        const { data: crashAttendee } = await adminClient
          .from('attendees')
          .select('full_name, receipt_url')
          .eq('nic', sms.nic)
          .single();
        crashEntry = {
          nic: sms.nic,
          transactions: [],
          registeredName: crashAttendee?.full_name ?? 'Unknown',
          receiptUrl: crashAttendee?.receipt_url ?? '',
        };
        results.crashes.push(crashEntry);
      }
      crashEntry.transactions.push({ amount: sms.amount, time: sms.timestamp, balance: sms.balance });
      continue;
    }

    if (sms.suspicious) {
      results.suspicious.push({ nic: sms.nic, reason: sms.suspicionReason ?? '', amount: sms.amount });
      continue;
    }

    if (!sms.nic) {
      results.suspicious.push({ nic: '', reason: 'No NIC found in SMS', amount: sms.amount });
      continue;
    }

    // Find attendee by NIC
    const { data: attendee } = await adminClient
      .from('attendees')
      .select('id, full_name, nic, payment_status')
      .eq('nic', sms.nic)
      .single();

    if (!attendee) {
      results.notFound.push({ nic: sms.nic, reference: sms.reference });
      continue;
    }

    // Already paid — skip
    if (attendee.payment_status === 'paid') {
      results.matched.push({ nic: sms.nic, name: attendee.full_name, amount: sms.amount, time: sms.timestamp });
      continue;
    }

    // Mark as paid and save the amount + time from the SMS
    await adminClient
      .from('attendees')
      .update({
        payment_status: 'paid',
        receipt_amount: sms.amount,
        receipt_payment_time: sms.timestamp,
        payment_verified_at: new Date().toISOString(),
        payment_notes: `Auto-verified via SMS. Amount: LKR ${sms.amount.toLocaleString()}. Time: ${sms.timestamp}. Balance after: LKR ${sms.balance.toLocaleString()}.`,
      })
      .eq('id', attendee.id);

    results.matched.push({ nic: sms.nic, name: attendee.full_name, amount: sms.amount, time: sms.timestamp });
  }

  return NextResponse.json({ success: true, results, totalParsed: parsed.length });
}
