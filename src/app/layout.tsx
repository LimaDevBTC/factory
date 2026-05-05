import type { Metadata, Viewport } from 'next';
import { ROOT_FONT_VARS } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Factory',
    template: '%s · Factory',
  },
  description: 'Il tuo locale online in dieci minuti.',
  applicationName: 'Factory',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Factory',
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ea580c',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={ROOT_FONT_VARS}>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
