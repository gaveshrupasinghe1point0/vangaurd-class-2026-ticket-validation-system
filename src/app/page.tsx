import Link from 'next/link';
import { Calendar, Clock, MapPin } from 'lucide-react';

export default function LandingPage() {
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
          <Link
            href="/register"
            className="inline-block px-8 py-3.5 sm:px-10 sm:py-4 rounded-full bg-[#d4af37] hover:bg-[#f0d060] text-black font-bold text-base sm:text-lg tracking-wider uppercase transition-all shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] active:scale-95"
          >
            Register for Event
          </Link>
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
    </main>
  );
}
