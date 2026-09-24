import { createClient, createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { full_name, nic, phone, email } = body;

  if (!full_name || !nic || !phone || !email) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  // Use admin client to bypass RLS for insert
  const adminClient = createAdminClient();
  const qr_token = crypto.randomUUID();

  const { data, error } = await adminClient
    .from('attendees')
    .insert({
      full_name: full_name.trim(),
      nic: nic.trim().toUpperCase(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      qr_token,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // === EMAIL SENDING LOGIC ===
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const origin = request.headers.get('origin') || 'https://t-validati.vercel.app';
    const scanUrl = `${origin}/sentinel/scan?token=${qr_token}`;

    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: { dark: '#000000', light: '#ffffff' },
    });
    const base64Image = qrDataUrl.split(',')[1];

    const plainText = `Hi ${full_name.trim()},

Your ticket for Vanguard 2026 is confirmed. Your QR code is attached to this email. Save it to your phone and present it at the entrance.

EVENT DETAILS
Date: 24th October 2026
Time: 6:00 PM to 11:00 PM
Venue: Oak Ray Gatambe
Dress Code: Full Black, Smart Casual

GROUND RULES
- Your QR code is personal. Do not share it. It can only be scanned once.
- No physical tickets. Digital QR code is the only form of entry.
- No smoking inside the hall.
- No illegal substances on the premises.
- If you break anything, you are responsible for the cost.
- Bring your NIC along with your QR code for verification at the entrance.

See you there.
Vanguard 2026 Team`;

    await transporter.sendMail({
      from: `"Vanguard2026" <${process.env.GMAIL_USER}>`,
      to: email.trim().toLowerCase(),
      subject: `Vanguard 2026 Ticket - ${full_name.trim()}`,
      text: plainText,
      attachments: [
        {
          filename: 'vanguard-2026-ticket.png',
          content: Buffer.from(base64Image, 'base64'),
          contentType: 'image/png',
        },
      ],
    });
  } catch (emailErr) {
    console.error('Failed to send email:', emailErr);
  }

  return NextResponse.json(data, { status: 201 });
}
