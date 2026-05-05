'use client';

import { useEffect, useState } from 'react';

const COOKIE = 'factory-consent';

type Choice = { necessary: true; analytics: boolean; marketing: boolean };

type Props = {
  messages: {
    title: string;
    body: string;
    necessary: string;
    analytics: string;
    marketing: string;
    accept_all: string;
    save: string;
    reject_all: string;
    always_on: string;
    prefs: string;
  };
};

function readCookie(): Choice | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(/(?:^|; )factory-consent=([^;]+)/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1]));
    if (parsed && typeof parsed === 'object') {
      return {
        necessary: true,
        analytics: !!parsed.analytics,
        marketing: !!parsed.marketing,
      };
    }
  } catch {}
  return null;
}

function writeCookie(choice: Choice) {
  const value = encodeURIComponent(JSON.stringify(choice));
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE}=${value}; path=/; max-age=${oneYear}; samesite=lax`;
}

async function persist(choice: Choice) {
  try {
    await fetch('/api/consents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(choice),
    });
  } catch {
    // best-effort: cookie is the source of truth in v1
  }
}

export function CookieBanner({ messages }: Props) {
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = readCookie();
    if (!stored) {
      setOpen(true);
    } else {
      setAnalytics(stored.analytics);
      setMarketing(stored.marketing);
    }
  }, []);

  function commit(choice: Choice) {
    writeCookie(choice);
    void persist(choice);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 text-xs underline-offset-2 hover:underline"
      >
        {messages.prefs}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={messages.title}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-4 shadow-lg backdrop-blur sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-w-md sm:rounded-lg sm:border"
        >
          <h2 className="font-display text-lg font-semibold">{messages.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{messages.body}</p>

          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex items-center justify-between">
              <span>{messages.necessary}</span>
              <span className="text-xs text-muted-foreground">{messages.always_on}</span>
            </li>
            <li className="flex items-center justify-between">
              <label htmlFor="cookie-analytics" className="cursor-pointer">{messages.analytics}</label>
              <input
                id="cookie-analytics"
                type="checkbox"
                className="h-4 w-4"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
            </li>
            <li className="flex items-center justify-between">
              <label htmlFor="cookie-marketing" className="cursor-pointer">{messages.marketing}</label>
              <input
                id="cookie-marketing"
                type="checkbox"
                className="h-4 w-4"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
            </li>
          </ul>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm"
              onClick={() => commit({ necessary: true, analytics: false, marketing: false })}
            >
              {messages.reject_all}
            </button>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-1.5 text-sm"
              onClick={() => commit({ necessary: true, analytics, marketing })}
            >
              {messages.save}
            </button>
            <button
              type="button"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
              onClick={() => commit({ necessary: true, analytics: true, marketing: true })}
            >
              {messages.accept_all}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
