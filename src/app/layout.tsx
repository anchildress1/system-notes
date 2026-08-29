import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda } from 'next/font/google';
import localFont from 'next/font/local';
import RouteFocus from '@/components/RouteFocus/RouteFocus';
import SiteFooter from '@/components/SiteFooter/SiteFooter';
import SiteHeader from '@/components/SiteHeader/SiteHeader';
import { getProjects } from '@/lib/api';
import { isValidAppId } from '@/lib/algolia';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';
import { SITE_NAME, SOCIAL_IMAGE, SOCIAL_IMAGE_URL } from '@/lib/siteMetadata';
import { THEME_COLORS, THEME_SCRIPT } from '@/lib/theme';
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

// Titles only. A Didone against Archivo is the whole art direction in one
// decision: extreme stroke contrast and a real vertical axis read as something
// an art director set, where a second grotesque reads as a system font stack.
// Space Grotesk stays on metadata and the wordmark, Archivo stays on body — the
// serif never touches either, or it stops being a display face and becomes a
// theme. next/font downloads it at build time and serves it from our own origin,
// so nothing is requested from Google at runtime and the CSP is untouched.
// Weight 500 only. Nothing renders this face at 700; a 400 request resolves to
// the 500 cut. Declaring 700 preloaded two unused files, ~56 KB, on every route.
const editorial = Bodoni_Moda({
  subsets: ['latin'],
  variable: '--font-editorial',
  weight: ['500'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
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
  // The dark --void, matching what the CSS renders before the theme script runs.
  // The script rewrites this tag when it resolves a light theme, because the
  // browser chrome cannot read a custom property and prefers-color-scheme is the
  // OS preference rather than the choice this site actually honors.
  themeColor: THEME_COLORS.dark,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = buildSiteJsonLd(getProjects(), baseUrl);

  return (
    // Extensions (password managers, contrast and translation tools) write
    // attributes onto <html> and <body> before React hydrates, which surfaces as
    // "some attributes of the server rendered HTML didn't match". It suppresses
    // one level only, so real mismatches inside the app still report.
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
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
        {/* Blocking, and first: it stamps data-theme before the first paint so a
            light reader never sees a dark frame. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className={`${sans.variable} ${display.variable} ${editorial.variable}`}
        suppressHydrationWarning
      >
        <SiteHeader />
        <RouteFocus />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
