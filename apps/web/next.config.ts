import type { NextConfig } from 'next';
import path from 'node:path';

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
  transpilePackages: ['@algolia/sitesearch'],
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons'],
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
              // Standard caching for static assets from public/.
              source: String.raw`/(.*)\.(js|css|woff|woff2|eot|ttf|otf|svg|png|jpg|jpeg|gif|webp|avif)`,
              headers: [
                {
                  key: 'Cache-Control',
                  value: 'public, max-age=31536000',
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
