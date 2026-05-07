import { createAdminClient } from '@/lib/supabase/admin';
import type { PitchSession } from '@/lib/supabase/types';

export type PipelineSummary = {
  inFlight: PitchSession[];
  recent: PitchSession[];
  kpis: {
    won: number;
    lost: number;
    thinking: number;
    inFlightCount: number;
  };
};

/**
 * Lista pitch sessions de um operador (em curso + recentes) + agregados.
 * Em curso = sem outcome. Recentes = qualquer outcome, últimos 30 dias.
 */
export async function loadPipelineForOperator(operatorId: string): Promise<PipelineSummary> {
  const supabase = createAdminClient();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: inFlight }, { data: recent }] = await Promise.all([
    supabase
      .from('pitch_sessions')
      .select('*')
      .eq('operator_id', operatorId)
      .is('outcome', null)
      .order('updated_at', { ascending: false }),
    supabase
      .from('pitch_sessions')
      .select('*')
      .eq('operator_id', operatorId)
      .not('outcome', 'is', null)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const recentRows = (recent ?? []) as PitchSession[];
  const won = recentRows.filter((r) => r.outcome === 'won').length;
  const lost = recentRows.filter((r) => r.outcome === 'lost').length;
  const thinking = recentRows.filter((r) => r.outcome === 'thinking').length;

  return {
    inFlight: (inFlight ?? []) as PitchSession[],
    recent: recentRows,
    kpis: {
      won,
      lost,
      thinking,
      inFlightCount: (inFlight ?? []).length,
    },
  };
}
