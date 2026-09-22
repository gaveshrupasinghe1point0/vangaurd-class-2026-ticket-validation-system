'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, QrCode } from 'lucide-react';

interface QRDisplayProps {
  token: string;
  attendeeName: string;
  isUsed: boolean;
}

export default function QRDisplay({ token, attendeeName, isUsed }: QRDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 320,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setQrDataUrl);
  }, [token]);

  function handleDownload() {
    const link = document.createElement('a');
    link.download = `vanguard-2026-${attendeeName.replace(/\s+/g, '-')}.png`;
    link.href = qrDataUrl;
    link.click();
  }

  if (!qrDataUrl) {
    return (
      <div className="flex items-center justify-center aspect-square bg-zinc-800 rounded-xl">
        <QrCode size={40} className="text-zinc-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR code image */}
      <div
        className={`relative rounded-2xl overflow-hidden border-2 ${
          isUsed ? 'border-green-500/50 opacity-60' : 'border-white/10'
        }`}
      >
        <img
          src={qrDataUrl}
          alt={`QR code for ${attendeeName}`}
          className="w-full block"
        />
        {isUsed && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
            <div className="bg-green-500 text-black font-black text-xs px-3 py-1.5 rounded-full tracking-widest uppercase transform -rotate-12">
              Used
            </div>
          </div>
        )}
      </div>

      {/* Token preview */}
      <div className="w-full px-3 py-2 bg-zinc-800 rounded-lg">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-0.5">
          Token
        </p>
        <p className="text-zinc-400 text-[10px] font-mono break-all leading-relaxed">
          {token}
        </p>
      </div>

      {/* Download button */}
      {!isUsed && (
        <button
          onClick={handleDownload}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 text-[#d4af37] hover:bg-[#d4af37]/10 hover:border-[#d4af37]/50 transition-all text-sm font-medium"
        >
          <Download size={16} />
          Download QR Code
        </button>
      )}
    </div>
  );
}
