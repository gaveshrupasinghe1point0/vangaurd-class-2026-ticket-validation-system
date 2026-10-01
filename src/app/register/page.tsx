'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ full_name: '', nic: '', phone: '', email: '' });
  const [file, setFile] = useState<File | null>(null);

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

    const data = new FormData();
    data.append('full_name', form.full_name.trim());
    data.append('nic', form.nic.trim());
    data.append('phone', form.phone.trim());
    data.append('email', form.email.trim());
    data.append('receipt', file);

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

  if (success) {
    return (
      <main className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden">
        {/* Background Video with Overlay */}
        <div className="absolute inset-0 z-0 fixed overflow-hidden">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="/vanguard-bg.jpg"
          >
            <source src="/vanguard-bg-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        </div>

        <div className="pointer-events-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#d4af37]/10 blur-[120px] z-0" />
        
        <div className="relative z-10 w-full max-w-md text-center">
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
      </main>
    );
  }

  return (
    <main className="min-h-screen relative py-10 px-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Video with Overlay */}
      <div className="absolute inset-0 z-0 fixed overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/vanguard-bg.jpg"
        >
          <source src="/vanguard-bg-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-[#09090b]/80" />
      </div>
      
      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#d4af37]/10 blur-[120px] z-0" />

      <div className="relative z-10 w-full max-w-2xl mx-auto px-2 sm:px-0">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-0">
          <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">VANGUARD</div>
          <div className="text-lg sm:text-xl font-black text-[#d4af37] tracking-[0.2em]">2026</div>
          <p className="mt-2 text-zinc-400 text-xs sm:text-sm">Ticket Registration</p>
        </div>

        {/* Event Info Banner */}
        <div className="bg-black/40 backdrop-blur-md border border-[#d4af37]/30 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
          <p className="text-[#d4af37] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">🗓 Event Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            <div className="flex justify-between sm:block border-b border-white/5 sm:border-0 pb-2 sm:pb-0"><p className="text-zinc-400 text-xs sm:mb-1">Date</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">24th Oct 2026</p></div>
            <div className="flex justify-between sm:block border-b border-white/5 sm:border-0 pb-2 sm:pb-0"><p className="text-zinc-400 text-xs sm:mb-1">Time</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">6:00 PM – 11:00 PM</p></div>
            <div className="flex justify-between sm:block border-b border-white/5 sm:border-0 pb-2 sm:pb-0"><p className="text-zinc-400 text-xs sm:mb-1">Venue</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">Oak Ray Gatambe</p></div>
            <div className="flex justify-between sm:block"><p className="text-zinc-400 text-xs sm:mb-1">Dress Code</p><p className="text-white font-medium text-right sm:text-left text-xs sm:text-sm">Full Black, Smart Casual</p></div>
          </div>
        </div>

        {/* Ground Rules */}
        <div className="bg-black/50 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
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
        <div className="bg-black/50 backdrop-blur-md border border-zinc-700/50 rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 shadow-lg">
          <p className="text-zinc-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">💳 Payment Instructions</p>
          <ol className="space-y-4 sm:space-y-3 text-xs sm:text-sm text-zinc-300 list-decimal list-inside">
            <li>Transfer <strong className="text-white">LKR 6,500.00</strong> to the Vanguard 2026 bank account.</li>
            <li>When transferring, set your <strong className="text-white">reference/remark</strong> to exactly:
              <div className="mt-2 bg-black/80 border border-zinc-600 rounded-lg px-3 sm:px-4 py-2 font-mono text-[#d4af37] text-xs sm:text-sm tracking-wide shadow-inner overflow-hidden text-ellipsis whitespace-nowrap">
                V<span className="text-white">[your NIC]</span>
              </div>
              <p className="mt-1.5 text-zinc-400 text-[10px] sm:text-xs leading-relaxed">Example: if your NIC is 200713102718, enter <code className="text-zinc-200 bg-zinc-800/50 px-1 py-0.5 rounded">V200713102718</code></p>
            </li>
            <li>Download and upload your <strong className="text-white">PDF or Image receipt</strong> below.</li>
          </ol>
        </div>

        {/* Registration Form */}
        <div className="bg-black/60 backdrop-blur-xl border border-zinc-700/60 rounded-2xl p-5 sm:p-6 shadow-2xl">
          <h2 className="text-white font-semibold text-base sm:text-lg mb-4 sm:mb-5">Your Details</h2>

          {error && (
            <div className="mb-4 sm:mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs sm:text-sm">
              {error}
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

        <p className="text-center text-zinc-500 text-[10px] sm:text-xs mt-6 mb-4 sm:mb-0 drop-shadow-md">
          VANGUARD 2026 · Oak Ray Gatambe · 24th October 2026
        </p>
      </div>
    </main>
  );
}
