'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [showWarningModal, setShowWarningModal] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0 z-0 fixed overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/vanguard-landing-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/65" />
      </div>

      {/* Ambient glow top */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#d4af37]/10 blur-[120px] z-0" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5">
        <div className="text-[#d4af37] font-bold tracking-[0.3em] text-sm uppercase">
          VG&apos;26
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d4af37]/40 bg-black/30 backdrop-blur-md text-[#d4af37] text-xs font-medium hover:bg-[#d4af37]/10 transition-all duration-200"
        >
          Staff Login →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-5 pb-8">
        {/* Header Badge */}
        <div className="mb-5 inline-flex items-center px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 backdrop-blur-md text-[#d4af37] text-[10px] sm:text-sm font-semibold tracking-widest uppercase shadow-[0_0_20px_rgba(212,175,55,0.1)] whitespace-nowrap">
          Kingswood College Class of 2026
        </div>

        {/* Main title */}
        <h1 className="text-[clamp(3.5rem,18vw,12rem)] font-black tracking-[-0.02em] leading-none text-white uppercase drop-shadow-2xl">
          VANGUARD
        </h1>
        <div className="text-[clamp(1.8rem,9vw,6rem)] font-black tracking-[0.15em] text-[#d4af37] leading-none -mt-1 drop-shadow-lg">
          2026
        </div>

        {/* Divider */}
        <div className="mt-6 mb-5 flex items-center gap-4 w-full max-w-[200px]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#d4af37]/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#d4af37]/40" />
        </div>

        {/* Tagline — nowrap so it never breaks */}
        <p className="text-zinc-300 text-xs sm:text-lg tracking-[0.15em] uppercase font-light drop-shadow-md whitespace-nowrap">
          The Night &nbsp;·&nbsp; The Legend &nbsp;·&nbsp; The Vibe
        </p>

        {/* Register Button */}
        <div className="mt-8 mb-2">
          <button
            onClick={() => setShowWarningModal(true)}
            className="inline-block px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#d4af37] hover:bg-[#f0d060] text-black font-bold text-base sm:text-lg tracking-wider uppercase transition-all shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] active:scale-95"
          >
            Register for Event
          </button>
        </div>

        {/* Event details — horizontal row on mobile */}
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-6 max-w-3xl w-full">
          {[
            { label: 'Date', value: '24th Oct 2026', icon: <Calendar size={16} className="text-white/60 mb-0.5" /> },
            { label: 'Time', value: '6:00 PM – 11:00 PM', icon: <Clock size={16} className="text-white/60 mb-0.5" /> },
            { label: 'Venue', value: 'Oak Ray Gatambe', icon: <MapPin size={16} className="text-white/60 mb-0.5" /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-1 px-2 sm:px-6 py-3 sm:py-5 rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl"
            >
              <div className="flex items-center justify-center">{item.icon}</div>
              <span className="text-[8px] sm:text-[10px] tracking-widest uppercase text-[#d4af37] font-bold">
                {item.label}
              </span>
              <span className="text-white font-medium text-[10px] sm:text-base text-center leading-snug">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-zinc-500 text-[10px] tracking-widest drop-shadow-md bg-gradient-to-t from-black/80 to-transparent">
        VANGUARD 2026 &mdash; ALL RIGHTS RESERVED
      </footer>

      {/* Warning Modal before Registration */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowWarningModal(false)} />
          <div className="relative bg-zinc-900 border-2 border-red-500 rounded-2xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Important!</h3>
              <p className="text-red-400 font-bold text-base mb-4 uppercase tracking-wide">Read Before Paying</p>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left w-full">
                <p className="text-zinc-300 text-sm leading-relaxed mb-3">
                  When transferring the ticket fee to the bank account, you <strong className="text-white">MUST</strong> enter your <strong className="text-white">NIC number</strong> as the bank reference/remark.
                </p>
                <p className="text-zinc-400 text-xs">
                  Your payment will <strong className="text-red-400">NOT</strong> be verified if the reference is missing or incorrect.
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => router.push('/register')}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3.5 rounded-xl transition-all shadow-lg shadow-red-500/20"
                >
                  I UNDERSTAND, PROCEED
                </button>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
