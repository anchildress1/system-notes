import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'sans-serif'],
});

// Only the display font (the LCP H1) is preloaded. The serif and mono load on
// demand behind their fallbacks (display: swap) so they don't compete with the
// LCP font for the initial connection — shaves the hero's render delay.
const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'monospace'],
});

import ClientShell from '@/components/ClientShell/ClientShell';
import Nebula from '@/components/Nebula/Nebula';
import { getProjects } from '@/lib/api';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://anchildress1.dev';
const algoliaAppId = process.env.NEXT_PUBLIC_ALGOLIA_APPLICATION_ID;
const algoliaPreconnectHost = algoliaAppId ? `https://${algoliaAppId}-dsn.algolia.net` : null;

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
        width: 1200,
        height: 630,
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
  const projects = await getProjects().catch((err) => {
    console.error('[RootLayout] Failed to load projects:', err);
    return [] as Awaited<ReturnType<typeof getProjects>>;
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: "Ashley's System Notes",
    url: baseUrl,
    description: 'A living, queryable index of projects and decisions.',
    author: {
      '@type': 'Person',
      name: 'Ashley Childress',
      url: baseUrl,
      sameAs: [baseUrl, 'https://github.com/anchildress1', 'https://dev.to/anchildress1'],
    },
    hasPart: projects.map((p) => ({
      '@type': 'SoftwareApplication',
      name: p.title,
      description: p.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      url: p.id === 'system-notes' ? baseUrl : undefined,
      codeRepository: p.repo_url,
      relatedLink: p.blog_posts?.map((b) => b.url) || [],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    })),
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Algolia domains for faster API requests */}
        {algoliaPreconnectHost && (
          <>
            <link rel="preconnect" href={algoliaPreconnectHost} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={algoliaPreconnectHost} />
          </>
        )}
        <link rel="preconnect" href="https://insights.algolia.io" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Nebula />
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
