import { createAdminClient } from '@/lib/supabase/admin';
import type { Booking } from '@/lib/supabase/types';
import { BookingsList } from '@/components/dashboard/BookingsList';

export const dynamic = 'force-dynamic';

export default async function DashboardBookings({ params }: { params: { tenantId: string } }) {
  const supabase = createAdminClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .eq('tenant_id', params.tenantId)
    .order('requested_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Prenotazioni
        </h1>
        <p className="text-sm text-muted-foreground">
          Conferma o rifiuta le richieste. Il cliente non riceve notifica
          automatica — chiamalo o scrivigli su WhatsApp dopo la conferma.
        </p>
      </header>

      <BookingsList bookings={(bookings ?? []) as Booking[]} />
    </div>
  );
}
