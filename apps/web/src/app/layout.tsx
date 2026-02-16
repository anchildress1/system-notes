import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

import ClientShell from '@/components/ClientShell/ClientShell';

import { allProjects } from '@/data/projects';

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
        url: '/projects/system-notes.jpg',
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
    images: ['/projects/system-notes.jpg'],
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
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    hasPart: allProjects.map((p) => ({
      '@type': 'SoftwareApplication',
      name: p.title,
      description: p.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      url: p.id === 'system-notes' ? baseUrl : undefined,
      codeRepository: p.repoUrl,
      relatedLink: p.blogs?.map((b) => b.url) || [],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
