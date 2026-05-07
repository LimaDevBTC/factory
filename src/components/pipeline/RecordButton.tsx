'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Check } from 'lucide-react';

type Props = {
  sessionId: string;
  field: 'consent_audio' | 'owner_voice';
  initialUrl?: string | null;
  /** Limite máximo em segundos. Default 60s (capture: 30s; consent: 10s seguro). */
  maxSeconds?: number;
  /** Callback quando upload completa com URL. */
  onUploaded?: (url: string) => void;
};

type State =
  | { kind: 'idle'; url: string | null }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'recorded'; blob: Blob; url: string }
  | { kind: 'uploading' }
  | { kind: 'uploaded'; url: string }
  | { kind: 'error'; message: string };

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

function pickMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return 'audio/webm';
}

export function RecordButton({ sessionId, field, initialUrl, maxSeconds = 60, onUploaded }: Props) {
  const [state, setState] = useState<State>({ kind: 'idle', url: initialUrl ?? null });
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setState({ kind: 'recorded', blob, url });
        if (tickRef.current) window.clearInterval(tickRef.current);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      recorder.start();
      recorderRef.current = recorder;
      setState({ kind: 'recording', startedAt: Date.now() });
      setElapsed(0);
      tickRef.current = window.setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next >= maxSeconds && recorder.state === 'recording') {
            recorder.stop();
          }
          return next;
        });
      }, 1000);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Acesso ao microfone negado';
      setState({ kind: 'error', message });
    }
  }

  function stop() {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  }

  function discard() {
    if (state.kind === 'recorded') URL.revokeObjectURL(state.url);
    setState({ kind: 'idle', url: null });
  }

  async function upload() {
    if (state.kind !== 'recorded') return;
    setState({ kind: 'uploading' });
    try {
      const fd = new FormData();
      fd.append('session_id', sessionId);
      fd.append('field', field);
      fd.append('file', state.blob, `${field}.webm`);
      const res = await fetch('/api/pipeline/upload', { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'upload_failed');
      setState({ kind: 'uploaded', url: body.url });
      onUploaded?.(body.url);
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'upload_failed' });
    }
  }

  if (state.kind === 'idle' && state.url) {
    return (
      <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm text-emerald-900">
          <Check className="h-4 w-4" aria-hidden />
          <span>Gravação salva</span>
        </div>
        <audio src={state.url} controls className="w-full" />
        <button
          type="button"
          onClick={() => setState({ kind: 'idle', url: null })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
          Gravar de novo
        </button>
      </div>
    );
  }

  if (state.kind === 'idle') {
    return (
      <button
        type="button"
        onClick={start}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-destructive px-4 text-base font-medium text-destructive-foreground shadow-sm transition hover:opacity-90"
      >
        <Mic className="h-5 w-5" aria-hidden />
        Gravar
      </button>
    );
  }

  if (state.kind === 'recording') {
    return (
      <button
        type="button"
        onClick={stop}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-destructive px-4 text-base font-medium text-destructive-foreground shadow-sm transition"
      >
        <span className="h-3 w-3 animate-pulse rounded-full bg-white" aria-hidden />
        <Square className="h-5 w-5" aria-hidden />
        Parar ({elapsed}s / {maxSeconds}s)
      </button>
    );
  }

  if (state.kind === 'recorded') {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <audio src={state.url} controls className="w-full" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={discard}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-sm hover:bg-secondary"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Descartar
          </button>
          <button
            type="button"
            onClick={upload}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground"
          >
            <Check className="h-4 w-4" aria-hidden />
            Salvar
          </button>
        </div>
      </div>
    );
  }

  if (state.kind === 'uploading') {
    return (
      <div className="flex h-12 items-center justify-center rounded-md border border-border bg-secondary text-sm text-muted-foreground">
        Subindo gravação…
      </div>
    );
  }

  if (state.kind === 'uploaded') {
    return (
      <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-2 text-sm text-emerald-900">
          <Check className="h-4 w-4" aria-hidden />
          <span>Gravação salva</span>
        </div>
        <audio src={state.url} controls className="w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
        {state.kind === 'error' ? state.message : 'Erro'}
      </p>
      <button
        type="button"
        onClick={() => setState({ kind: 'idle', url: null })}
        className="text-xs underline-offset-2 hover:underline"
      >
        Tentar de novo
      </button>
    </div>
  );
}
