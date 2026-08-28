import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://*.algolia.io https://*.algolia.net https://*.algolianet.com",
  "media-src 'self' data:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // dev.to embeds this site in an iframe on its own origin, so framing cannot be
  // refused outright. frame-ancestors is the allowlist browsers actually enforce;
  // X-Frame-Options is deliberately absent below because it cannot express one.
  "frame-ancestors 'self' https://dev.to",
  "manifest-src 'self'",
].join('; ');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: contentSecurityPolicy,
  },
  // No X-Frame-Options. Its only values are DENY and SAMEORIGIN, both of which
  // block the dev.to embed, and ALLOW-FROM was never implemented in Chrome and
  // has been removed from Firefox — there is no spelling of this header that
  // permits one cross-origin framer. Sending DENY alongside a frame-ancestors
  // allowlist is also self-contradictory: the CSP directive wins where both are
  // understood, so the header would only ever break the embed on whatever failed
  // to read the CSP. Clickjacking protection comes from frame-ancestors above.
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
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), microphone=()',
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
    optimizePackageImports: ['react-icons'],
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

export default bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })(nextConfig);
