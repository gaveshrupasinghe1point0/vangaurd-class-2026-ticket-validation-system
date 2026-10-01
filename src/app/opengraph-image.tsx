import { ImageResponse } from 'next/og';
 
export const runtime = 'edge';
 
export const alt = 'Vanguard 2026';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';
 
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          border: '4px solid #111',
        }}
      >
        <div style={{
          position: 'absolute',
          top: -200,
          left: 300,
          width: 600,
          height: 600,
          background: 'rgba(212, 175, 55, 0.2)',
          filter: 'blur(150px)',
          borderRadius: '50%',
        }} />
        
        <h1
          style={{
            fontSize: 140,
            fontWeight: 900,
            color: 'white',
            letterSpacing: '-0.02em',
            margin: 0,
            lineHeight: 1,
          }}
        >
          VANGUARD
        </h1>
        <p
          style={{
            fontSize: 70,
            fontWeight: 900,
            color: '#d4af37',
            letterSpacing: '0.2em',
            margin: 0,
            marginTop: -10,
          }}
        >
          2026
        </p>
        <div style={{
          marginTop: 60,
          padding: '12px 30px',
          background: 'rgba(212, 175, 55, 0.1)',
          border: '2px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 40,
          color: '#d4af37',
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          Kingswood College Class of 2026
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
