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
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md bg-[#111111] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-black py-8 px-6 text-center border-b border-zinc-800">
          <h1 className="text-3xl font-bold tracking-[0.2em] text-[#d4af37] uppercase">
            Vanguard
          </h1>
          <div className="text-xl font-bold tracking-[0.2em] text-[#d4af37] mt-1">
            2026
          </div>
          <p className="text-zinc-500 text-xs tracking-widest uppercase mt-3">
            Official Entry Ticket
          </p>
        </div>

        {/* Guest Info */}
        <div className="p-6 text-center">
          <p className="text-zinc-400 text-sm mb-1">Admit One</p>
          <h2 className="text-2xl font-bold text-white truncate px-4">
            {attendee.full_name}
          </h2>
        </div>

        {/* QR Code Section */}
        <div className="px-6 pb-6 flex justify-center">
          <QRDisplay 
            token={attendee.qr_token} 
            attendeeName={attendee.full_name} 
            isUsed={attendee.qr_used} 
          />
        </div>

        {/* Event Details */}
        <div className="px-6 pb-6">
          <div className="bg-[#d4af37]/10 rounded-xl p-5 border border-[#d4af37]/20">
            <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              🗓️ Event Details
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <p className="text-[#d4af37]/70 text-[10px] uppercase tracking-wider mb-0.5">Date</p>
                <p className="text-white font-medium">24th Oct 2026</p>
              </div>
              <div>
                <p className="text-[#d4af37]/70 text-[10px] uppercase tracking-wider mb-0.5">Time</p>
                <p className="text-white font-medium">6:00 PM — 11:00 PM</p>
              </div>
              <div>
                <p className="text-[#d4af37]/70 text-[10px] uppercase tracking-wider mb-0.5">Venue</p>
                <p className="text-white font-medium">Oak Ray Gatambe</p>
              </div>
              <div>
                <p className="text-[#d4af37]/70 text-[10px] uppercase tracking-wider mb-0.5">Dress Code</p>
                <p className="text-white font-medium">Full Black</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 pb-8">
          <div className="bg-black/50 rounded-xl p-5 border border-zinc-800/50">
            <h3 className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <span>⚠️</span> Important Instructions
            </h3>
            
            <ul className="space-y-3 text-sm text-zinc-400">
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-zinc-300">🔒</span>
                <span><strong className="text-white">QR Code is Personal:</strong> Do not share it. It can only be scanned once.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-zinc-300">🎟️</span>
                <span><strong className="text-white">Digital Only:</strong> No physical tickets. This digital QR code is the only form of entry.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-zinc-300">🚭</span>
                <span><strong className="text-white">No Smoking:</strong> Smoking is strictly prohibited inside the hall.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-zinc-300">⛔</span>
                <span><strong className="text-white">No Illegal Substances:</strong> Zero tolerance for illegal substances on the premises.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-zinc-300">💸</span>
                <span><strong className="text-white">Damage Policy:</strong> If you break anything, you are responsible for the cost.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="shrink-0 mt-0.5 text-zinc-300">🪪</span>
                <span><strong className="text-white">ID Required:</strong> Present your NIC along with this QR code at the entrance.</span>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-black py-4 text-center border-t border-zinc-800">
          <p className="text-zinc-600 text-xs">Oak Ray Gatambe • 24th Oct 2026</p>
        </div>
      </div>
    </div>
  );
}
