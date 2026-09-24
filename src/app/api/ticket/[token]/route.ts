import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) return new NextResponse('Missing token', { status: 400 });

  const host = request.headers.get('host') || 'gaveshrupasinghe.online';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // Redirect old WhatsApp links (which point to /api/ticket/) to the new beautiful UI page
  return NextResponse.redirect(`${protocol}://${host}/ticket/${token}`);
}
