import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import SiteFooter from '@/components/SiteFooter/SiteFooter';
import SiteHeader from '@/components/SiteHeader/SiteHeader';
import { getIndexPulse } from '@/lib/indexPulse';
import { getProjects } from '@/lib/api';
import { isValidAppId } from '@/lib/algolia';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';
import { SITE_NAME, SOCIAL_IMAGE, SOCIAL_IMAGE_URL } from '@/lib/siteMetadata';
import { resolveBaseUrl, serializeJsonLd } from '@/lib/urlSafety';
import './globals.css';

// Body and UI copy.
const sans = localFont({
  src: './fonts/Archivo-Variable.woff2',
  variable: '--font-sans',
  weight: '500 900',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
});

// Everything Archivo is not: wordmark, headlines, and every piece of metadata
// the site used to set in a monospace or a serif. One variable cut covers all
// three, which is why three families could leave.
const display = localFont({
  src: './fonts/SpaceGrotesk-Variable.woff2',
  variable: '--font-display',
  weight: '300 700',
  display: 'swap',
  preload: true,
  fallback: ['ui-monospace', 'SFMono-Regular', 'system-ui', 'sans-serif'],
});

const baseUrl = resolveBaseUrl();
const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
const algoliaPreconnectHost =
  algoliaAppId && isValidAppId(algoliaAppId) ? `https://${algoliaAppId}-dsn.algolia.net` : null;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Ashley's System Notes",
    template: "%s | Ashley's System Notes",
  },
  description:
    "Ashley Childress's searchable record of engineering decisions, software projects, and the failures that improved both.",
  keywords: [
    'Ashley Childress',
    'Software Engineering',
    'Systems Architecture',
    'AI Engineering',
    'Engineering Portfolio',
  ],
  openGraph: {
    title: "Ashley's System Notes",
    description:
      'Engineering decisions, projects, and failure-tested working rules—indexed and searchable.',
    url: baseUrl,
    siteName: SITE_NAME,
    images: [SOCIAL_IMAGE],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ashley's System Notes",
    description: 'Engineering decisions, projects, and failure-tested working rules.',
    images: [SOCIAL_IMAGE_URL],
  },
  robots: { index: true, follow: true },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The sRGB rendering of --void. Kept in sync by hand: the browser chrome
  // cannot read a custom property, so a stale hex here shows as a differently
  // coloured bar above the page rather than as any kind of failure.
  themeColor: '#0b0c0f',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pulse = await getIndexPulse();
  const jsonLd = buildSiteJsonLd(getProjects(), baseUrl);

  return (
    // Extensions (password managers, contrast and translation tools) write
    // attributes onto <html> and <body> before React hydrates, which surfaces as
    // "some attributes of the server rendered HTML didn't match". It suppresses
    // one level only, so real mismatches inside the app still report.
    <html lang="en" suppressHydrationWarning>
      <head>
        {algoliaPreconnectHost ? (
          <>
            <link rel="preconnect" href={algoliaPreconnectHost} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={algoliaPreconnectHost} />
          </>
        ) : null}
        <link rel="preconnect" href="https://insights.algolia.io" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      </head>
      <body className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
        <SiteHeader pulse={pulse} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
