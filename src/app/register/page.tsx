'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// Utility to compress images on the client side before upload
const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        // Max 1200px on longest edge
        const MAX_SIZE = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          
          const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        }, 'image/jpeg', 0.7); // 70% quality JPEG
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ full_name: '', nic: '', phone: '', email: '' });
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (success) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [success]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [error]);

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError('Please upload your bank payment receipt (PDF or Image).'); return; }
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png)$/)) {
      setError('Only PDF, JPG, and PNG files are accepted.'); 
      return; 
    }

    // Validate NIC format: either 9 digits + V/X (old) or exactly 12 digits (new)
    const nicClean = form.nic.trim().toUpperCase();
    const validNIC = /^\d{9}[VX]$/.test(nicClean) || /^\d{12}$/.test(nicClean);
    if (!validNIC) {
      setError('Invalid NIC format. Enter either 9 digits followed by V or X (e.g. 891234567V) or 12 digits (e.g. 200713102718).');
      return;
    }

    // Validate phone: must be a Sri Lankan number (start with 0 or 7, 10 digits)
    const phoneClean = form.phone.trim().replace(/\s/g, '');
    const validPhone = /^(0\d{9}|\d{9})$/.test(phoneClean);
    if (!validPhone) {
      setError('Invalid WhatsApp number. Enter a valid Sri Lankan mobile number (e.g. 0771234567).');
      return;
    }

    setLoading(true);
    setError('');

    let finalFile = file;
    try {
      finalFile = await compressImage(file);
    } catch (e) {
      console.warn("Compression failed, using original", e);
    }

    const data = new FormData();
    data.append('full_name', form.full_name.trim());
    data.append('nic', form.nic.trim());
    data.append('phone', form.phone.trim());
    data.append('email', form.email.trim());
    data.append('receipt', finalFile);

    const res = await fetch('/api/register', { method: 'POST', body: data });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error || 'Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <main className={`min-h-screen relative flex ${success ? 'items-center' : 'flex-col items-center py-10'} justify-center px-4 overflow-hidden`}>
      {/* Background Video with Overlay - Kept mounted to prevent reload delay */}
      <div className="absolute inset-0 z-0 fixed overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/vanguard-bg-video.mp4" type="video/mp4" />
        </video>
        <div className={`absolute inset-0 transition-colors duration-500 ${success ? 'bg-black/80 backdrop-blur-sm' : 'bg-[#09090b]/80'}`} />
      </div>

      {success ? (
        <>
        <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#d4af37]/10 blur-[120px] z-0" />
        
        <div className="relative z-10 w-full max-w-md text-center animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.2)]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Registration Received!</h1>
          <p className="text-zinc-300 text-sm leading-relaxed mb-6">
            Your payment receipt has been submitted and is under review. Once your payment is verified, you will receive your QR code ticket via WhatsApp.
          </p>
          <div className="bg-black/60 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-5 text-left mb-6 shadow-xl">
            <p className="text-[#d4af37] text-xs font-bold uppercase tracking-widest mb-3">⏳ What happens next?</p>
            <ol className="space-y-2 text-sm text-zinc-300 list-decimal list-inside">
              <li>Your receipt is checked against bank records</li>
              <li>Payment is confirmed (usually within a few hours)</li>
              <li>You receive your personal QR ticket on WhatsApp</li>
              <li>Present the QR at the entrance on event day</li>
            </ol>
          </div>
          <p className="text-zinc-400 text-xs font-medium">Questions? Contact the Vanguard 2026 team.</p>
        </div>
        </>
      ) : (
        <>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#d4af37]/10 blur-[120px] z-0" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-2 sm:px-0 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-0">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">VANGUARD</div>
          <div className="text-lg sm:text-xl font-black text-[#d4af37] tracking-[0.2em]">2026</div>
          <p className="mt-2 text-zinc-400 text-xs sm:text-sm">Ticket Registration</p>
        </div>

        {/* Event Info Banner */}
        <div className="bg-white/5 backdrop-blur-sm border border-[#d4af37]/15 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
          <p className="text-[#d4af37] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">🗓 Event Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex justify-between sm:block border-b border-white/5 sm:border-0 pb-2 sm:pb-0"><p className="text-zinc-400 text-xs sm:mb-1">Date</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">24th Oct 2026</p></div>
            <div className="flex justify-between sm:block border-b border-white/5 sm:border-0 pb-2 sm:pb-0"><p className="text-zinc-400 text-xs sm:mb-1">Time</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">6:00 PM – 11:00 PM</p></div>
            <div className="flex justify-between sm:block border-b border-white/5 sm:border-0 pb-2 sm:pb-0"><p className="text-zinc-400 text-xs sm:mb-1">Venue</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">Oak Ray Gatambe</p></div>
            <div className="flex justify-between sm:block"><p className="text-zinc-400 text-xs sm:mb-1">Dress Code</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">Full Black, Smart Casual</p></div>
          </div>
        </div>

        {/* Ground Rules */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
          <p className="text-zinc-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">📋 Ground Rules</p>
          <ul className="space-y-2.5 sm:space-y-2 text-xs sm:text-sm text-zinc-300">
            <li className="flex gap-2"><span>🔒</span><span><strong className="text-white">QR is personal</strong> — do not share it. One scan only.</span></li>
            <li className="flex gap-2"><span>🎟</span><span><strong className="text-white">No physical tickets</strong> — digital QR only at entry.</span></li>
            <li className="flex gap-2"><span>🚭</span><span><strong className="text-white">No smoking</strong> inside the hall.</span></li>
            <li className="flex gap-2"><span>⛔</span><span><strong className="text-white">No illegal substances</strong> on the premises.</span></li>
            <li className="flex gap-2"><span>💸</span><span><strong className="text-white">Damage policy</strong> — you break it, you pay for it.</span></li>
            <li className="flex gap-2"><span>🪪</span><span><strong className="text-white">NIC required</strong> at entrance with your QR.</span></li>
          </ul>
        </div>

        {/* Payment Instructions */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
          <p className="text-zinc-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">💳 Payment Instructions</p>
          
          {/* Bank Account Details */}
          <div className="bg-[#d4af37]/5 border border-[#d4af37]/30 rounded-xl p-4 mb-4">
            <p className="text-[#d4af37] text-[10px] font-bold uppercase tracking-widest mb-3">🏦 Bank Account Details</p>
            <div className="space-y-2.5 text-xs sm:text-sm">

              {/* Bank — no copy */}
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 shrink-0 w-32">Bank</p>
                <p className="text-white font-semibold text-right">HNB (Hatton National Bank)</p>
              </div>

              {/* Account Name — copy */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-zinc-400 shrink-0 w-32">Account Name</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold">MAGG Rupasinghe</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('MAGG Rupasinghe', 'name')}
                    className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all duration-200 border-zinc-600 text-zinc-400 hover:border-[#d4af37]/50 hover:text-[#d4af37]"
                  >
                    {copied === 'name' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Account Number — copy */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-zinc-400 shrink-0 w-32">Account Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-mono font-semibold tracking-wide">223020164563</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('223020164563', 'accno')}
                    className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all duration-200 border-zinc-600 text-zinc-400 hover:border-[#d4af37]/50 hover:text-[#d4af37]"
                  >
                    {copied === 'accno' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Branch — copy */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-zinc-400 shrink-0 w-32">Branch</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-semibold">Peradeniya</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('Peradeniya', 'branch')}
                    className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all duration-200 border-zinc-600 text-zinc-400 hover:border-[#d4af37]/50 hover:text-[#d4af37]"
                  >
                    {copied === 'branch' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          <ol className="space-y-4 sm:space-y-3 text-xs sm:text-sm text-zinc-300 list-decimal list-inside">
            <li>Transfer <strong className="text-white">LKR 7,000.00</strong> to the account above.</li>
            <li>
              {/* Highlighted reference step */}
              <div className="mt-2 bg-amber-500/10 border border-amber-500/40 rounded-xl p-3 sm:p-4 -ml-4">
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-2">⚠️ Important — Reference / Remark</p>
                <p className="text-zinc-200 text-xs sm:text-sm mb-2 leading-relaxed">
                  When making the transfer, you <strong className="text-white">must</strong> set the reference/remark field to your <strong className="text-white">NIC number</strong>. Without this, your payment cannot be verified.
                </p>
                <div className="bg-black/60 border border-zinc-600 rounded-lg px-3 sm:px-4 py-2 font-mono text-[#d4af37] text-xs sm:text-sm tracking-wide shadow-inner overflow-hidden text-ellipsis whitespace-nowrap">
                  <span className="text-white">[your NIC]</span>
                </div>
                <p className="mt-1.5 text-zinc-400 text-[10px] sm:text-xs leading-relaxed">Example: if your NIC is 200713102718, enter <code className="text-zinc-200 bg-zinc-800/50 px-1 py-0.5 rounded">200713102718</code></p>
              </div>
            </li>
            <li>Download and upload your <strong className="text-white">PDF or Image receipt</strong> below.</li>
          </ol>
        </div>

        {/* Registration Form */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-5">Your Details</h2>

          {error && (
            <div ref={errorRef} className="mb-4 sm:mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm">
              {error.includes('already registered') ? (
                <div className="flex flex-col gap-2">
                  <p>{error}</p>
                  <a
                    href="https://wa.me/94755494649?text=Hi%2C+my+NIC+is+already+registered+but+I+need+help."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Contact Admin on WhatsApp
                  </a>
                </div>
              ) : error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-300 text-xs sm:text-sm font-medium mb-1.5">Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} required
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm shadow-inner"
                  placeholder="Your full name" />
              </div>
              <div>
                <label className="block text-zinc-300 text-xs sm:text-sm font-medium mb-1.5">NIC Number</label>
                <input name="nic" value={form.nic} onChange={handleChange} required
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm shadow-inner"
                  placeholder="200713102718" />
              </div>
              <div>
                <label className="block text-zinc-300 text-xs sm:text-sm font-medium mb-1.5">WhatsApp Number</label>
                <input name="phone" value={form.phone} onChange={handleChange} required
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm shadow-inner"
                  placeholder="07XXXXXXXX" />
              </div>
              <div>
                <label className="block text-zinc-300 text-xs sm:text-sm font-medium mb-1.5">Email Address</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required
                  className="w-full bg-zinc-900/80 border border-zinc-700/80 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/60 focus:ring-1 focus:ring-[#d4af37]/30 transition-all text-sm shadow-inner"
                  placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-zinc-300 text-xs sm:text-sm font-medium mb-1.5 mt-2 sm:mt-0">Payment Receipt (PDF or Image)</label>
              <div
                className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center transition-all cursor-pointer ${
                  file ? 'border-[#d4af37]/50 bg-[#d4af37]/10' : 'border-zinc-700/80 bg-zinc-900/50 hover:border-zinc-500/80'
                }`}
                onClick={() => document.getElementById('receipt-upload')?.click()}
              >
                {file ? (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl sm:text-3xl mb-2">{file.type.startsWith('image/') ? '🖼️' : '📄'}</div>
                    <p className="text-[#d4af37] text-xs sm:text-sm font-medium truncate w-full px-2 max-w-[250px] sm:max-w-xs">{file.name}</p>
                    <p className="text-zinc-400 text-[10px] sm:text-xs mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 opacity-80">📎</div>
                    <p className="text-zinc-300 text-xs sm:text-sm font-medium">Upload bank receipt</p>
                    <p className="text-zinc-500 text-[10px] sm:text-xs mt-1">PDF, JPG, or PNG</p>
                  </div>
                )}
                <input
                  id="receipt-upload"
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/jpg"
                  className="hidden"
                  onChange={e => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
                      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().match(/\.(pdf|jpg|jpeg|png)$/)) {
                        setError('Invalid file type. Please upload a PDF or image receipt.');
                        setFile(null);
                        e.target.value = ''; // Reset input
                      } else {
                        setError(''); // Clear any previous errors
                        setFile(selectedFile);
                      }
                    }
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#d4af37] hover:bg-[#f0d060] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-all duration-200 tracking-wide text-sm mt-4 shadow-lg shadow-[#d4af37]/20"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </form>
        </div>

        <div className="mt-5 mb-4 sm:mb-0 text-center space-y-3">
          <a
            href="https://wa.me/94755494649?text=Hi%2C+I+need+help+with+my+Vanguard+2026+registration."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-green-500/30 bg-green-500/5 text-green-400 hover:bg-green-500/10 hover:border-green-500/50 transition-all text-sm font-medium shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Need help? Chat on WhatsApp
          </a>
          <p className="text-zinc-600 text-[10px] drop-shadow-md">
            VANGUARD 2026 · Oak Ray Gatambe · 24th October 2026
          </p>
        </div>
      </div>
      </>
      )}

      {/* Loading Modal */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <div className="relative bg-zinc-900 border border-[#d4af37]/30 rounded-2xl w-full max-w-sm p-8 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col items-center text-center animate-in fade-in zoom-in duration-200">
            {/* Spinning Ring */}
            <div className="w-16 h-16 border-4 border-zinc-800 border-t-[#d4af37] rounded-full animate-spin mb-6" />
            
            <h3 className="text-xl font-bold text-white mb-2">Submitting Registration...</h3>
            <p className="text-[#d4af37] text-sm font-medium mb-3">Please do not close this window</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              We are uploading your receipt and securing your spot. This should only take a few seconds.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}




