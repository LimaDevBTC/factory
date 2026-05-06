import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { ROOT_FONT_VARS } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Factory',
    template: '%s · Factory',
  },
  description: 'Sites pra hospitalidade italiana, em 10 minutos.',
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

/**
 * `<html lang>` é decidido por surface:
 *   - tenant site (slug ou custom domain) → 'it'
 *   - operator app + marketing → 'pt-BR'
 * Middleware seta os headers; root layout lê via headers().
 */
function resolveHtmlLang(): string {
  const h = headers();
  if (h.get('x-tenant-slug') || h.get('x-custom-domain')) return 'it';
  return 'pt-BR';
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = resolveHtmlLang();
  return (
    <html lang={lang} className={ROOT_FONT_VARS}>
      <head>
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
