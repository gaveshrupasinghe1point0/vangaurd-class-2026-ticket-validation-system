import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { Plus, UserCheck, Clock, Search } from 'lucide-react';
import type { Attendee } from '@/types';
import ResetEntryButton from '@/components/ResetEntryButton';
import DeleteAttendeeButton from '@/components/DeleteAttendeeButton';

export default async function AttendeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('attendees')
    .select('*')
    .order('created_at', { ascending: false });

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,nic.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`
    );
  }

  const { data: attendees } = await query;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendees</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {attendees?.length ?? 0} total attendees
          </p>
        </div>
        <Link
          href="/admin/attendees/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#f0d060] text-black font-semibold text-sm transition-all"
        >
          <Plus size={16} />
          Add Attendee
        </Link>
      </div>

      {/* Search */}
      <form className="relative mb-6">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name, NIC, email or phone…"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/50 transition-all text-sm"
        />
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {attendees && attendees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-6 py-4 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="text-left px-6 py-4 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    NIC
                  </th>
                  <th className="text-left px-6 py-4 text-zinc-500 text-xs font-medium uppercase tracking-wider hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-zinc-500 text-xs font-medium uppercase tracking-wider hidden sm:table-cell">
                    Phone
                  </th>
                  <th className="text-left px-6 py-4 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-zinc-500 text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {(attendees as Attendee[]).map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-zinc-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/attendees/${a.id}`}
                        className="text-white font-medium text-sm hover:text-[#d4af37] transition-colors"
                      >
                        {a.full_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm font-mono">
                      {a.nic}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm hidden md:table-cell">
                      {a.email}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm hidden sm:table-cell">
                      {a.phone}
                    </td>
                    <td className="px-6 py-4">
                      {a.qr_used ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                            <UserCheck size={12} />
                            Checked In
                          </span>
                          <ResetEntryButton attendeeId={a.id} iconOnly />
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-700/50 border border-zinc-700 text-zinc-400 text-xs font-medium">
                          <Clock size={12} />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/attendees/${a.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-[#d4af37]/20 hover:text-[#d4af37] transition-all text-xs font-medium"
                        >
                          View QR
                        </Link>
                        <DeleteAttendeeButton attendeeId={a.id} attendeeName={a.full_name} iconOnly />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="text-zinc-600 text-4xl mb-3">👤</div>
            <div className="text-zinc-400 font-medium">No attendees found</div>
            <div className="text-zinc-600 text-sm mt-1">
              {q ? 'Try a different search term' : 'Add your first attendee to get started'}
            </div>
            {!q && (
              <Link
                href="/admin/attendees/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#d4af37] text-black text-sm font-semibold hover:bg-[#f0d060] transition-all"
              >
                <Plus size={15} />
                Add Attendee
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
