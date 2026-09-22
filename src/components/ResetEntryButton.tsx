'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResetEntryButton({ attendeeId }: { attendeeId: string }) {
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
