'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DeleteAttendeeButton({ 
  attendeeId, 
  attendeeName,
  iconOnly 
}: { 
  attendeeId: string;
  attendeeName: string;
  iconOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Are you absolutely sure you want to delete ${attendeeName}? This action cannot be undone and their QR code will immediately become invalid.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/attendees/${attendeeId}`, { method: 'DELETE' });
      if (res.ok) {
        if (iconOnly) {
          router.refresh();
        } else {
          router.push('/admin/attendees');
          router.refresh();
        }
      } else {
        alert('Failed to delete attendee.');
        setLoading(false);
      }
    } catch (err) {
      alert('Network error.');
      setLoading(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleDelete}
        disabled={loading}
        title={`Delete ${attendeeName}`}
        className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-50"
      >
        <Trash2 size={14} className={loading ? 'animate-pulse' : ''} />
      </button>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all text-sm font-medium disabled:opacity-50"
    >
      <Trash2 size={16} className={loading ? 'animate-pulse' : ''} />
      Delete Attendee
    </button>
  );
}
