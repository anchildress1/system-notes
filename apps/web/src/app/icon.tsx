import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        fontSize: 24,
        background: '#14b8a6', // Teal
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        borderRadius: '8px', // Rounded square
        fontFamily: 'sans-serif',
        fontWeight: 700,
      }}
    >
      S
    </div>,
    // ImageResponse options
    {
      ...size,
    }
  );
}
