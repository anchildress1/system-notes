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
    // Next builds a sizes-based srcset from imageSizes + deviceSizes, so between them
    // these must name exactly the rungs generate-image-variants.mjs emits. Any other
    // width gets a descriptor no file matches, and the browser sizes its choice
    // against a number that was never true.
    imageSizes: [448],
    deviceSizes: [768, 896],
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
    // Do not add experimental.inlineCss. Measured: it removes all three
    // render-blocking stylesheets but takes the HTML from 40 KB to 71 KB gzipped,
    // and mobile LCP went 3.4s -> 4.4-5.2s (score 91-92 -> 80-84).
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
