import { createAdminClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import QRDisplay from '@/components/QRDisplay';

export default async function PublicTicketPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Use admin client because public visitors are not authenticated
  const supabase = createAdminClient();
  const { data: attendee } = await supabase
    .from('attendees')
    .select('*')
    .eq('qr_token', token)
    .single();

  if (!attendee) {
    notFound();
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center py-12 px-4 sm:px-6 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-[-5%] z-0 bg-cover bg-center bg-no-repeat fixed animate-ken-burns"
        style={{ backgroundImage: 'url(/vanguard-bg.jpg)' }}
      />
      <div className="absolute inset-0 z-0 bg-black/80 fixed" />
      
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#d4af37]/10 blur-[120px] z-0" />

      <div className="relative z-10 w-full max-w-md bg-black/30 backdrop-blur-xl border border-[#d4af37]/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        
        {/* Header */}
        <div className="bg-gradient-to-b from-black/60 to-transparent py-8 px-6 text-center border-b border-white/5">
          <h1 className="text-3xl font-bold tracking-[0.2em] text-[#d4af37] uppercase drop-shadow-lg">
            Vanguard
          </h1>
          <div className="text-xl font-bold tracking-[0.2em] text-[#d4af37] mt-1 drop-shadow-lg">
            2026
          </div>
          <p className="text-zinc-400 text-[10px] font-bold tracking-[0.3em] uppercase mt-3">
            Official Entry Ticket
          </p>
        </div>

        {/* Guest Info */}
        <div className="p-6 text-center">
          <p className="text-[#d4af37]/80 text-[10px] uppercase tracking-widest font-bold mb-1.5">Admit One</p>
          <h2 className="text-2xl font-bold text-white truncate px-4 drop-shadow-md">
            {attendee.full_name}
          </h2>
        </div>

        {/* QR Code Section */}
        <div className="px-6 pb-6 flex justify-center">
          <div className="p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl inline-block">
            <QRDisplay 
              token={attendee.qr_token} 
              attendeeName={attendee.full_name} 
              isUsed={attendee.qr_used} 
            />
          </div>
        </div>

        {/* Event Details */}
        <div className="px-6 pb-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-inner">
            <h3 className="text-[#d4af37] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
              🗓️ Event Details
            </h3>
            <div className="grid grid-cols-2 gap-y-5 gap-x-2 text-sm">
              <div>
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Date</p>
                <p className="text-white font-medium text-xs sm:text-sm">24th Oct 2026</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Time</p>
                <p className="text-white font-medium text-xs sm:text-sm">6:00 PM — 11:00 PM</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Venue</p>
                <p className="text-white font-medium text-xs sm:text-sm">Oak Ray Gatambe</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mb-1">Dress Code</p>
                <p className="text-white font-medium text-xs sm:text-sm">Full Black</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 pb-8">
          <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-inner">
            <h3 className="text-[#d4af37] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
              <span>⚠️</span> Important Instructions
            </h3>
            
            <ul className="space-y-3.5 text-xs text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="shrink-0 text-base leading-none">🔒</span>
                <span className="leading-snug"><strong className="text-white font-semibold">QR Code is Personal:</strong> Do not share it. It can only be scanned once.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 text-base leading-none">🎟️</span>
                <span className="leading-snug"><strong className="text-white font-semibold">Digital Only:</strong> No physical tickets. This QR code is the only entry form.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 text-base leading-none">🚭</span>
                <span className="leading-snug"><strong className="text-white font-semibold">No Smoking:</strong> Smoking is strictly prohibited inside the hall.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 text-base leading-none">⛔</span>
                <span className="leading-snug"><strong className="text-white font-semibold">No Illegal Substances:</strong> Zero tolerance on the premises.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 text-base leading-none">💸</span>
                <span className="leading-snug"><strong className="text-white font-semibold">Damage Policy:</strong> If you break anything, you are responsible for the cost.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 text-base leading-none">🪪</span>
                <span className="leading-snug"><strong className="text-white font-semibold">ID Required:</strong> Present your NIC along with this QR code at the entrance.</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gradient-to-t from-black/80 to-transparent py-5 text-center border-t border-white/5">
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold drop-shadow-md">Oak Ray Gatambe • 24th Oct 2026</p>
        </div>
      </div>
    </div>
  );
}
