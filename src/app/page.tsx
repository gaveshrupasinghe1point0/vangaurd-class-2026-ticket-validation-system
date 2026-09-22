import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#09090b] overflow-hidden grid-bg flex flex-col">
      {/* Ambient glow top */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#d4af37]/5 blur-[120px]" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="text-[#d4af37] font-bold tracking-[0.3em] text-sm uppercase">
          VG&apos;26
        </div>
        <Link
          href="/login"
          className="flex items-center gap-2 px-5 py-2 rounded-full border border-[#d4af37]/40 text-[#d4af37] text-sm font-medium hover:bg-[#d4af37]/10 transition-all duration-200"
        >
          Staff Login →
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6 py-20">
        {/* Event badge */}
        <div className="mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 text-[#d4af37] text-xs tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] animate-pulse" />
          Invite Only Event
        </div>

        {/* Main title */}
        <h1 className="text-[clamp(4rem,15vw,12rem)] font-black tracking-[-0.02em] leading-none text-white uppercase">
          VANGUARD
        </h1>
        <div className="text-[clamp(2rem,8vw,6rem)] font-black tracking-[0.15em] text-[#d4af37] leading-none -mt-2">
          2026
        </div>

        {/* Divider */}
        <div className="mt-10 mb-10 flex items-center gap-4 w-full max-w-xs">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#d4af37]/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37]" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#d4af37]/40" />
        </div>

        {/* Tagline */}
        <p className="text-zinc-400 text-lg tracking-[0.2em] uppercase font-light">
          The Night &nbsp;·&nbsp; The Legend &nbsp;·&nbsp; The Vibe
        </p>

        {/* Event details */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl w-full">
          {[
            { label: 'Access', value: 'Ticket Holders Only' },
            { label: 'Entry', value: 'QR Code Required' },
            { label: 'Status', value: 'Tickets Sold Out' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-1 px-6 py-5 rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm"
            >
              <span className="text-xs tracking-widest uppercase text-zinc-500">
                {item.label}
              </span>
              <span className="text-white font-semibold text-sm">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-zinc-600 text-xs tracking-widest">
        VANGUARD 2026 &mdash; ALL RIGHTS RESERVED
      </footer>

      {/* Bottom ambient glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#d4af37]/3 blur-[100px]" />
    </main>
  );
}
