'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TogglePrefectButton({ attendeeId, isPrefect, iconOnly }: { attendeeId: string, isPrefect: boolean, iconOnly?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    if (!confirm(isPrefect ? 'Remove Prefect status?' : 'Mark as Prefect? This changes their expected fee to LKR 4,000.')) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/attendees/${attendeeId}/toggle-prefect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_prefect: !isPrefect })
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to update status.');
      }
    } catch (err) {
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        title={isPrefect ? 'Remove Prefect' : 'Make Prefect'}
        className={`p-1.5 rounded-full border transition-all disabled:opacity-50 ${isPrefect ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-zinc-800/50 hover:text-zinc-400 hover:border-transparent' : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-purple-500/20 hover:text-purple-400 hover:border-purple-500/30'}`}
      >
        <Shield size={14} className={loading ? 'animate-pulse' : ''} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border transition-all text-sm font-medium disabled:opacity-50 ${isPrefect ? 'border-zinc-500/20 bg-zinc-500/5 text-zinc-400 hover:bg-zinc-500/10 hover:border-zinc-500/40' : 'border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/40'}`}
    >
      <Shield size={16} className={loading ? 'animate-pulse' : ''} />
      {isPrefect ? 'Remove Prefect Status' : 'Mark as Prefect (LKR 4,000)'}
    </button>
  );
}
