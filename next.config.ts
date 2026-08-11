import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
  // HSTS is intentionally omitted here — it is gated to HTTPS requests below.
  // RFC 6797 §7.2: servers MUST NOT include HSTS over plain HTTP.
  // Sending it unconditionally causes Chrome to cache the policy for localhost,
  // which makes Lighthouse redirect HTTP→HTTPS and fail with CHROME_INTERSTITIAL_ERROR.
];

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  images: {
    // Every image on the site is pre-rendered by scripts/generate-image-variants.mjs
    // and served through a custom loader, so the runtime optimizer is off the hot
    // path entirely. These widths exist to make the srcset Next builds line up with
    // the rungs the generator actually emits — anything else would advertise a
    // descriptor no file matches.
    // Next builds a sizes-based srcset from imageSizes + deviceSizes, so between
    // them these must name exactly the rungs the generator emits and nothing else.
    // Any extra width would be labelled with a descriptor no file matches: the
    // loader would snap it to a real rung and the browser would size its choice
    // against a number that was never true.
    imageSizes: [448],
    deviceSizes: [768, 896],
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
    // Do not turn on experimental.inlineCss here. It was tried and measured: it
    // removes all three render-blocking stylesheets, but this page already ships
    // ~289 KB of HTML (20 cards of RSC payload plus inline blur placeholders), and
    // folding the CSS in took it from 40 KB to 71 KB gzipped. Mobile LCP went from
    // 3.4s to 4.4-5.2s and the score dropped from 91-92 to 80-84. The round-trips
    // it saves cost less than the bytes it adds until the HTML gets much smaller.
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // HSTS only on HTTPS — Cloud Run sets x-forwarded-proto: https for production traffic.
        // Local dev and Lighthouse runs (plain HTTP) never receive this header.
        source: '/(.*)',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'https' }],
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              // public/ assets have no content hash, so they can go stale after a
              // deploy that reuses a filename. Cache briefly and force revalidation
              // instead of pinning a year; only /_next/static (hashed) gets immutable.
              source: String.raw`/(.*)\.(js|css|woff|woff2|eot|ttf|otf|svg|png|jpg|jpeg|gif|webp|avif)`,
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=3600, must-revalidate',
                },
              ],
            },
          ]
        : []),
    ];
  },
};

const config = async (): Promise<NextConfig> => {
  if (process.env.ANALYZE !== 'true') {
    return nextConfig;
  }

  const analyzerPackage = '@next/bundle-analyzer';
  const { default: bundleAnalyzer } = await import(analyzerPackage);
  const withBundleAnalyzer = bundleAnalyzer({
    enabled: true,
  });
  return withBundleAnalyzer(nextConfig);
};

export default config;
