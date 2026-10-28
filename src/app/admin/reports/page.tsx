import { createClient, createAdminClient } from '@/lib/supabase-server';
import { FileText, Users, UserCheck, Clock, Download } from 'lucide-react';
import ExportAllZipButton from '@/components/ExportAllZipButton';

export default async function ReportsPage() {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // All attendees with sentinel info joined
  const { data: checkedIn } = await adminClient
    .from('attendees')
    .select(
      `id, full_name, nic, email, phone, qr_used_at,
       sentinel:profiles!attendees_qr_used_by_fkey(full_name, email)`
    )
    .eq('qr_used', true)
    .order('qr_used_at', { ascending: true });

  const { count: total } = await adminClient
    .from('attendees')
    .select('*', { count: 'exact', head: true });

  const count = checkedIn?.length ?? 0;
  const pending = (total ?? 0) - count;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Entry Report &amp; Data Export</h1>
            <p className="text-zinc-500 text-sm">
              Real-time check-in log and full attendee backup — Vanguard 2026
            </p>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <ExportAllZipButton />

          <a
            href="/api/reports/export"
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#d4af37] text-black font-bold rounded-xl hover:bg-[#f0d060] transition-colors text-sm shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <Download size={16} />
            Export Check-in CSV
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/5 p-5">
          <Users size={20} className="text-[#d4af37] mb-2" />
          <div className="text-3xl font-black text-white">{total ?? 0}</div>
          <div className="text-zinc-500 text-sm mt-0.5">Total Tickets</div>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
          <UserCheck size={20} className="text-green-400 mb-2" />
          <div className="text-3xl font-black text-white">{count}</div>
          <div className="text-zinc-500 text-sm mt-0.5">Checked In</div>
        </div>
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-5">
          <Clock size={20} className="text-zinc-400 mb-2" />
          <div className="text-3xl font-black text-white">{pending}</div>
          <div className="text-zinc-500 text-sm mt-0.5">Not Yet In</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-xs text-zinc-500 mb-2">
          <span>Entry progress</span>
          <span>
            {total ? Math.round((count / total) * 100) : 0}% checked in
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#d4af37] to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${total ? (count / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Check-in log table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">
            Check-in Log ({count})
          </h2>
          <span className="text-zinc-500 text-xs">Sorted by entry time</span>
        </div>

        {checkedIn && checkedIn.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    Attendee
                  </th>
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    NIC
                  </th>
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    Entry Time
                  </th>
                  <th className="text-left px-6 py-3 text-zinc-500 text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                    Scanned By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {checkedIn.map((a, i) => (
                  <tr
                    key={a.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-zinc-600 text-xs font-mono">
                      {i + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm font-medium">
                        {a.full_name}
                      </div>
                      <div className="text-zinc-500 text-xs">{a.email}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs font-mono">
                      {a.nic}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden sm:table-cell">
                      {a.phone}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-green-400 text-xs font-medium">
                        ✓ {a.qr_used_at ? new Date(a.qr_used_at).toLocaleTimeString() : '—'}
                      </div>
                      <div className="text-zinc-600 text-[10px]">
                        {a.qr_used_at ? new Date(a.qr_used_at).toLocaleDateString() : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs hidden md:table-cell">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(a.sentinel as any)?.full_name || 'System / Admin'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center text-zinc-600 text-sm">
            No attendees checked in yet.
          </div>
        )}
      </div>
    </div>
  );
}
