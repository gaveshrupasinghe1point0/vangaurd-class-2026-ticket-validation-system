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
          poster="/vanguard-bg.jpg"
        >
          <source src="/vanguard-landing-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Ambient glow top */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#d4af37]/10 blur-[120px] z-0" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="text-[#d4af37] font-bold tracking-[0.3em] text-sm uppercase">
          VG&apos;26
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#d4af37]/40 bg-black/30 backdrop-blur-md text-[#d4af37] text-sm font-medium hover:bg-[#d4af37]/10 transition-all duration-200"
        >
          Staff Login →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6 py-10">
        {/* Header Badge */}
        <div className="mb-6 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/10 backdrop-blur-md text-[#d4af37] text-xs sm:text-sm font-semibold tracking-widest uppercase shadow-[0_0_20px_rgba(212,175,55,0.1)]">
          Kingswood College Class of 2026
        </div>

        {/* Main title */}
        <h1 className="text-[clamp(4rem,15vw,12rem)] font-black tracking-[-0.02em] leading-none text-white uppercase drop-shadow-2xl">
          VANGUARD
        </h1>
        <div className="text-[clamp(2rem,8vw,6rem)] font-black tracking-[0.15em] text-[#d4af37] leading-none -mt-2 drop-shadow-lg">
          2026
        </div>

        {/* Divider */}
        <div className="mt-8 mb-8 flex items-center gap-4 w-full max-w-xs">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#d4af37]/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#d4af37]/40" />
        </div>

        {/* Tagline */}
        <p className="text-zinc-300 text-sm sm:text-lg tracking-[0.2em] uppercase font-light drop-shadow-md">
          The Night &nbsp;·&nbsp; The Legend &nbsp;·&nbsp; The Vibe
        </p>

        {/* Register Button */}
        <div className="mt-12 mb-4">
          <Link
            href="/register"
            className="inline-block px-10 py-4 rounded-full bg-[#d4af37] hover:bg-[#f0d060] text-black font-bold text-lg tracking-wider uppercase transition-all shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_60px_rgba(212,175,55,0.6)] hover:scale-105"
          >
            Register for Event
          </Link>
        </div>

        {/* Event details */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl w-full">
          {[
            { label: 'Date', value: '24th Oct 2026', icon: <Calendar size={20} className="text-white/60 mb-1" /> },
            { label: 'Time', value: '6:00 PM – 11:00 PM', icon: <Clock size={20} className="text-white/60 mb-1" /> },
            { label: 'Venue', value: 'Oak Ray Gatambe', icon: <MapPin size={20} className="text-white/60 mb-1" /> },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 px-6 py-5 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-xl hover:bg-black/60 transition-all"
            >
              <div className="flex items-center justify-center">{item.icon}</div>
              <span className="text-[10px] tracking-widest uppercase text-[#d4af37] font-bold">
                {item.label}
              </span>
              <span className="text-white font-medium text-sm sm:text-base text-center">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-zinc-500 text-[10px] tracking-widest drop-shadow-md bg-gradient-to-t from-black/80 to-transparent">
        VANGUARD 2026 &mdash; ALL RIGHTS RESERVED
      </footer>
    </main>
  );
}
