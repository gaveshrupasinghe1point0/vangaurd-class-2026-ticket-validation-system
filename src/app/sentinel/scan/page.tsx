'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QRScanner from '@/components/QRScanner';
import type { ScanResult } from '@/types';
import { CheckCircle2, XCircle, ScanLine, RotateCcw, ChevronRight } from 'lucide-react';

function SentinelScanContent() {
  const searchParams = useSearchParams();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState('');

  const handleScan = useCallback(
    async (scannedText: string) => {
      if (loading) return;
      setScanning(false);
      setLoading(true);

      // If the QR code is a full URL, extract just the token part
      let token = scannedText;
      try {
        if (scannedText.startsWith('http')) {
          const url = new URL(scannedText);
          const urlToken = url.searchParams.get('token');
          if (urlToken) token = urlToken;
        }
      } catch (e) {
        // Not a URL, use raw text
      }

      try {
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data: ScanResult = await res.json();
        setResult(data);
      } catch {
        setResult({
          status: 'invalid',
          message: 'Network error. Please try again.',
        });
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  // Auto-scan if a token is in the URL (e.g. native camera opened the app)
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken && !result && !loading) {
      handleScan(urlToken);
    }
  }, [searchParams, handleScan, result, loading]);

  function reset() {
    setResult(null);
    setScanning(false);
    setCameraError('');
    // Clear URL without reloading page
    window.history.replaceState({}, '', '/sentinel/scan');
  }

  /* ── LOADING ─────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-57px)] bg-[#09090b] p-6">
        <div className="w-16 h-16 rounded-full border-4 border-[#d4af37]/20 border-t-[#d4af37] animate-spin mb-5" />
        <p className="text-zinc-400 text-base tracking-wider">Verifying…</p>
      </div>
    );
  }

  /* ── RESULT ──────────────────────────────────────── */
  if (result) {
    const isGranted = result.status === 'granted';
    const isDenied  = result.status === 'already_used';

    return (
      <div
        className={`min-h-[calc(100dvh-57px)] flex flex-col ${
          isGranted ? 'bg-green-950' : 'bg-red-950'
        }`}
      >
        {/* Big status banner — takes up top half of screen */}
        <div
          className={`flex-1 flex flex-col items-center justify-center px-6 py-10 text-center border-b-2 ${
            isGranted ? 'border-green-500' : 'border-red-500'
          }`}
        >
          {isGranted ? (
            <>
              <CheckCircle2 size={88} className="text-green-400 mb-4" />
              <div className="text-green-300 text-4xl font-black tracking-wide leading-tight">
                ENTRY<br />GRANTED
              </div>
              <div className="mt-3 px-4 py-1.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 text-sm font-bold tracking-widest">
                ✓ LET THEM IN
              </div>
            </>
          ) : isDenied ? (
            <>
              <XCircle size={88} className="text-red-400 mb-4" />
              <div className="text-red-300 text-4xl font-black tracking-wide leading-tight">
                ALREADY<br />MARKED
              </div>
              <div className="mt-3 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-bold tracking-widest">
                ⚠️ DO NOT LET IN
              </div>
            </>
          ) : (
            <>
              <XCircle size={88} className="text-red-400 mb-4" />
              <div className="text-red-300 text-4xl font-black tracking-wide leading-tight">
                INVALID<br />QR CODE
              </div>
              <div className="mt-3 text-red-400/70 text-sm">
                {result.message}
              </div>
            </>
          )}
        </div>

        {/* Attendee info card — bottom half */}
        {result.attendee && (
          <div className="px-5 py-6 space-y-4">
            <Row label="Name"  value={result.attendee.full_name} large />
            <div className="grid grid-cols-2 gap-4">
              <Row label="NIC"   value={result.attendee.nic}   mono />
              <Row label="Phone" value={result.attendee.phone} />
            </div>
            <Row label="Email" value={result.attendee.email} />
          </div>
        )}

        {/* Scan next button — always at bottom */}
        <div className="px-5 pb-8 pt-2">
          <button
            onClick={reset}
            className={`w-full flex items-center justify-center gap-2 py-5 rounded-2xl font-black text-lg tracking-wide transition-all active:scale-95 ${
              isGranted
                ? 'bg-green-500 text-black'
                : 'bg-red-500 text-white'
            }`}
          >
            <RotateCcw size={20} />
            Scan Next Person
          </button>
        </div>
      </div>
    );
  }

  /* ── SCANNER / IDLE ──────────────────────────────── */
  if (scanning) {
    return (
      // Full screen camera — feels native
      <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ top: 57 }}>
        {/* Cancel bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm">
          <p className="text-zinc-400 text-sm">Point camera at the QR code</p>
          <button
            onClick={() => setScanning(false)}
            className="text-[#d4af37] font-semibold text-sm px-3 py-1 rounded-lg border border-[#d4af37]/30 active:bg-[#d4af37]/10"
          >
            Cancel
          </button>
        </div>

        {/* Full screen camera feed */}
        <div className="flex-1 relative overflow-hidden">
          <QRScanner
            onScan={handleScan}
            onError={(err) => {
              setCameraError(err);
              setScanning(false);
            }}
            fullscreen
          />

          {/* Corner guide overlay */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-64">
              {/* Dimmed overlay around the box */}
              <div className="absolute -inset-[100vw] bg-black/50" />
              <div className="absolute inset-0 bg-transparent" />
              {/* Corner brackets */}
              {[
                'top-0 left-0 border-t-4 border-l-4',
                'top-0 right-0 border-t-4 border-r-4',
                'bottom-0 left-0 border-b-4 border-l-4',
                'bottom-0 right-0 border-b-4 border-r-4',
              ].map((cls, i) => (
                <div key={i} className={`absolute w-10 h-10 border-[#d4af37] ${cls}`} />
              ))}
              {/* Scan line animation */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-[#d4af37]/70 animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── IDLE / HOME ─────────────────────────────────── */
  return (
    <div className="min-h-[calc(100dvh-57px)] flex flex-col items-center justify-center bg-[#09090b] px-6">
      {/* Icon */}
      <div className="w-28 h-28 rounded-3xl bg-[#d4af37]/10 border-2 border-[#d4af37]/20 flex items-center justify-center text-[#d4af37] mb-8">
        <ScanLine size={56} />
      </div>

      <h2 className="text-white font-black text-2xl mb-2 tracking-tight">
        QR Scanner
      </h2>
      <p className="text-zinc-500 text-sm text-center mb-10 max-w-xs leading-relaxed">
        Tap below to open your camera and scan an attendee&apos;s QR code
      </p>

      {cameraError && (
        <div className="w-full max-w-xs mb-6 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
          {cameraError}
        </div>
      )}

      {/* Big tap target — easy for bouncers in the dark */}
      <button
        onClick={() => setScanning(true)}
        className="w-full max-w-xs bg-[#d4af37] active:bg-[#f0d060] text-black font-black py-5 rounded-2xl text-xl transition-all active:scale-95 flex items-center justify-center gap-3"
      >
        <ScanLine size={24} />
        Start Scanning
        <ChevronRight size={20} />
      </button>

      <p className="text-zinc-700 text-xs mt-8 text-center">
        Camera permission required
      </p>
    </div>
  );
}

export default function SentinelScanPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-[#09090b] flex items-center justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#d4af37]/20 border-t-[#d4af37] animate-spin" /></div>}>
      <SentinelScanContent />
    </Suspense>
  );
}

function Row({
  label,
  value,
  mono,
  large,
}: {
  label: string;
  value: string;
  mono?: boolean;
  large?: boolean;
}) {
  return (
    <div>
      <div className="text-zinc-500 text-xs uppercase tracking-widest mb-0.5">
        {label}
      </div>
      <div
        className={`text-white font-semibold break-all ${
          large ? 'text-xl' : 'text-base'
        } ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
    </div>
  );
}
