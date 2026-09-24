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

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#09090b;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">

        <!-- Header -->
        <tr>
          <td style="background:#000;padding:36px 40px;text-align:center;border-bottom:1px solid #2a2a2a;">
            <h1 style="color:#d4af37;margin:0 0 4px;font-size:30px;letter-spacing:0.25em;text-transform:uppercase;">VANGUARD</h1>
            <div style="color:#d4af37;font-size:20px;letter-spacing:0.2em;font-weight:bold;">2026</div>
            <p style="color:#555;margin:10px 0 0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Official Entry Ticket</p>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:32px 40px 0;">
            <p style="color:#fff;font-size:17px;margin:0 0 10px;font-weight:bold;">Hi ${full_name.trim()} 👋</p>
            <p style="color:#aaa;font-size:14px;line-height:1.7;margin:0 0 28px;">
              You're officially on the guest list for <span style="color:#d4af37;font-weight:bold;">Vanguard 2026</span>. Your personal QR code ticket is attached to this email. Save it to your phone — you'll need it to get in.
            </p>
          </td>
        </tr>

        <!-- Event Info -->
        <tr>
          <td style="padding:0 40px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
                  <span style="color:#d4af37;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">🗓 Event Info</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;width:90px;padding-bottom:12px;">Date</td>
                      <td style="color:#fff;font-size:14px;font-weight:bold;padding-bottom:12px;">24th October 2026</td>
                    </tr>
                    <tr>
                      <td style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:12px;">Time</td>
                      <td style="color:#fff;font-size:14px;font-weight:bold;padding-bottom:12px;">6:00 PM — 11:00 PM</td>
                    </tr>
                    <tr>
                      <td style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;padding-bottom:12px;">Venue</td>
                      <td style="color:#fff;font-size:14px;font-weight:bold;padding-bottom:12px;">Oak Ray Gatambe</td>
                    </tr>
                    <tr>
                      <td style="color:#555;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">Dress Code</td>
                      <td style="color:#fff;font-size:14px;font-weight:bold;">Full Black &mdash; Smart Casual</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Ground Rules -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a2a2a;border-radius:8px;overflow:hidden;">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #1e1e1e;">
                  <span style="color:#d4af37;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.1em;">📋 Ground Rules</span>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px;">
                  <table cellpadding="0" cellspacing="0" width="100%">
                    <tr><td style="color:#bbb;font-size:13px;padding-bottom:10px;line-height:1.5;">🔒 &nbsp;<strong style="color:#fff;">QR code is personal</strong> — do not share it. Each code can only be scanned once at entry.</td></tr>
                    <tr><td style="color:#bbb;font-size:13px;padding-bottom:10px;line-height:1.5;">🎟 &nbsp;<strong style="color:#fff;">No physical tickets</strong> — digital QR code is the only accepted form of entry.</td></tr>
                    <tr><td style="color:#bbb;font-size:13px;padding-bottom:10px;line-height:1.5;">🚭 &nbsp;<strong style="color:#fff;">No smoking</strong> inside the hall at any time.</td></tr>
                    <tr><td style="color:#bbb;font-size:13px;padding-bottom:10px;line-height:1.5;">⛔ &nbsp;<strong style="color:#fff;">No illegal substances</strong> of any kind are permitted on the premises.</td></tr>
                    <tr><td style="color:#bbb;font-size:13px;padding-bottom:10px;line-height:1.5;">💸 &nbsp;<strong style="color:#fff;">Damage policy</strong> — if you break anything, you are responsible for the cost.</td></tr>
                    <tr><td style="color:#bbb;font-size:13px;line-height:1.5;">🪪 &nbsp;<strong style="color:#fff;">Have your NIC ready</strong> along with your QR code at the entrance.</td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#000;padding:20px 40px;text-align:center;border-top:1px solid #2a2a2a;">
            <p style="color:#d4af37;font-size:13px;letter-spacing:0.1em;margin:0 0 4px;font-weight:bold;">SEE YOU ON THE NIGHT 🖤</p>
            <p style="color:#333;font-size:11px;letter-spacing:0.05em;margin:0;">VANGUARD 2026 — vanguar26@gmail.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
      html: emailHtml,
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
