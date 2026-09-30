import { createAdminClient } from '@/lib/supabase-server';
import Link from 'next/link';
import PaymentStatusBadge from '@/components/PaymentStatusBadge';
import SMSMatchPanel from '@/components/SMSMatchPanel';
import ManualPaymentButton from '@/components/ManualPaymentButton';
import WhatsAppButton from '@/components/WhatsAppButton';

const TABS = ['all', 'pending_review', 'suspicious', 'paid', 'not_paid'] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  all: 'All',
  pending_review: '⏳ Pending',
  suspicious: '⚠ Suspicious',
  paid: '✓ Paid',
  not_paid: '✗ Not Paid',
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: Tab = TABS.includes(rawTab as Tab) ? (rawTab as Tab) : 'all';

  const adminClient = createAdminClient();

  let query = adminClient
    .from('attendees')
    .select('id, full_name, nic, phone, email, payment_status, receipt_url, receipt_amount, receipt_payment_time, receipt_transaction_ref, payment_notes, payment_verified_at, qr_token, created_at')
    .order('created_at', { ascending: false });

  if (tab !== 'all') query = query.eq('payment_status', tab);

  const { data: attendees } = await query;

  // Counts for tab badges
  const { data: counts } = await adminClient
    .from('attendees')
    .select('payment_status');

  const countMap = (counts ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.payment_status] = (acc[a.payment_status] ?? 0) + 1;
    return acc;
  }, {});
  countMap['all'] = counts?.length ?? 0;

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Payments</h1>
        <p className="text-zinc-500 text-sm mt-1">Review receipts, run SMS matching, and verify payments.</p>
      </div>

      {/* SMS Match Panel */}
      <SMSMatchPanel />

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <Link
            key={t}
            href={`/admin/payments?tab=${t}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === t
                ? 'bg-[#d4af37] text-black border-[#d4af37]'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600'
            }`}
          >
            {TAB_LABELS[t]} {countMap[t] !== undefined ? `(${countMap[t]})` : ''}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {!attendees || attendees.length === 0 ? (
          <div className="px-6 py-16 text-center text-zinc-600 text-sm">No registrations found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="px-5 py-4 text-left text-zinc-500 font-medium">Attendee</th>
                  <th className="px-5 py-4 text-left text-zinc-500 font-medium">NIC</th>
                  <th className="px-5 py-4 text-left text-zinc-500 font-medium">Amount</th>
                  <th className="px-5 py-4 text-left text-zinc-500 font-medium">Payment Time</th>
                  <th className="px-5 py-4 text-left text-zinc-500 font-medium">Status</th>
                  <th className="px-5 py-4 text-left text-zinc-500 font-medium">Receipt</th>
                  <th className="px-5 py-4 text-right text-zinc-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {attendees.map(a => (
                  <tr key={a.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="text-white font-medium">{a.full_name}</div>
                      <div className="text-zinc-500 text-xs">{a.email}</div>
                    </td>
                    <td className="px-5 py-4 text-zinc-300 font-mono text-xs">{a.nic}</td>
                    <td className="px-5 py-4 text-zinc-300">
                      {a.receipt_amount ? `LKR ${Number(a.receipt_amount).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-4 text-zinc-400 text-xs">
                      {a.receipt_payment_time || '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        <PaymentStatusBadge status={a.payment_status ?? 'not_paid'} />
                        {a.payment_notes && (
                          <p className="text-zinc-500 text-[11px] max-w-[200px] leading-tight">{a.payment_notes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {a.receipt_url ? (
                        <a
                          href={a.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#d4af37] text-xs hover:text-[#f0d060] underline underline-offset-2"
                        >
                          View PDF
                        </a>
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <ManualPaymentButton
                          attendeeId={a.id}
                          currentStatus={a.payment_status ?? 'not_paid'}
                        />
                        {a.payment_status === 'paid' && (
                          <WhatsAppButton phone={a.phone} name={a.full_name} token={a.qr_token} iconOnly />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
