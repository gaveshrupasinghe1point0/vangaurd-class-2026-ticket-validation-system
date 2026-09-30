export default function PaymentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    paid:           { label: '✓ Paid',           classes: 'bg-green-500/15 text-green-400 border-green-500/25' },
    pending_review: { label: '⏳ Pending Review', classes: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' },
    suspicious:     { label: '⚠ Suspicious',      classes: 'bg-red-500/15 text-red-400 border-red-500/25' },
    not_paid:       { label: '✗ Not Paid',        classes: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/40' },
  };

  const s = map[status] ?? map['not_paid'];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${s.classes}`}>
      {s.label}
    </span>
  );
}
