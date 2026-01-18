import type { Metadata } from 'next';
import { Geist, Geist_Mono, Ribeye } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const ribeye = Ribeye({
  weight: '400',
  variable: '--font-ribeye',
  subsets: ['latin'],
});

import Footer from '@/components/Footer/Footer';
import BackgroundMusic from '@/components/BackgroundMusic/BackgroundMusic';
import GlitterBomb from '@/components/GlitterBomb/GlitterBomb';
import AIChat from '@/components/AIChat/AIChat';
import { ChatProvider } from '@/context/ChatContext';

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ribeye.variable} antialiased`}
        style={{ paddingBottom: '80px' }}
      >
        <ChatProvider>
          <div aria-hidden="true">
            <GlitterBomb />
          </div>
          <BackgroundMusic />
          {children}
          <AIChat />
          <Footer />
        </ChatProvider>
      </body>
    </html>
  );
}
