import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';
import { parseReceiptPDF } from '@/lib/pdf-parser';

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

    const arrayBuffer = await receiptFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let parsed: { transactionRef: string | null, amount: number | null, paymentTime: string | null } = { 
      transactionRef: null, 
      amount: null, 
      paymentTime: null 
    };
    
    // Only attempt to parse if it is actually a PDF
    if (receiptFile.type === 'application/pdf') {
      try {
        parsed = await parseReceiptPDF(buffer);
      } catch (e) {
        console.error('PDF parsing skipped or failed:', e);
      }
    }

    // Default to pending review since we rely on SMS verification
    const paymentStatus = 'pending_review';
    const paymentNotes = 'Awaiting SMS verification or manual review.';

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
        receipt_transaction_ref: parsed.transactionRef,
        receipt_amount: parsed.amount,
        receipt_payment_time: parsed.paymentTime,
        payment_notes: paymentNotes,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save registration.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id, paymentStatus }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Unexpected error. Please try again.' }, { status: 500 });
  }
}
