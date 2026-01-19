import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Ribeye } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

const ribeye = Ribeye({
  weight: '400',
  variable: '--font-ribeye',
  subsets: ['latin'],
});

import ClientShell from '@/components/ClientShell/ClientShell';

export const metadata: Metadata = {
  title: {
    default: "Ashley Childress' System Notes",
    template: '%s | System Notes',
  },
  description: 'A living, queryable index of projects and decisions.',
  openGraph: {
    title: "Ashley Childress' System Notes",
    description: 'A living, queryable index of projects and decisions.',
    url: 'https://system-notes-ui-856401495068.us-east1.run.app', // Best guess based on deploy context or localhost
    siteName: 'System Notes',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Ashley Childress' System Notes",
    description: 'A living, queryable index of projects and decisions.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${ribeye.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
