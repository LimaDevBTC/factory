'use client';

import { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, Check } from 'lucide-react';

type Photo = {
  id: string;
  preview: string;
  url?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  error?: string;
};

export function PhotoUploader({
  sessionId,
  initialUrls = [],
}: {
  sessionId: string;
  initialUrls?: string[];
}) {
  const [photos, setPhotos] = useState<Photo[]>(
    initialUrls.map((url, i) => ({
      id: `init-${i}`,
      preview: url,
      url,
      status: 'uploaded' as const,
    })),
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newPhotos: Photo[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(f),
      status: 'pending',
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
    Array.from(files).forEach((file, i) => uploadOne(newPhotos[i].id, file));
    if (inputRef.current) inputRef.current.value = '';
  }

  async function uploadOne(id: string, file: File) {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'uploading' } : p)));
    try {
      const fd = new FormData();
      fd.append('session_id', sessionId);
      fd.append('field', 'photo');
      fd.append('file', file);
      const res = await fetch('/api/pipeline/upload', { method: 'POST', body: fd });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error ?? 'upload_failed');
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'uploaded', url: body.url } : p)));
    } catch (e) {
      const error = e instanceof Error ? e.message : 'upload_failed';
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'error', error } : p)));
    }
  }

  function remove(id: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target && target.preview.startsWith('blob:')) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.id !== id);
    });
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-border bg-card text-base font-medium text-muted-foreground transition hover:bg-secondary"
      >
        <Camera className="h-5 w-5" aria-hidden />
        Tirar fotos / escolher
      </button>

      {photos.length > 0 && (
        <ul className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <li key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5">
                {p.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 animate-spin text-white" aria-label="Subindo" />
                )}
                {p.status === 'uploaded' && (
                  <Check className="h-4 w-4 text-emerald-300" aria-label="Enviada" />
                )}
                {p.status === 'error' && (
                  <span className="text-[10px] text-white" title={p.error}>erro</span>
                )}
                {p.status === 'pending' && (
                  <span className="text-[10px] text-white">aguardando</span>
                )}
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  aria-label="Remover foto"
                  className="ml-auto rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
