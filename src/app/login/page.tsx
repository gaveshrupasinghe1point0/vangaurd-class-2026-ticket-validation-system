'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    // Get role and redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profile?.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (profile?.role === 'sentinel') {
      router.push('/sentinel/scan');
    } else {
      setError('Account not configured. Contact an admin.');
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090b] grid-bg flex items-center justify-center px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#d4af37]/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Left — Event Info + Ground Rules */}
        <div className="space-y-5">
          {/* Logo */}
          <div className="mb-6">
            <div className="text-5xl font-black text-white tracking-tight">VANGUARD</div>
            <div className="text-2xl font-black text-[#d4af37] tracking-[0.2em]">2026</div>
          </div>

          {/* Event Details */}
          <div className="bg-[#d4af37]/10 border border-[#d4af37]/20 rounded-2xl p-5">
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-4">🗓 Event Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-zinc-500 text-xs mb-0.5">Date</p><p className="text-white font-medium">24th October 2026</p></div>
              <div><p className="text-zinc-500 text-xs mb-0.5">Time</p><p className="text-white font-medium">6:00 PM – 11:00 PM</p></div>
              <div><p className="text-zinc-500 text-xs mb-0.5">Venue</p><p className="text-white font-medium">Oak Ray Gatambe</p></div>
              <div><p className="text-zinc-500 text-xs mb-0.5">Dress Code</p><p className="text-white font-medium">Full Black, Smart Casual</p></div>
            </div>
          </div>

          {/* Ground Rules */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4">📋 Ground Rules</p>
            <ul className="space-y-2.5 text-sm text-zinc-400">
              <li className="flex items-start gap-2"><span>🔒</span><span><strong className="text-white">QR is personal</strong> — do not share it. One scan only at entry.</span></li>
              <li className="flex items-start gap-2"><span>🎟</span><span><strong className="text-white">No physical tickets</strong> — digital QR is the only form of entry.</span></li>
              <li className="flex items-start gap-2"><span>🚭</span><span><strong className="text-white">No smoking</strong> inside the hall at any time.</span></li>
              <li className="flex items-start gap-2"><span>⛔</span><span><strong className="text-white">No illegal substances</strong> on the premises.</span></li>
              <li className="flex items-start gap-2"><span>💸</span><span><strong className="text-white">Damage policy</strong> — if you break it, you pay for it.</span></li>
              <li className="flex items-start gap-2"><span>🪪</span><span><strong className="text-white">NIC required</strong> at the entrance with your QR code.</span></li>
            </ul>
          </div>
        </div>

        {/* Right — Staff Login Form */}
        <div>
          <p className="text-zinc-500 text-sm tracking-widest uppercase mb-4">Staff Portal</p>

          {/* Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 gold-glow">
            <h2 className="text-white font-semibold text-lg mb-6">Sign In</h2>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-zinc-400 text-sm mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] hover:bg-[#f0d060] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-xl transition-all duration-200 tracking-wide"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          </div>

          <p className="text-center text-zinc-600 text-xs mt-6 tracking-wider">
            VANGUARD 2026 · STAFF ONLY
          </p>
        </div>
      </div>
    </main>
  );
}
