import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    if (!token) return new NextResponse('Missing token', { status: 400 });

    const host = request.headers.get('host') || 't-validati.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    // The URL that the scanner needs to read when they scan the QR code
    const scanUrl = `${protocol}://${host}/sentinel/scan?token=${token}`;

    // Generate the QR code directly as a PNG buffer
    const qrBuffer = await QRCode.toBuffer(scanUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: { dark: '#000000', light: '#ffffff' },
    });

    return new NextResponse(qrBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating QR:', error);
    return new NextResponse('Error generating QR', { status: 500 });
  }
}
