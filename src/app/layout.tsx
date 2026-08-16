import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Vendored, not next/font/google: that downloads at build time, so every build
// depended on reaching fonts.googleapis.com — a fetch that has already failed CI
// and taken the build with it. Same latin subsets. See ./fonts/LICENSE.md.
const spaceGrotesk = localFont({
  src: './fonts/SpaceGrotesk-Variable.woff2',
  variable: '--font-display',
  weight: '300 700',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

// Body/UI face. Atkinson Hyperlegible Next is drawn by the Braille Institute
// for glyph disambiguation at small sizes — I/l/1 and 0/O stay distinct, which
// is what a dense, dark, technical page actually needs.
// NOT preloaded: the LCP element is the first project image, not text, so this
// font is not on the critical path. (Preloading it measured no better and no
// worse; it is off to match the serif and mono, which are also not preloaded.)
// Body text paints immediately in the size-adjusted fallback and swaps in.
const atkinson = localFont({
  src: './fonts/AtkinsonHyperlegibleNext-Variable.woff2',
  variable: '--font-sans',
  weight: '200 800',
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
});

// Only the display font (the hero H1) is preloaded. The body, serif and mono load on
// demand behind their fallbacks (display: swap) so they don't compete with the
// LCP font for the initial connection — shaves the hero's render delay.
const instrumentSerif = localFont({
  src: [
    { path: './fonts/InstrumentSerif-Regular.woff2', weight: '400', style: 'normal' },
    { path: './fonts/InstrumentSerif-Italic.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

// Monospace sibling of the body face — same skeleton and disambiguation rules,
// so labels and prose read as one family instead of two competing voices.
const atkinsonMono = localFont({
  src: './fonts/AtkinsonHyperlegibleMono-Variable.woff2',
  variable: '--font-mono',
  weight: '200 800',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'monospace'],
});

import ClientShell from '@/components/ClientShell/ClientShell';
import Nebula from '@/components/Nebula/Nebula';
import { getProjects } from '@/lib/api';
import { buildSiteJsonLd } from '@/lib/siteJsonLd';
import { isValidAppId } from '@/lib/algolia';
import { resolveBaseUrl, serializeJsonLd } from '@/lib/urlSafety';

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
    "Ashley Childress's engineering portfolio: A living, queryable index of AI agents, full-stack development projects, and architectural decisions.",
  keywords: [
    'AI',
    'Engineering',
    'Portfolio',
    'System Notes',
    'Ashley Childress',
    'Next.js',
    'React',
    'Generative AI',
    'Agents',
  ],
  openGraph: {
    title: "Ashley's System Notes",
    description:
      "Ashley Childress's engineering portfolio: A living, queryable index of AI agents, full-stack development projects, and architectural decisions.",
    url: baseUrl,
    siteName: 'System Notes',
    images: [
      {
        url: '/projects/system-notes.webp',
        width: 1440,
        height: 720,
        alt: 'System Notes interface showing a grid of AI engineering projects and architectural decisions',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ashley's System Notes",
    description:
      "Ashley Childress's engineering portfolio: A living, queryable index of AI agents, full-stack development projects, and architectural decisions.",
    images: ['/projects/system-notes.webp'],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0e0f13',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const projects = getProjects();
  const jsonLd = buildSiteJsonLd(projects, baseUrl);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {algoliaPreconnectHost && (
          <>
            <link rel="preconnect" href={algoliaPreconnectHost} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={algoliaPreconnectHost} />
          </>
        )}
        <link rel="preconnect" href="https://insights.algolia.io" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${atkinson.variable} ${instrumentSerif.variable} ${atkinsonMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Nebula />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
