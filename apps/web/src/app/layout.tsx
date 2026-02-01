import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Ribeye } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const ribeye = Ribeye({
  weight: '400',
  variable: '--font-ribeye',
  subsets: ['latin'],
  display: 'swap',
});

import ClientShell from '@/components/ClientShell/ClientShell';

import { allProjects } from '@/data/projects';

export const metadata: Metadata = {
  metadataBase: new URL('http://anchildress1.dev'),
  title: {
    default: "Ashley Childress' System Notes",
    template: '%s | System Notes',
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
    title: "Ashley Childress' System Notes",
    description:
      "Ashley Childress's engineering portfolio: A living, queryable index of AI agents, full-stack development projects, and architectural decisions.",
    url: 'https://anchildress1.dev',
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
    title: "Ashley Childress' System Notes",
    description:
      "Ashley Childress's engineering portfolio: A living, queryable index of AI agents, full-stack development projects, and architectural decisions.",
    images: ['/projects/system-notes.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
    name: "Ashley Childress' System Notes",
    url: 'https://anchildress1.dev',
    description: 'A living, queryable index of projects and decisions.',
    author: {
      '@type': 'Person',
      name: 'Ashley Childress',
      url: 'https://anchildress1.dev',
      sameAs: ['https://anchildress1.dev'],
    },
    hasPart: allProjects.map((p) => ({
      '@type': 'SoftwareApplication',
      name: p.title,
      description: p.description,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Any',
      url: p.id === 'system-notes' ? 'https://anchildress1.dev' : undefined,
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${ribeye.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
