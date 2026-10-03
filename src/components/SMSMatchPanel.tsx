'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SMSMatchPanel() {
  const router = useRouter();
  const [smsText, setSmsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<null | {
    matched: { nic: string; name: string; amount: number; time: string }[];
    suspicious: { nic: string; reason: string; amount: number }[];
    notFound: { nic: string; reference: string }[];
    crashes: { nic: string; transactions: { amount: number; time: string; balance: number }[]; registeredName: string; receiptUrl: string }[];
    totalParsed: number;
  }>(null);
  const [error, setError] = useState('');

  async function handleMatch() {
    if (!smsText.trim()) { setError('Paste your bank SMS messages first.'); return; }
    setLoading(true);
    setError('');
    setResults(null);

    const res = await fetch('/api/admin/match-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ smsText }),
    });
    const json = await res.json();

    if (!res.ok) { setError(json.error || 'Failed to process SMS.'); setLoading(false); return; }

    setResults({ ...json.results, totalParsed: json.totalParsed });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-8">
      <h2 className="text-white font-semibold mb-1">📲 Paste Bank SMS Messages</h2>
      <p className="text-zinc-500 text-sm mb-4">
        Paste all your HNB credit SMS messages below. The system will auto-match them against attendee NICs and mark payments as verified.
      </p>

      <textarea
        value={smsText}
        onChange={e => setSmsText(e.target.value)}
        rows={6}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 resize-none transition-all"
        placeholder={`LKR 6,500.00 credited to Ac No:22302XXXXX25 on 01/10/26 03:44:51 Reason:200713102718 Bal:LKR 6,500.96...\n\nPaste multiple SMS messages separated by blank lines`}
      />

      {error && (
        <div className="mt-3 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      <button
        onClick={handleMatch}
        disabled={loading}
        className="mt-3 px-6 py-2.5 bg-[#d4af37] hover:bg-[#f0d060] disabled:opacity-50 text-black font-bold rounded-xl transition-all text-sm"
      >
        {loading ? 'Matching...' : 'Match & Verify Payments'}
      </button>

      {results && (
        <div className="mt-5 space-y-4">
          <p className="text-zinc-400 text-sm">Processed <strong className="text-white">{results.totalParsed}</strong> SMS message(s).</p>

          {results.matched.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <p className="text-green-400 text-sm font-semibold mb-2">✅ {results.matched.length} Verified</p>
              <ul className="space-y-1">
                {results.matched.map((m, i) => (
                  <li key={i} className="text-green-300 text-xs">
                    {m.name} ({m.nic}) — LKR {m.amount.toLocaleString()} at {m.time}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {results.suspicious.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm font-semibold mb-2">⚠ {results.suspicious.length} Suspicious</p>
              <ul className="space-y-1">
                {results.suspicious.map((s, i) => (
                  <li key={i} className="text-red-300 text-xs">{s.nic || 'Unknown'} — {s.reason}</li>
                ))}
              </ul>
            </div>
          )}

          {results.crashes && results.crashes.length > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <p className="text-orange-400 text-sm font-semibold mb-1">🚨 {results.crashes.length} Reference Crash(es) Detected</p>
              <p className="text-orange-300/70 text-xs mb-3">These NICs appeared multiple times in the SMS batch. No one was auto-approved. Review manually and verify who actually paid.</p>
              <div className="space-y-3">
                {results.crashes.map((c, i) => (
                  <div key={i} className="bg-black/30 border border-orange-500/20 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-white text-xs font-semibold">{c.registeredName}</span>
                        <span className="text-orange-300 text-xs font-mono ml-2">({c.nic})</span>
                      </div>
                      {c.receiptUrl && (
                        <a href={c.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-[#d4af37] text-xs hover:underline">View Receipt</a>
                      )}
                    </div>
                    <p className="text-orange-300/70 text-[11px] mb-1.5">{c.transactions.length} payments found with this NIC as reference:</p>
                    <ul className="space-y-1">
                      {c.transactions.map((t, j) => (
                        <li key={j} className="text-orange-200 text-xs">
                          LKR {t.amount.toLocaleString()} at {t.time} — Bal after: LKR {t.balance.toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.notFound.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 text-sm font-semibold mb-2">❓ {results.notFound.length} Not Found in System</p>
              <ul className="space-y-1">
                {results.notFound.map((n, i) => (
                  <li key={i} className="text-yellow-300 text-xs">NIC: {n.nic} (Ref: {n.reference})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
