'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManualPaymentButton({
  attendeeId,
  currentStatus,
}: {
  attendeeId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(status: string, notes?: string) {
    setLoading(true);
    await fetch(`/api/admin/payment-status/${attendeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: status, payment_notes: notes }),
    });
    setLoading(false);
    router.refresh();
  }

  if (currentStatus === 'paid') {
    return (
      <button
        onClick={() => update('not_paid', 'Manually reversed by admin')}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:border-red-500/40 hover:text-red-400 transition-all disabled:opacity-50"
      >
        Revoke
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => update('paid', 'Manually approved by admin')}
        disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50"
      >
        ✓ Approve
      </button>
      {currentStatus !== 'suspicious' && (
        <button
          onClick={() => update('suspicious', 'Flagged manually by admin')}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
        >
          ⚠ Flag
        </button>
      )}
    </div>
  );
}
