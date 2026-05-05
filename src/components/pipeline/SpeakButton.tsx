'use client';

/**
 * SpeakButton — plays a script via the device's native TTS, with fallback to
 * pre-recorded MP3 for languages where on-device TTS is unreliable.
 *
 * Tier strategy (see scripts/index.ts → getTtsTier):
 *   - 'native'   → use speechSynthesis directly (it-IT, en-US, etc.)
 *   - 'fallback' → try speechSynthesis, but pre-load MP3 as backup if voice missing
 *   - 'manual'   → skip speechSynthesis entirely, play MP3 from R2
 *
 * MP3 generation (offline) is described in CLAUDE.md.
 */

import { Volume2, Square, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getTtsTier, type TargetLang } from '@/lib/scripts';

type Props = {
  text: string;
  lang: TargetLang;
  /** Pre-recorded MP3 URL for tier 3 fallback (or tier 2 backup). Generated offline via ElevenLabs/Google Neural2. */
  audioUrl?: string;
  rate?: number;
  label?: string;
  onEnd?: () => void;
};

export function SpeakButton({ text, lang, audioUrl, rate = 0.95, label, onEnd }: Props) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [supported, setSupported] = useState(true);
  const [voiceMissing, setVoiceMissing] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const tier = getTtsTier(lang);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    if (tier === 'manual') {
      return;
    }

    const langPrefix = lang.split('-')[0];

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      const localExact = voices.find(v => v.lang === lang && v.localService);
      const localPrefix = voices.find(v => v.lang.startsWith(langPrefix) && v.localService);
      const remoteExact = voices.find(v => v.lang === lang);
      const remotePrefix = voices.find(v => v.lang.startsWith(langPrefix));

      const picked = localExact ?? localPrefix ?? remoteExact ?? remotePrefix ?? null;
      setVoice(picked);
      setVoiceMissing(!picked);
    };

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [lang, tier]);

  const speakViaTts = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    if (voice) u.voice = voice;
    u.rate = rate;
    u.pitch = 1;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const playAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    audio.onerror = () => setIsSpeaking(false);
    audio.play();
  };

  const speak = () => {
    if (tier === 'manual') {
      if (audioUrl) playAudio();
      else speakViaTts();
      return;
    }
    if (tier === 'fallback' && voiceMissing && audioUrl) {
      playAudio();
      return;
    }
    speakViaTts();
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    audioRef.current?.pause();
    setIsSpeaking(false);
  };

  if (!supported && !audioUrl) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle size={16} />
        Sem suporte a voz neste dispositivo. Mostre o texto ao cliente.
      </div>
    );
  }

  const buttonLabel = label ?? (isSpeaking ? 'Parar' : 'Falar para o cliente');

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={isSpeaking ? stop : speak}
        className={`flex items-center justify-center gap-2 rounded-full px-5 py-3 text-base font-medium transition active:scale-95 ${
          isSpeaking ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
        aria-label={buttonLabel}
      >
        {isSpeaking ? <Square size={18} /> : <Volume2 size={18} />}
        <span>{buttonLabel}</span>
      </button>
      {voiceMissing && tier === 'fallback' && !audioUrl && (
        <p className="text-xs text-amber-700">
          ⚠️ Voz nativa não disponível pra {lang}. Considere mostrar o texto ao cliente.
        </p>
      )}
    </div>
  );
}
