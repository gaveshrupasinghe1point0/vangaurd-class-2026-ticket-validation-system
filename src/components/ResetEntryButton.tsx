'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetEntryButton({ attendeeId, iconOnly }: { attendeeId: string, iconOnly?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!confirm('Are you sure you want to reset this entry? The QR code will become valid for entry again.')) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/attendees/${attendeeId}/reset`, { method: 'POST' });
      if (res.ok) {
        router.refresh();
      } else {
        alert('Failed to reset entry status.');
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
        onClick={handleReset}
        disabled={loading}
        title="Reset Entry"
        className="p-1.5 rounded-full bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-50"
      >
        <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
      </button>
    );
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all text-sm font-medium disabled:opacity-50"
    >
      <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
      Reset Entry Status
    </button>
  );
}
