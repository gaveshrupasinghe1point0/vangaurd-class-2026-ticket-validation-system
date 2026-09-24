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

      // Build the email HTML — clean white style avoids spam filters
      const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:#000000;padding:30px 40px;text-align:center;">
            <h1 style="color:#d4af37;margin:0;font-size:26px;letter-spacing:0.2em;text-transform:uppercase;">VANGUARD 2026</h1>
            <p style="color:#888;margin:6px 0 0;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Official Entry Ticket</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="color:#111;font-size:16px;margin:0 0 8px;">Hi <strong>${full_name.trim()}</strong>,</p>
            <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 28px;">
              You're officially on the guest list for <strong>Vanguard 2026</strong>. Your personal QR code ticket is attached to this email as an image file. Please save it to your phone — you will need it to enter the event.
            </p>

            <!-- Event Info -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="background:#f9f9f9;border-left:3px solid #d4af37;padding:18px 20px;border-radius:0 6px 6px 0;">
                  <p style="color:#d4af37;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">🗓 Event Info</p>
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#888;font-size:12px;text-transform:uppercase;padding-right:20px;padding-bottom:8px;white-space:nowrap;">Date</td>
                      <td style="color:#111;font-size:14px;font-weight:bold;padding-bottom:8px;">24th October 2026</td>
                    </tr>
                    <tr>
                      <td style="color:#888;font-size:12px;text-transform:uppercase;padding-right:20px;padding-bottom:8px;white-space:nowrap;">Time</td>
                      <td style="color:#111;font-size:14px;font-weight:bold;padding-bottom:8px;">6:00 PM — 11:00 PM</td>
                    </tr>
                    <tr>
                      <td style="color:#888;font-size:12px;text-transform:uppercase;padding-right:20px;padding-bottom:8px;white-space:nowrap;">Venue</td>
                      <td style="color:#111;font-size:14px;font-weight:bold;padding-bottom:8px;">Oak Ray Gatambe</td>
                    </tr>
                    <tr>
                      <td style="color:#888;font-size:12px;text-transform:uppercase;padding-right:20px;white-space:nowrap;">Dress Code</td>
                      <td style="color:#111;font-size:14px;font-weight:bold;">Full Black &mdash; Smart Casual</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Ground Rules -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#f9f9f9;border-left:3px solid #333;padding:18px 20px;border-radius:0 6px 6px 0;">
                  <p style="color:#333;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 14px;">📋 Ground Rules</p>
                  <ul style="color:#444;font-size:13px;line-height:1.8;margin:0;padding-left:18px;">
                    <li style="margin-bottom:6px;"><strong>QR code is personal</strong> — do not share it with anyone. It can only be scanned once at entry.</li>
                    <li style="margin-bottom:6px;"><strong>No physical tickets</strong> — your digital QR code is the only accepted form of entry, no exceptions.</li>
                    <li style="margin-bottom:6px;"><strong>No smoking</strong> inside the hall at any time.</li>
                    <li style="margin-bottom:6px;"><strong>No illegal substances</strong> of any kind are permitted on the premises.</li>
                    <li style="margin-bottom:6px;"><strong>Damage policy</strong> — if you break anything, you are responsible for the cost of replacement.</li>
                    <li><strong>Have your NIC ready</strong> along with your QR code at the entrance for verification.</li>
                  </ul>
                </td>
              </tr>
            </table>

            <p style="color:#444;font-size:14px;line-height:1.7;margin:0;">
              See you on the night! 🖤<br>
              <strong>Vanguard 2026 Team</strong>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f4f4f4;padding:16px 40px;text-align:center;border-top:1px solid #e8e8e8;">
            <p style="color:#aaa;font-size:11px;margin:0;">This ticket was issued to ${full_name.trim()} (${email.trim().toLowerCase()}) for Vanguard 2026. Please do not reply to this email.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
