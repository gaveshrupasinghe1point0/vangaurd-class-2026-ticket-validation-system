import { createClient } from '@/lib/supabase-server';
import { ScanLine } from 'lucide-react';
import SignOutButton from '@/components/SignOutButton';

export default async function SentinelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#09090b] flex flex-col">
      {/* Compact mobile header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-4 py-3 h-[57px]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] shrink-0">
            <ScanLine size={14} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-black text-sm tracking-tight">VANGUARD</span>
            <span className="text-[#d4af37] font-black text-xs tracking-wider">2026</span>
            {profile && (
              <>
                <span className="text-zinc-700 text-xs">·</span>
                <span className="text-zinc-500 text-xs truncate max-w-[100px]">
                  {profile.full_name}
                </span>
              </>
            )}
          </div>
        </div>
        <SignOutButton />
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
