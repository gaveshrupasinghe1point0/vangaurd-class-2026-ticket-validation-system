'use client';

import { useEffect, useRef } from 'react';

interface QRScannerProps {
  onScan: (token: string) => void;
  onError?: (error: string) => void;
  fullscreen?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Html5QrcodeInstance = any;

export default function QRScanner({ onScan, onError, fullscreen }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const containerId = 'qr-scanner-container';
  const hasScanned = useRef(false);

  useEffect(() => {
    hasScanned.current = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;

    async function initScanner() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;

        // Use full viewport width on mobile for a native feel
        const boxSize = Math.min(window.innerWidth * 0.65, 260);

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: boxSize, height: boxSize },
            aspectRatio: fullscreen
              ? window.innerHeight / window.innerWidth
              : 1.0,
          },
          (decodedText: string) => {
            if (hasScanned.current) return;
            hasScanned.current = true;
            scanner
              ?.stop()
              .catch(() => {})
              .finally(() => {
                onScan(decodedText.trim());
              });
          },
          () => {
            // Per-frame failures are normal — ignore
          }
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Camera error';
        const friendly = msg.toLowerCase().includes('permission')
          ? 'Camera permission denied. Please allow camera access and try again.'
          : msg.toLowerCase().includes('insecure')
          ? 'Camera requires HTTPS. Please use a secure connection.'
          : 'Could not access camera. Make sure nothing else is using it.';
        onError?.(friendly);
      }
    }

    initScanner();

    return () => {
      scanner?.stop().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id={containerId}
      className={fullscreen ? 'w-full h-full' : 'w-full'}
      style={fullscreen ? { minHeight: 'calc(100dvh - 120px)' } : undefined}
    />
  );
}
