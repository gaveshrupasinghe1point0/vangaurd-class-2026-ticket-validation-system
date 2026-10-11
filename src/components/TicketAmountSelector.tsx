'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TicketAmountSelector({
  attendeeId,
  currentAmount,
  isPrefect,
}: {
  attendeeId: string;
  currentAmount: number | null | undefined;
  isPrefect?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Default to 4000 if prefect, otherwise 7000 if 7000, else 6500
  const initialValue = currentAmount
    ? String(currentAmount)
    : isPrefect
    ? '4000'
    : '6500';

  const [amount, setAmount] = useState<string>(initialValue);

  async function handleChange(newAmount: string) {
    setLoading(true);
    setAmount(newAmount);
    try {
      const res = await fetch(`/api/admin/attendees/${attendeeId}/ticket-amount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(newAmount) }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (e) {
      console.error('Failed to update ticket amount:', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={amount}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value)}
        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer outline-none ${
          amount === '7000'
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:border-amber-400'
            : amount === '6500'
            ? 'bg-[#d4af37]/15 border-[#d4af37]/40 text-[#d4af37] hover:border-[#d4af37]/70'
            : 'bg-purple-500/15 border-purple-500/40 text-purple-300 hover:border-purple-400'
        } disabled:opacity-50`}
      >
        <option value="6500" className="bg-zinc-900 text-white">
          LKR 6,500 (Early Bird)
        </option>
        <option value="7000" className="bg-zinc-900 text-white">
          LKR 7,000 (Standard)
        </option>
        {isPrefect && (
          <option value="4000" className="bg-zinc-900 text-white">
            LKR 4,000 (Prefect)
          </option>
        )}
      </select>
      {loading && (
        <span className="w-3 h-3 border border-[#d4af37] border-t-transparent rounded-full animate-spin shrink-0" />
      )}
    </div>
  );
}
