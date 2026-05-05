'use client';

import { useEffect, useState } from 'react';

type Props = {
  query: string;
  consentMessage: string;
};

function hasMarketingConsent(): boolean {
  if (typeof document === 'undefined') return false;
  const m = document.cookie.match(/(?:^|; )factory-consent=([^;]+)/);
  if (!m) return false;
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1]));
    return !!parsed?.marketing;
  } catch {
    return false;
  }
}

/**
 * Maps embed gated by marketing-consent cookie. Loads the iframe lazily only
 * after consent. Falls back to a placeholder + open-in-Maps link otherwise.
 */
export function MapEmbed({ query, consentMessage }: Props) {
  const [allowed, setAllowed] = useState(false);
  const [check, setCheck] = useState(0);

  useEffect(() => {
    setAllowed(hasMarketingConsent());
    const id = setInterval(() => setCheck((n) => n + 1), 1500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setAllowed(hasMarketingConsent());
  }, [check]);

  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  const externalLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-muted">
      {allowed ? (
        <iframe
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={query}
          className="h-72 w-full border-0"
          allow="geolocation"
        />
      ) : (
        <div className="flex h-72 w-full flex-col items-center justify-center gap-3 p-6 text-center text-sm">
          <p className="text-muted-foreground">{consentMessage}</p>
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
          >
            Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
}
