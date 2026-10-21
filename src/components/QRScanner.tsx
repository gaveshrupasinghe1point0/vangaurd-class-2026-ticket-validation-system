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

        // Use a much larger scan region so the QR can be detected
        // from further away and at various angles / distances.
        // A bigger qrbox means the decoder analyses more of the frame,
        // which dramatically improves range and speed.
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const boxSize = fullscreen
          ? Math.min(vw * 0.85, vh * 0.55, 400)
          : Math.min(vw * 0.80, 350);

        await scanner.start(
          { facingMode: 'environment' },
          {
            // 30 fps = twice the decode attempts per second vs the old 15 fps.
            // Modern phones handle this easily.
            fps: 30,
            qrbox: { width: boxSize, height: boxSize },
            aspectRatio: fullscreen
              ? window.innerHeight / window.innerWidth
              : 1.0,
            // Request the highest resolution the rear camera supports.
            // Higher res = readable from further away.
            videoConstraints: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            // Disable the shaded region around the scan box so the
            // full camera frame is visible (less confusing for the user).
            disableFlip: false,
          },
          (decodedText: string) => {
            if (hasScanned.current) return;
            hasScanned.current = true;
            try {
              scanner
                ?.stop()
                .catch(() => {})
                .finally(() => {
                  onScan(decodedText.trim());
                });
            } catch (e) {
              onScan(decodedText.trim());
            }
          },
          () => {
            // Per-frame failures are normal — ignore
          }
        );

        // After scanner starts, apply autofocus continuously if supported.
        // This is the #1 reason phones struggle with QR codes — the camera
        // locks focus at one distance and can't re-adjust.
        try {
          const videoEl = document.querySelector(`#${containerId} video`) as HTMLVideoElement | null;
          if (videoEl?.srcObject) {
            const track = (videoEl.srcObject as MediaStream).getVideoTracks()[0];
            const capabilities = track?.getCapabilities?.() as Record<string, unknown> | undefined;
            if (capabilities && 'focusMode' in capabilities) {
              const supportedModes = capabilities.focusMode as string[];
              if (Array.isArray(supportedModes) && supportedModes.includes('continuous')) {
                await track.applyConstraints({
                  // @ts-expect-error — focusMode is valid but not in TS types
                  advanced: [{ focusMode: 'continuous' }],
                });
              }
            }
          }
        } catch {
          // Autofocus tweak is best-effort; ignore failures silently
        }
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
      try {
        if (scannerRef.current) {
          scannerRef.current.stop().catch(() => {});
        }
      } catch (e) {
        // Ignore synchronous throws during unmount
      }
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
