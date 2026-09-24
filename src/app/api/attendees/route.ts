import { createClient, createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
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
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      // Determine origin for the scan URL (fallback if request header missing)
      const origin = request.headers.get('origin') || 'https://t-validati.vercel.app';
      const scanUrl = `${origin}/sentinel/scan?token=${qr_token}`;

      // Generate the QR code as a base64 image
      const qrDataUrl = await QRCode.toDataURL(scanUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
        color: { dark: '#000000', light: '#ffffff' },
      });
      const base64Image = qrDataUrl.split(',')[1];

      // Build the email HTML
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 40px 20px; border-radius: 12px; border: 1px solid #2a2a2a;">
          
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #2a2a2a; padding-bottom: 24px;">
            <h1 style="color: #d4af37; letter-spacing: 0.2em; font-size: 28px; text-transform: uppercase; margin: 0 0 6px 0;">VANGUARD</h1>
            <div style="color: #d4af37; font-size: 18px; letter-spacing: 0.15em; font-weight: bold;">2026</div>
            <p style="color: #666; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; margin: 8px 0 0 0;">Official Entry Ticket</p>
          </div>

          <!-- Greeting -->
          <div style="margin-bottom: 28px;">
            <h2 style="color: #fff; font-size: 18px; margin: 0 0 10px 0;">Hi ${full_name.trim()} 👋</h2>
            <p style="color: #aaa; line-height: 1.7; font-size: 15px; margin: 0;">
              You're officially on the guest list for <strong style="color: #d4af37;">Vanguard 2026</strong>. Your personal QR code ticket is attached to this email as an image. Save it to your phone — you'll need it to get in.
            </p>
          </div>

          <!-- Section 1: Event Details -->
          <div style="background: #111113; border: 1px solid #2a2a2a; border-radius: 10px; padding: 22px; margin-bottom: 20px;">
            <h3 style="color: #d4af37; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0; border-bottom: 1px solid #2a2a2a; padding-bottom: 10px;">🗓 Event Info</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding: 8px 0 2px 0; width: 100px;">Date</td>
                <td style="color: #fff; font-size: 14px; font-weight: bold; padding: 8px 0 2px 0;">24th October 2026</td>
              </tr>
              <tr>
                <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0;">Time</td>
                <td style="color: #fff; font-size: 14px; font-weight: bold; padding: 4px 0;">6:00 PM — 11:00 PM</td>
              </tr>
              <tr>
                <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0;">Venue</td>
                <td style="color: #fff; font-size: 14px; font-weight: bold; padding: 4px 0;">Oak Ray Gatambe</td>
              </tr>
              <tr>
                <td style="color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding: 4px 0;">Dress Code</td>
                <td style="color: #fff; font-size: 14px; font-weight: bold; padding: 4px 0;">Full Black — Smart Casual</td>
              </tr>
            </table>
          </div>

          <!-- Section 2: Ground Rules -->
          <div style="background: #111113; border: 1px solid #2a2a2a; border-radius: 10px; padding: 22px; margin-bottom: 28px;">
            <h3 style="color: #d4af37; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px 0; border-bottom: 1px solid #2a2a2a; padding-bottom: 10px;">📋 Ground Rules</h3>
            <ul style="color: #bbb; font-size: 14px; line-height: 1.8; padding-left: 18px; margin: 0;">
              <li style="margin-bottom: 8px;"><strong style="color: #fff;">Your QR code is unique to you</strong> — do not share it with anyone. Each code can only be scanned once at entry.</li>
              <li style="margin-bottom: 8px;"><strong style="color: #fff;">No physical tickets</strong> — digital QR code is the only accepted form of entry. No exceptions.</li>
              <li style="margin-bottom: 8px;"><strong style="color: #fff;">No smoking</strong> inside the hall at any time.</li>
              <li style="margin-bottom: 8px;"><strong style="color: #fff;">No illegal substances</strong> of any kind are permitted on the premises.</li>
              <li style="margin-bottom: 8px;"><strong style="color: #fff;">Damage policy</strong> — if you break anything, you are responsible for the cost of replacement.</li>
              <li><strong style="color: #fff;">Have your NIC ready</strong> along with your QR code at the entrance for verification.</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; border-top: 1px solid #2a2a2a; padding-top: 20px;">
            <p style="color: #d4af37; font-size: 13px; letter-spacing: 0.1em; margin: 0 0 6px 0; font-weight: bold;">SEE YOU THERE 🖤</p>
            <p style="color: #444; font-size: 11px; letter-spacing: 0.05em; margin: 0;">VANGUARD 2026 TEAM</p>
          </div>

        </div>
      `;

      const emailText = `Hi ${full_name.trim()},

You're officially on the guest list for Vanguard 2026. Your QR code ticket is attached to this email as an image. Save it to your phone before arriving.

━━━━━━━━━━━━━━━━━━━━━━
EVENT INFO
━━━━━━━━━━━━━━━━━━━━━━
Date     : 24th October 2026
Time     : 6:00 PM — 11:00 PM
Venue    : Oak Ray Gatambe
Dress Code: Full Black — Smart Casual

━━━━━━━━━━━━━━━━━━━━━━
GROUND RULES
━━━━━━━━━━━━━━━━━━━━━━
• Your QR code is unique to you — do not share it. It can only be scanned once.
• No physical tickets — digital QR code is the only accepted form of entry.
• No smoking inside the hall at any time.
• No illegal substances of any kind are permitted.
• Damage policy — if you break anything, you are responsible for the cost.
• Have your NIC ready along with your QR code at the entrance.

See you there 🖤
Vanguard 2026 Team`;

      await resend.emails.send({
        from: 'Vanguard 2026 Tickets <tickets@gaveshrupasinghe.online>',
        to: email.trim().toLowerCase(),
        subject: `Vanguard 2026 — Ticket Confirmation for ${full_name.trim()}`,
        html: emailHtml,
        text: emailText,
        attachments: [
          {
            filename: `vanguard-ticket-${full_name.trim().replace(/\s+/g, '-')}.png`,
            content: base64Image,
          },
        ],
      });
    }
  } catch (emailErr) {
    console.error('Failed to send email:', emailErr);
    // We do not return 500 here because the attendee was successfully created
  }

  return NextResponse.json(data, { status: 201 });
}
