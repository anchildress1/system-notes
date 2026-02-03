import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest, { params }: { params: Promise<{ size: string }> }) {
  const sizeParam = (await params).size;
  const size = parseInt(sizeParam, 10);

  if (isNaN(size) || size <= 0) {
    return new Response('Invalid size', { status: 400 });
  }

  // Cap size for safety
  const iconSize = Math.min(Math.max(size, 32), 1024);

  return new ImageResponse(
    <div
      style={{
        fontSize: iconSize * 0.75,
        background: '#14b8a6', // Teal
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: iconSize * 0.25,
        fontFamily: 'sans-serif',
        fontWeight: 700,
      }}
    >
      S
    </div>,
    {
      width: iconSize,
      height: iconSize,
    }
  );
}
