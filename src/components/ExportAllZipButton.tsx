'use client';

import { useState } from 'react';
import { Download, Archive, Loader2 } from 'lucide-react';

export default function ExportAllZipButton() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch('/api/reports/export-all');

      if (!res.ok) {
        throw new Error('Failed to download ZIP');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vanguard-attendees-and-slips-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate ZIP archive. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(16,185,129,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {downloading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span>Generating ZIP Archive...</span>
        </>
      ) : (
        <>
          <Archive size={16} />
          <span>Download All Data &amp; Slips (ZIP)</span>
        </>
      )}
    </button>
  );
}
