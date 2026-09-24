import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token) return new NextResponse('Missing token', { status: 400 });

    const host = request.headers.get('host') || 'gaveshrupasinghe.online';
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

    // Convert to web standard array for Next.js Response
    const body = new Uint8Array(qrBuffer);

    return new NextResponse(body, {
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
