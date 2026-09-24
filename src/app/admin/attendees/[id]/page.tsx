import { createClient, createAdminClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserCheck, Clock } from 'lucide-react';
import type { Attendee } from '@/types';
import QRDisplay from '@/components/QRDisplay';
import ResetEntryButton from '@/components/ResetEntryButton';
import DeleteAttendeeButton from '@/components/DeleteAttendeeButton';
import WhatsAppButton from '@/components/WhatsAppButton';

export default async function AttendeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const adminClient = createAdminClient();

  const { data: attendee } = await adminClient
    .from('attendees')
    .select(
      `*, scanned_by_profile:profiles!attendees_qr_used_by_fkey(full_name, email)`
    )
    .eq('id', id)
    .single();

  if (!attendee) notFound();

  const a = attendee as Attendee;

  const fields = [
    { label: 'Full Name', value: a.full_name },
    { label: 'NIC Number', value: a.nic, mono: true },
    { label: 'Email Address', value: a.email },
    { label: 'Phone Number', value: a.phone },
    {
      label: 'Registered At',
      value: new Date(a.created_at).toLocaleString(),
    },
  ];

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/attendees"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Attendees
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left — info */}
        <div className="flex-1 space-y-4">
          {/* Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">{a.full_name}</h1>
                <p className="text-zinc-500 text-sm font-mono mt-1">{a.nic}</p>
              </div>
              {a.qr_used ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium shrink-0">
                  <UserCheck size={15} />
                  Checked In
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-700/50 border border-zinc-700 text-zinc-400 text-sm font-medium shrink-0">
                  <Clock size={15} />
                  Pending
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Attendee Details
            </h2>
            <div className="space-y-4">
              {fields.map(({ label, value, mono }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-zinc-500 text-xs uppercase tracking-wider">
                    {label}
                  </span>
                  <span
                    className={`text-white text-sm ${mono ? 'font-mono' : ''}`}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Check-in info */}
          {a.qr_used && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <h2 className="text-green-400 font-semibold text-sm mb-4 uppercase tracking-wider">
                Entry Record
              </h2>
              <div className="space-y-3">
                <div>
                  <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">
                    Checked In At
                  </span>
                  <span className="text-white text-sm">
                    {a.qr_used_at
                      ? new Date(a.qr_used_at).toLocaleString()
                      : '—'}
                  </span>
                </div>
                {a.scanned_by_profile && (
                  <div>
                    <span className="text-zinc-500 text-xs uppercase tracking-wider block mb-0.5">
                      Scanned By (Sentinel)
                    </span>
                    <span className="text-white text-sm">
                      {a.scanned_by_profile.full_name}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Reset Entry Status */}
              <div className="mt-4 pt-4 border-t border-green-500/10">
                <ResetEntryButton attendeeId={a.id} />
              </div>
            </div>
          )}

          {/* Danger Zone */}
          <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-6 mt-6">
            <h2 className="text-red-400 font-semibold text-sm mb-2 uppercase tracking-wider">
              Danger Zone
            </h2>
            <p className="text-zinc-500 text-xs leading-relaxed mb-4">
              Permanently delete this attendee. Their QR code will immediately become invalid and they will not be able to enter the event. This action cannot be undone.
            </p>
            <DeleteAttendeeButton attendeeId={a.id} attendeeName={a.full_name} />
          </div>
        </div>

        {/* Right — QR code */}
        <div className="lg:w-80">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sticky top-8">
            <h2 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider text-center">
              Entry QR Code
            </h2>
            <QRDisplay
              token={a.qr_token}
              attendeeName={a.full_name}
              isUsed={a.qr_used}
            />
            <WhatsAppButton phone={a.phone} name={a.full_name} token={a.qr_token} />
            <p className="text-zinc-600 text-xs text-center mt-2 leading-relaxed">
              Send this QR code to the attendee via WhatsApp or email. Each
              code can only be scanned once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
