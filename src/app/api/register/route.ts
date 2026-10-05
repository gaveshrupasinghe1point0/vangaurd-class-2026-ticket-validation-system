import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { parseReceiptPDF, parseReceiptText, type ParsedReceipt } from '@/lib/pdf-parser';
import { ocrReceiptImage } from '@/lib/image-ocr';
import { Resend } from 'resend';

// Image OCR can take a few seconds — give the function headroom
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const full_name = (formData.get('full_name') as string)?.trim();
    const nic = (formData.get('nic') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const receiptFile = formData.get('receipt') as File | null;

    if (!full_name || !nic || !phone || !email) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Validate NIC format server-side
    const nicUpper = nic.toUpperCase();
    const validNIC = /^\d{9}[VX]$/.test(nicUpper) || /^\d{12}$/.test(nicUpper);
    if (!validNIC) {
      return NextResponse.json({ error: 'Invalid NIC format.' }, { status: 400 });
    }

    if (!receiptFile) {
      return NextResponse.json({ error: 'Payment receipt is required.' }, { status: 400 });
    }
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(receiptFile.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, and PNG files are accepted.' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check for duplicate NIC
    const { data: existing } = await adminClient
      .from('attendees')
      .select('id, full_name')
      .eq('nic', nic)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: `This NIC is already registered to: ${existing.full_name}` },
        { status: 409 }
      );
    }

    // Check for duplicate phone number
    const { data: existingPhone } = await adminClient
      .from('attendees')
      .select('id, full_name')
      .eq('phone', phone)
      .single();

    if (existingPhone) {
      return NextResponse.json(
        { error: `This WhatsApp number is already registered to: ${existingPhone.full_name}` },
        { status: 409 }
      );
    }

    const arrayBuffer = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let parsed: ParsedReceipt | null = null;

    // Read the receipt — PDFs via text extraction, photos via Gemini OCR
    if (receiptFile.type === 'application/pdf') {
      try {
        parsed = await parseReceiptPDF(buffer);
      } catch (e) {
        console.error('PDF parsing skipped or failed:', e);
      }
    } else {
      const ocrText = await ocrReceiptImage(buffer, receiptFile.type);
      if (ocrText) parsed = parseReceiptText(ocrText);
    }

    // Cross-check what's on the receipt against what they typed.
    // Status stays pending_review — the bank SMS is still the source of truth.
    const paymentStatus = 'pending_review';
    const registeredNIC = nic.toUpperCase();
    let paymentNotes = 'Awaiting SMS verification or manual review.';

    if (parsed) {
      const checks: string[] = [];
      if (!parsed.nic) {
        checks.push('⚠ No NIC reference found on receipt');
      } else if (parsed.nic !== registeredNIC) {
        checks.push(`⚠ Receipt reference ${parsed.nic} does NOT match registered NIC`);
      } else {
        checks.push('✓ Receipt reference matches NIC');
      }
      if (parsed.amount === null) {
        checks.push('⚠ Amount unreadable');
      } else if (parsed.amount !== 6500) {
        checks.push(`⚠ Receipt amount LKR ${parsed.amount.toLocaleString()} (expected 6,500)`);
      } else {
        checks.push('✓ Amount LKR 6,500');
      }
      paymentNotes = `${checks.join(' · ')}. Awaiting SMS verification.`;
    } else {
      paymentNotes = 'Receipt could not be read automatically — check manually. Awaiting SMS verification.';
    }

    // Determine extension
    let ext = 'pdf';
    if (receiptFile.type === 'image/jpeg' || receiptFile.type === 'image/jpg') ext = 'jpg';
    if (receiptFile.type === 'image/png') ext = 'png';

    // Upload file to Supabase Storage (bucket named 'reciepts')
    const fileName = `reciepts/${nic}-${Date.now()}.${ext}`;
    const { error: uploadError } = await adminClient.storage
      .from('reciepts')
      .upload(fileName, buffer, { contentType: receiptFile.type, upsert: false });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
    }

    let receiptUrl = '';
    if (!uploadError) {
      const { data: urlData } = adminClient.storage.from('reciepts').getPublicUrl(fileName);
      receiptUrl = urlData.publicUrl;
    }

    // Generate QR token — but QR is only sent after payment confirmed
    const qr_token = crypto.randomUUID();

    // Insert attendee
    const { data, error: insertError } = await adminClient
      .from('attendees')
      .insert({
        full_name,
        nic,
        phone,
        email,
        qr_token,
        qr_used: false,
        payment_status: paymentStatus,
        receipt_url: receiptUrl,
        receipt_transaction_ref: parsed?.transactionRef ?? null,
        receipt_amount: parsed?.amount ?? null,
        receipt_payment_time: parsed?.paymentTime ?? null,
        payment_notes: paymentNotes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save registration.' }, { status: 500 });
    }

    // Send admin notification email (fire-and-forget — never blocks registration)
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);

      // Email 1: Admin notification
      await resend.emails.send({
        from: 'Vanguard 2026 <onboarding@resend.dev>',
        to: ['gimhanarupasinghe516@gmail.com', 'rochanakuvindu85@gmail.com'],
        subject: `🎟 New Registration — ${full_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#09090b;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:#d4af37;padding:20px 24px;">
              <h1 style="margin:0;font-size:20px;color:#000;font-weight:900;letter-spacing:0.1em;">VANGUARD 2026</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#000;opacity:0.7;">New Attendee Registration</p>
            </div>
            <div style="padding:24px;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:8px 0;color:#a1a1aa;width:130px;">Full Name</td><td style="padding:8px 0;font-weight:600;">${full_name}</td></tr>
                <tr><td style="padding:8px 0;color:#a1a1aa;">NIC</td><td style="padding:8px 0;font-family:monospace;">${nic}</td></tr>
                <tr><td style="padding:8px 0;color:#a1a1aa;">WhatsApp</td><td style="padding:8px 0;">${phone}</td></tr>
                <tr><td style="padding:8px 0;color:#a1a1aa;">Email</td><td style="padding:8px 0;">${email}</td></tr>
                <tr><td style="padding:8px 0;color:#a1a1aa;">Status</td><td style="padding:8px 0;color:#f59e0b;font-weight:600;">Pending Review</td></tr>
                ${receiptUrl ? `<tr><td style="padding:8px 0;color:#a1a1aa;">Receipt</td><td style="padding:8px 0;"><a href="${receiptUrl}" style="color:#d4af37;">View Receipt</a></td></tr>` : ''}
              </table>
              <p style="margin:20px 0 0;font-size:12px;color:#52525b;">Paste the bank SMS into the admin dashboard to verify payment and send the QR ticket.</p>
            </div>
          </div>
        `,
      });

      // Email 2: Attendee confirmation
      await resend.emails.send({
        from: 'Vanguard 2026 <onboarding@resend.dev>',
        to: email,
        subject: `✅ Registration Received — Vanguard 2026`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#09090b;color:#fff;border-radius:12px;overflow:hidden;">
            <div style="background:#d4af37;padding:20px 24px;">
              <h1 style="margin:0;font-size:20px;color:#000;font-weight:900;letter-spacing:0.1em;">VANGUARD 2026</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#000;opacity:0.7;">Registration Confirmation</p>
            </div>
            <div style="padding:24px;">
              <p style="margin:0 0 16px;font-size:15px;color:#fff;">Hey <strong>${full_name}</strong> 👋</p>
              <p style="margin:0 0 20px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                Your registration for <strong style="color:#fff;">Vanguard 2026</strong> has been received! Your payment receipt is currently under review. Once verified, you will receive your personal QR code ticket on WhatsApp.
              </p>
              <div style="background:#18181b;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0 0 10px;font-size:10px;color:#d4af37;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Your Details</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <tr><td style="padding:6px 0;color:#71717a;width:120px;">Name</td><td style="padding:6px 0;color:#fff;font-weight:600;">${full_name}</td></tr>
                  <tr><td style="padding:6px 0;color:#71717a;">NIC</td><td style="padding:6px 0;color:#fff;font-family:monospace;">${nic}</td></tr>
                  <tr><td style="padding:6px 0;color:#71717a;">WhatsApp</td><td style="padding:6px 0;color:#fff;">${phone}</td></tr>
                </table>
              </div>
              <div style="background:#18181b;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0 0 10px;font-size:10px;color:#d4af37;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;">Event Details</p>
                <table style="width:100%;border-collapse:collapse;font-size:13px;">
                  <tr><td style="padding:6px 0;color:#71717a;width:120px;">Date</td><td style="padding:6px 0;color:#fff;">24th October 2026</td></tr>
                  <tr><td style="padding:6px 0;color:#71717a;">Time</td><td style="padding:6px 0;color:#fff;">6:00 PM – 11:00 PM</td></tr>
                  <tr><td style="padding:6px 0;color:#71717a;">Venue</td><td style="padding:6px 0;color:#fff;">Oak Ray Gatambe</td></tr>
                  <tr><td style="padding:6px 0;color:#71717a;">Dress Code</td><td style="padding:6px 0;color:#fff;">Full Black, Smart Casual</td></tr>
                </table>
              </div>
              <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">
                Need help? WhatsApp us at <strong style="color:#a1a1aa;">0755494649</strong> (WhatsApp only).
              </p>
            </div>
          </div>
        `,
      });

    } catch (emailErr) {
      console.error('Email notification failed (non-critical):', emailErr);
    }

    return NextResponse.json({ success: true, id: data.id, paymentStatus }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}

