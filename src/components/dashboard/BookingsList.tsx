'use client';

import { useState, useTransition } from 'react';
import { Check, X, Phone, Mail, MessageCircle } from 'lucide-react';
import type { Booking } from '@/lib/supabase/types';

type Status = Booking['status'];

const STATUS_LABEL: Record<Status, string> = {
  pending: 'In attesa',
  confirmed: 'Confermata',
  declined: 'Rifiutata',
  cancelled: 'Annullata',
  no_show: 'No-show',
  completed: 'Completata',
};

const STATUS_TONE: Record<Status, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  declined: 'bg-secondary text-muted-foreground',
  cancelled: 'bg-secondary text-muted-foreground',
  no_show: 'bg-secondary text-muted-foreground',
  completed: 'bg-emerald-100 text-emerald-800',
};

export function BookingsList({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initial);
  const [pending, startTransition] = useTransition();

  function update(id: string, status: Status) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    startTransition(async () => {
      try {
        const res = await fetch(`/api/bookings/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          // Reverte se falhar
          setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: initial.find((x) => x.id === id)?.status ?? 'pending' } : b)),
          );
        }
      } catch {
        // ignore — UI revertida acima
      }
    });
  }

  if (bookings.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nessuna prenotazione ricevuta finora.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {bookings.map((b) => {
        const dt = new Date(b.requested_at);
        return (
          <li
            key={b.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  {b.customer_name} · {b.party_size} {b.party_size === 1 ? 'persona' : 'persone'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dt.toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' })}
                </p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <a href={`tel:${b.customer_phone}`} className="flex items-center gap-1 hover:text-foreground">
                    <Phone className="h-3 w-3" aria-hidden />
                    {b.customer_phone}
                  </a>
                  {b.customer_email && (
                    <a href={`mailto:${b.customer_email}`} className="flex items-center gap-1 hover:text-foreground">
                      <Mail className="h-3 w-3" aria-hidden />
                      {b.customer_email}
                    </a>
                  )}
                  <a
                    href={`https://wa.me/${b.customer_phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <MessageCircle className="h-3 w-3" aria-hidden />
                    WhatsApp
                  </a>
                </div>
                {b.notes && (
                  <p className="mt-2 rounded-md bg-secondary px-2 py-1 text-xs">
                    Note: {b.notes}
                  </p>
                )}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[b.status]}`}>
                {STATUS_LABEL[b.status]}
              </span>
            </div>

            {b.status === 'pending' && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update(b.id, 'declined')}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Rifiuta
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update(b.id, 'confirmed')}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Conferma
                </button>
              </div>
            )}

            {b.status === 'confirmed' && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update(b.id, 'no_show')}
                  className="h-9 flex-1 rounded-md border border-border bg-card text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50"
                >
                  No-show
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => update(b.id, 'completed')}
                  className="h-9 flex-1 rounded-md border border-border bg-card text-sm hover:bg-secondary disabled:opacity-50"
                >
                  Completata
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
