'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ToggleQRSentButton({ attendeeId, isSent, iconOnly }: { attendeeId: string, isSent: boolean, iconOnly?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendees/${attendeeId}/toggle-qr-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_sent: !isSent })
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
        title={isSent ? 'Mark as QR Not Sent' : 'Mark as QR Sent'}
        className={`p-1.5 rounded-lg border transition-all disabled:opacity-50 ${isSent ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-zinc-800/50 hover:text-zinc-400 hover:border-transparent' : 'bg-zinc-800/50 text-zinc-400 border-transparent hover:bg-blue-500/20 hover:text-blue-400 hover:border-blue-500/30'}`}
      >
        <Send size={14} className={loading ? 'animate-pulse' : ''} />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border transition-all text-sm font-medium disabled:opacity-50 ${isSent ? 'border-zinc-500/20 bg-zinc-500/5 text-zinc-400 hover:bg-zinc-500/10 hover:border-zinc-500/40' : 'border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/40'}`}
    >
      <Send size={16} className={loading ? 'animate-pulse' : ''} />
      {isSent ? 'Mark QR as Not Sent' : 'Mark QR as Sent'}
    </button>
  );
}
