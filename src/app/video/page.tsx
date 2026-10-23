'use client';

export default function DisplayScreenPage() {
  return (
    <main className="relative min-h-screen w-screen overflow-hidden flex flex-col justify-center items-center bg-black">
      {/* Background Video with Clean Ambient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/vanguard-landing-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Ambient glow top */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-[#d4af37]/15 blur-[140px] z-0" />

      {/* Hero Display Content without Date/Time/Venue/Staff Login/Register */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6">
        {/* Header Badge - enlarged as requested */}
        <div className="mb-6 inline-flex items-center px-6 py-2 rounded-full border border-[#d4af37]/40 bg-[#d4af37]/15 backdrop-blur-md text-[#d4af37] text-xs sm:text-base md:text-lg font-bold tracking-[0.25em] uppercase shadow-[0_0_30px_rgba(212,175,55,0.25)] whitespace-nowrap animate-pulse">
          Kingswood College Class of 2026
        </div>

        {/* Main title */}
        <h1 className="text-[clamp(4.5rem,18vw,14rem)] font-black tracking-[-0.02em] leading-none text-white uppercase drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]">
          VANGUARD
        </h1>
        <div className="text-[clamp(2.5rem,9.5vw,7.5rem)] font-black tracking-[0.18em] text-[#d4af37] leading-none mt-1 drop-shadow-[0_10px_25px_rgba(212,175,55,0.5)]">
          2026
        </div>

        {/* Divider */}
        <div className="mt-8 mb-6 flex items-center gap-4 w-full max-w-[280px]">
          <div className="flex-1 h-[2px] bg-gradient-to-r from-transparent to-[#d4af37]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] shadow-[0_0_12px_#d4af37]" />
          <div className="flex-1 h-[2px] bg-gradient-to-l from-transparent to-[#d4af37]/60" />
        </div>

        {/* Tagline */}
        <p className="text-zinc-200 text-sm sm:text-2xl md:text-3xl tracking-[0.25em] uppercase font-light drop-shadow-lg whitespace-nowrap">
          The Night &nbsp;·&nbsp; The Legend &nbsp;·&nbsp; The Vibe
        </p>
      </section>

      {/* Subdued Footer */}
      <footer className="absolute bottom-6 left-0 right-0 z-10 text-center text-zinc-400 text-xs sm:text-sm tracking-[0.25em] drop-shadow-md">
        VANGUARD 2026 &mdash; ALL RIGHTS RESERVED
      </footer>
    </main>
  );
}
