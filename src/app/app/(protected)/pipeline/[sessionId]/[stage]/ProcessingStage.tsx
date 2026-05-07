import { createAdminClient } from '@/lib/supabase/admin';
import type { PitchSession } from '@/lib/supabase/types';
import { ProcessingPoller } from '@/components/pipeline/ProcessingPoller';

export async function ProcessingStage({ session }: { session: PitchSession }) {
  const supabase = createAdminClient();
  const { data: jobRaw } = await supabase
    .from('factory_jobs')
    .select('id, status, error_message, output_data')
    .eq('pitch_session_id', session.id)
    .eq('job_type', 'extract_menu')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const job = jobRaw
    ? {
        id: jobRaw.id as string,
        status: jobRaw.status as 'queued' | 'processing' | 'ready' | 'failed',
        error_message: (jobRaw.error_message as string | null) ?? null,
        output_data: (jobRaw.output_data as { categories_count?: number; items_count?: number } | null) ?? null,
      }
    : null;

  return <ProcessingPoller sessionId={session.id} initialJob={job} />;
}
