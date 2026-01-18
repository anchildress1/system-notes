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

export const metadata: Metadata = {
  title: "Ashley Childress' System Notes | v1.0.0",
  description: 'A living, queryable index of projects and decisions.',
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
        <div aria-hidden="true">
          <GlitterBomb />
        </div>
        <BackgroundMusic />
        {children}
        <Footer />
      </body>
    </html>
  );
}
