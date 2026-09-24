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
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; background: #09090b; color: #ffffff; padding: 40px 20px; border-radius: 12px; border: 1px solid #333;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d4af37; letter-spacing: 0.15em; font-size: 24px; text-transform: uppercase; margin: 0;">Vanguard 2026</h1>
            <p style="color: #888; font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; margin-top: 5px;">Your Official Ticket</p>
          </div>
          
          <div style="background: #18181b; padding: 25px; border-radius: 8px; border: 1px solid #333; margin-bottom: 30px;">
            <h2 style="margin-top: 0; color: #fff; font-size: 18px;">Hi ${full_name.trim()},</h2>
            <p style="color: #ccc; line-height: 1.6; font-size: 15px;">
              You have been officially added to the guest list for Vanguard 2026. Your exclusive QR code ticket is attached to this email.
            </p>
            
            <div style="margin-top: 25px;">
              <h3 style="color: #d4af37; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px;">Event Instructions:</h3>
              <ul style="color: #ccc; line-height: 1.6; font-size: 14px; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong>Save your ticket:</strong> Please download the attached QR code image to your phone before arriving.</li>
                <li style="margin-bottom: 8px;"><strong>Entry:</strong> Have your QR code and NIC ready at the entrance.</li>
                <li><strong>Security:</strong> This QR code is unique to you and can only be scanned once. Do not share it with anyone.</li>
              </ul>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; font-size: 12px; letter-spacing: 0.05em;">VANGUARD 2026 TEAM</p>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: 'Vanguard 2026 Tickets <tickets@gaveshrupasinghe.online>',
        to: email.trim().toLowerCase(),
        subject: 'Your Vanguard 2026 Ticket & QR Code',
        html: emailHtml,
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
