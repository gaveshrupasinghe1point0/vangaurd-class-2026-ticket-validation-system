import { createClient } from '@/lib/supabase-server';
import Link from 'next/link';
import { Plus, Shield } from 'lucide-react';
import type { Profile } from '@/types';

export default async function SentinelsPage() {
  const supabase = await createClient();

  const { data: sentinels } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'sentinel')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sentinels</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Entry scanner accounts — {sentinels?.length ?? 0} active
          </p>
        </div>
        <Link
          href="/admin/sentinels/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all"
        >
          <Plus size={16} />
          Add Sentinel
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        {sentinels && sentinels.length > 0 ? (
          <ul className="divide-y divide-zinc-800">
            {(sentinels as Profile[]).map((s) => (
              <li key={s.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Shield size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {s.full_name}
                  </div>
                  <div className="text-zinc-500 text-xs truncate">{s.email}</div>
                </div>
                <div className="shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
                    Sentinel
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-16 text-center">
            <Shield size={36} className="text-zinc-700 mx-auto mb-3" />
            <div className="text-zinc-400 font-medium">No sentinels yet</div>
            <div className="text-zinc-600 text-sm mt-1">
              Add sentinel accounts for your entry team
            </div>
            <Link
              href="/admin/sentinels/new"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-all"
            >
              <Plus size={15} />
              Add First Sentinel
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
