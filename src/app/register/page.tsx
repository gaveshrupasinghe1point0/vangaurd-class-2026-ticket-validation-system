'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ full_name: '', nic: '', phone: '', email: '' });
  const [file, setFile] = useState<File | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Please upload your bank payment receipt (PDF).'); return; }
    if (file.type !== 'application/pdf') { setError('Only PDF files are accepted.'); return; }

    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('full_name', form.full_name.trim());
    data.append('nic', form.nic.trim());
    data.append('phone', form.phone.trim());
    data.append('email', form.email.trim());
    data.append('receipt', file);

    const res = await fetch('/api/register', { method: 'POST', body: data });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
        <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#d4af37]/5 blur-[120px]" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-black text-white mb-3">Registration Received!</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Your payment receipt has been submitted and is under review. Once your payment is verified, you will receive your QR code ticket via WhatsApp.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 text-left mb-6">
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-3">⏳ What happens next?</p>
            <ol className="space-y-2 text-sm text-zinc-400 list-decimal list-inside">
              <li>Your receipt is checked against bank records</li>
              <li>Payment is confirmed (usually within a few hours)</li>
              <li>You receive your personal QR ticket on WhatsApp</li>
              <li>Present the QR at the entrance on event day</li>
            </ol>
          </div>
          <p className="text-zinc-600 text-xs">Questions? Contact the Vanguard 2026 team.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#09090b] py-10 px-4">
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#d4af37]/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl font-black text-white tracking-tight">VANGUARD</div>
          <div className="text-xl font-black text-[#d4af37] tracking-[0.2em]">2026</div>
          <p className="mt-2 text-zinc-500 text-sm">Ticket Registration</p>
        </div>

        {/* Event Info Banner */}
        <div className="bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-2xl p-5 mb-6">
          <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-3">🗓 Event Details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-zinc-500 text-xs">Date</p><p className="text-white font-medium">24th October 2026</p></div>
            <div><p className="text-zinc-500 text-xs">Time</p><p className="text-white font-medium">6:00 PM – 11:00 PM</p></div>
            <div><p className="text-zinc-500 text-xs">Venue</p><p className="text-white font-medium">Oak Ray Gatambe</p></div>
            <div><p className="text-zinc-500 text-xs">Dress Code</p><p className="text-white font-medium">Full Black, Smart Casual</p></div>
          </div>
        </div>

        {/* Ground Rules */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">📋 Ground Rules</p>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>🔒 <strong className="text-white">QR is personal</strong> — do not share it. One scan only.</li>
            <li>🎟 <strong className="text-white">No physical tickets</strong> — digital QR only at entry.</li>
            <li>🚭 <strong className="text-white">No smoking</strong> inside the hall.</li>
            <li>⛔ <strong className="text-white">No illegal substances</strong> on the premises.</li>
            <li>💸 <strong className="text-white">Damage policy</strong> — you break it, you pay for it.</li>
            <li>🪪 <strong className="text-white">NIC required</strong> at the entrance along with your QR.</li>
          </ul>
        </div>

        {/* Payment Instructions */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-3">💳 Payment Instructions</p>
          <ol className="space-y-3 text-sm text-zinc-400 list-decimal list-inside">
            <li>Transfer <strong className="text-white">LKR 6,500.00</strong> to the Vanguard 2026 bank account.</li>
            <li>When transferring, set your <strong className="text-white">reference/remark</strong> to exactly:
              <div className="mt-2 bg-black/60 border border-zinc-700 rounded-lg px-4 py-2 font-mono text-[#d4af37] text-sm tracking-wide">
                vanguard<span className="text-white">[your NIC number]</span>
              </div>
              <p className="mt-1.5 text-zinc-500 text-xs">Example: if your NIC is 200713102718, enter <code className="text-zinc-300">vanguard200713102718</code></p>
            </li>
            <li>Download and upload your <strong className="text-white">PDF receipt</strong> below.</li>
          </ol>
        </div>

        {/* Registration Form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-5">Your Details</h2>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm"
                  placeholder="As on your NIC" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">NIC Number</label>
                <input name="nic" value={form.nic} onChange={handleChange} required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm"
                  placeholder="200713102718" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Phone Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm"
                  placeholder="07XXXXXXXX" />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">Payment Receipt (PDF)</label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  file ? 'border-[#d4af37]/50 bg-[#d4af37]/5' : 'border-zinc-700 hover:border-zinc-500'
                }`}
                onClick={() => document.getElementById('receipt-upload')?.click()}
              >
                {file ? (
                  <div>
                    <div className="text-2xl mb-1">📄</div>
                    <p className="text-[#d4af37] text-sm font-medium">{file.name}</p>
                    <p className="text-zinc-500 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📎</div>
                    <p className="text-zinc-400 text-sm">Click to upload your bank receipt PDF</p>
                    <p className="text-zinc-600 text-xs mt-1">PDF files only</p>
                  </div>
                )}
                <input
                  id="receipt-upload"
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] hover:bg-[#f0d060] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-all duration-200 tracking-wide text-sm"
            >
              {loading ? 'Submitting & Verifying Receipt...' : 'Submit Registration'}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-6">
          VANGUARD 2026 · Oak Ray Gatambe · 24th October 2026
        </p>
      </div>
    </main>
  );
}
