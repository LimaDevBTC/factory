'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, RotateCw } from 'lucide-react';

type JobStatus = 'queued' | 'processing' | 'ready' | 'failed';

type Props = {
  sessionId: string;
  initialJob: {
    id: string;
    status: JobStatus;
    error_message: string | null;
    output_data: { categories_count?: number; items_count?: number } | null;
  } | null;
};

const TIPS = [
  'Tu volta pra mesa, eu te aviso. Toma um caffè.',
  'Claude tá lendo as fotos do menu. Demora 30-60s normalmente.',
  'Categorias + items + allergens sendo extraídos.',
  'Quando ficar pronto a tela troca sozinha.',
];

export function ProcessingPoller({ sessionId, initialJob }: Props) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [error, setError] = useState<string | null>(null);
  const [tipIdx, setTipIdx] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // Auto-fire job se ainda não existe
  useEffect(() => {
    if (job) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/jobs/extract-menu', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ pitch_session_id: sessionId }),
        });
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok || !body.ok) {
          setError(body.error ?? 'falha ao iniciar job');
          return;
        }
        setJob({ id: body.job_id, status: body.status, error_message: null, output_data: null });
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'falha ao iniciar job');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [job, sessionId]);

  // Polling
  useEffect(() => {
    if (!job || job.status === 'ready' || job.status === 'failed') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/extract-menu?pitch_session_id=${encodeURIComponent(sessionId)}`);
        const body = await res.json();
        if (body.job) setJob(body.job);
      } catch {
        // silenciar — próximo tick tenta de novo
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [job, sessionId]);

  // Advance to /ready quando job completa
  useEffect(() => {
    if (job?.status === 'ready') {
      router.push(`/pipeline/${sessionId}/ready`);
      router.refresh();
    }
  }, [job, sessionId, router]);

  // Tip rotation
  useEffect(() => {
    const id = setInterval(() => setTipIdx((i) => (i + 1) % TIPS.length), 4500);
    return () => clearInterval(id);
  }, []);

  async function retry() {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch('/api/jobs/extract-menu', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pitch_session_id: sessionId }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        setError(body.error ?? 'falha ao reiniciar');
      } else {
        setJob({ id: body.job_id, status: body.status, error_message: null, output_data: null });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'falha ao reiniciar');
    } finally {
      setRetrying(false);
    }
  }

  if (job?.status === 'failed' || error) {
    return (
      <div className="space-y-4 rounded-xl border border-destructive/40 bg-destructive/5 p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden />
          <p className="font-medium">Job falhou</p>
        </div>
        <p className="text-sm">{job?.error_message ?? error ?? 'erro desconhecido'}</p>
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-4 text-sm hover:bg-secondary disabled:opacity-50"
        >
          <RotateCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} aria-hidden />
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center">
      <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" aria-hidden />
      <p className="mt-4 font-display text-lg">{TIPS[tipIdx]}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Status: <span className="font-mono">{job?.status ?? 'iniciando…'}</span>
      </p>
    </div>
  );
}
