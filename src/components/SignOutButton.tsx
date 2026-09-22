'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-1.5 text-zinc-500 hover:text-red-400 transition-colors text-sm"
    >
      <LogOut size={15} />
      <span className="hidden sm:inline">Sign Out</span>
    </button>
  );
}
