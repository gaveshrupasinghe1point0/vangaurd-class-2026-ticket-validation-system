import { createClient } from '@/lib/supabase-server';
import { Users, UserCheck, Clock, Shield } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalAttendees },
    { count: checkedIn },
    { count: totalSentinels },
  ] = await Promise.all([
    supabase.from('attendees').select('*', { count: 'exact', head: true }),
    supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('qr_used', true),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'sentinel'),
  ]);

  const pending = (totalAttendees ?? 0) - (checkedIn ?? 0);

  const stats = [
    {
      label: 'Total Attendees',
      value: totalAttendees ?? 0,
      icon: Users,
      color: 'text-[#d4af37]',
      bg: 'bg-[#d4af37]/10',
      border: 'border-[#d4af37]/20',
    },
    {
      label: 'Checked In',
      value: checkedIn ?? 0,
      icon: UserCheck,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    {
      label: 'Awaiting Entry',
      value: pending,
      icon: Clock,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    {
      label: 'Sentinels',
      value: totalSentinels ?? 0,
      icon: Shield,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
  ];

  // Recent check-ins
  const { data: recentScans } = await supabase
    .from('attendees')
    .select('id, full_name, nic, qr_used_at')
    .eq('qr_used', true)
    .order('qr_used_at', { ascending: false })
    .limit(5);

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Vanguard 2026 — Live event overview
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`rounded-2xl border ${border} ${bg} p-5`}
          >
            <div className={`${color} mb-3`}>
              <Icon size={22} />
            </div>
            <div className="text-3xl font-black text-white">{value}</div>
            <div className="text-zinc-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          href="/admin/attendees/new"
          className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-[#d4af37]/40 hover:bg-[#d4af37]/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37]/20 transition-all">
            <Users size={20} />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              Add New Attendee
            </div>
            <div className="text-zinc-500 text-xs mt-0.5">
              Create profile &amp; generate QR code
            </div>
          </div>
        </Link>

        <Link
          href="/admin/sentinels/new"
          className="flex items-center gap-4 p-5 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-purple-500/40 hover:bg-purple-500/5 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition-all">
            <Shield size={20} />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              Add Sentinel Account
            </div>
            <div className="text-zinc-500 text-xs mt-0.5">
              Create entry scanner account
            </div>
          </div>
        </Link>
      </div>

      {/* Recent check-ins */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">
            Recent Check-Ins
          </h2>
          <Link
            href="/admin/attendees"
            className="text-[#d4af37] text-xs hover:text-[#f0d060] transition-colors"
          >
            View All →
          </Link>
        </div>
        {recentScans && recentScans.length > 0 ? (
          <ul className="divide-y divide-zinc-800">
            {recentScans.map((a) => (
              <li
                key={a.id}
                className="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-white text-sm font-medium">
                    {a.full_name}
                  </div>
                  <div className="text-zinc-500 text-xs">{a.nic}</div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
                    ✓ Checked In
                  </div>
                  {a.qr_used_at && (
                    <div className="text-zinc-600 text-xs mt-1">
                      {new Date(a.qr_used_at).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-6 py-12 text-center text-zinc-600 text-sm">
            No check-ins yet
          </div>
        )}
      </div>
    </div>
  );
}
