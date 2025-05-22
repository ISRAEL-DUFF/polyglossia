import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import AppLayout from '@/components/AppLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Polyglossia Praxis',
  description: 'Learn Ancient Greek, Hebrew, and Latin',
  manifest: '/manifest.json', // Link to manifest
  icons: [ // For general favicon and PWA icons
    { rel: 'icon', url: '/favicon.ico' },
    { rel: 'apple-touch-icon', url: '/icons/apple-touch-icon.png' }, // Placeholder
  ],
};

export const viewport: Viewport = {
  themeColor: '#D4AF37', // Match manifest theme_color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Apple PWA specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Polyglossia Praxis" />
        {/* You would typically have different sized apple-touch-icons linked here if available */}
        {/* <link rel="apple-touch-icon" href="/icons/apple-icon-180x180.png" sizes="180x180" /> */}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppLayout>{children}</AppLayout>
        <Toaster />
      </body>
    </html>
  );
}
