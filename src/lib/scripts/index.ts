/**
 * Scripts module — multilingual sales pipeline playbook.
 *
 * Architecture:
 *   - PT coaching (`coaching_pt`) is the same regardless of target language.
 *     The PT coaching is OPERATOR-FACING; it doesn't change by who the owner is.
 *   - TTS scripts (`it_main`, `variants`) ARE language-specific and live in
 *     `./scripts/{lang}.ts`. They are not literal translations — they are
 *     culturally adapted by/with native speakers.
 *
 * To add a new language:
 *   1. Create `./scripts/{lang}.ts` (e.g. `./scripts/zh-CN.ts`)
 *   2. Have a native speaker review/adapt cultural details (greetings, deference,
 *      pacing, taboos)
 *   3. Register in `SCRIPTS_REGISTRY` below
 *   4. Add to `default_locale` constraint in supabase/schema.sql if it's a new
 *      language code not yet there
 */

import { italianScripts } from './scripts/it';
import { mandarinScripts } from './scripts/zh-CN';
import { arabicScripts } from './scripts/ar';
import { hindiScripts } from './scripts/hi-IN';
import { englishScripts } from './scripts/en';

export const PIPELINE_STAGES = [
  'approach',
  'consent',
  'capture',
  'processing',
  'ready',
  'present',
  'pricing',
  'close',
] as const;

export type Stage = (typeof PIPELINE_STAGES)[number];
export type Outcome = 'won' | 'lost' | 'thinking' | 'no_show' | 'archived';

/**
 * BCP-47 language tags. Used for TTS lang attribute and for selecting scripts.
 * Keep in sync with supabase/schema.sql `default_locale` constraint.
 */
export type TargetLang =
  // Tier 1: TTS native quality everywhere
  | 'it-IT' | 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'pt-BR' | 'pt-PT'
  // Tier 2: TTS works, quality varies
  | 'zh-CN' | 'zh-TW' | 'ar-SA' | 'ar-EG' | 'hi-IN' | 'pa-IN' | 'ro-RO'
  | 'ru-RU' | 'uk-UA' | 'tr-TR' | 'ja-JP' | 'ko-KR'
  // Tier 3: TTS limited, fallback to pre-recorded MP3
  | 'sq-AL' | 'bn-IN' | 'am-ET' | 'tl-PH' | 'vi-VN' | 'ur-PK';

export type TtsTier = 'native' | 'fallback' | 'manual';

export function getTtsTier(lang: TargetLang): TtsTier {
  const tier1: TargetLang[] = ['it-IT','en-US','en-GB','es-ES','fr-FR','de-DE','pt-BR','pt-PT'];
  const tier2: TargetLang[] = ['zh-CN','zh-TW','ar-SA','ar-EG','hi-IN','pa-IN','ro-RO','ru-RU','uk-UA','tr-TR','ja-JP','ko-KR'];
  if (tier1.includes(lang)) return 'native';
  if (tier2.includes(lang)) return 'fallback';
  return 'manual';
}

/**
 * Display info per language — for the picker UI in factory/new
 */
export const LANG_INFO: Record<TargetLang, {
  flag: string;          // emoji flag for the picker
  label_pt: string;      // shown to Edson in the picker
  endonym: string;       // how the language calls itself (shown for confirmation)
  rtl?: boolean;         // for the script preview UI
}> = {
  'it-IT':  { flag: '🇮🇹', label_pt: 'Italiano',                endonym: 'Italiano' },
  'en-US':  { flag: '🇺🇸', label_pt: 'Inglês (americano)',      endonym: 'English' },
  'en-GB':  { flag: '🇬🇧', label_pt: 'Inglês (britânico)',      endonym: 'English' },
  'es-ES':  { flag: '🇪🇸', label_pt: 'Espanhol',                endonym: 'Español' },
  'fr-FR':  { flag: '🇫🇷', label_pt: 'Francês',                 endonym: 'Français' },
  'de-DE':  { flag: '🇩🇪', label_pt: 'Alemão',                  endonym: 'Deutsch' },
  'pt-BR':  { flag: '🇧🇷', label_pt: 'Português (BR)',          endonym: 'Português' },
  'pt-PT':  { flag: '🇵🇹', label_pt: 'Português (PT)',          endonym: 'Português' },
  'zh-CN':  { flag: '🇨🇳', label_pt: 'Mandarim (simplificado)', endonym: '中文（简体）' },
  'zh-TW':  { flag: '🇹🇼', label_pt: 'Mandarim (tradicional)',  endonym: '中文（繁體）' },
  'ar-SA':  { flag: '🇸🇦', label_pt: 'Árabe (padrão)',          endonym: 'العربية', rtl: true },
  'ar-EG':  { flag: '🇪🇬', label_pt: 'Árabe (egípcio)',         endonym: 'العربية', rtl: true },
  'hi-IN':  { flag: '🇮🇳', label_pt: 'Hindi',                   endonym: 'हिन्दी' },
  'pa-IN':  { flag: '🇮🇳', label_pt: 'Punjabi',                 endonym: 'ਪੰਜਾਬੀ' },
  'ro-RO':  { flag: '🇷🇴', label_pt: 'Romeno',                  endonym: 'Română' },
  'ru-RU':  { flag: '🇷🇺', label_pt: 'Russo',                   endonym: 'Русский' },
  'uk-UA':  { flag: '🇺🇦', label_pt: 'Ucraniano',               endonym: 'Українська' },
  'tr-TR':  { flag: '🇹🇷', label_pt: 'Turco',                   endonym: 'Türkçe' },
  'ja-JP':  { flag: '🇯🇵', label_pt: 'Japonês',                 endonym: '日本語' },
  'ko-KR':  { flag: '🇰🇷', label_pt: 'Coreano',                 endonym: '한국어' },
  'sq-AL':  { flag: '🇦🇱', label_pt: 'Albanês',                 endonym: 'Shqip' },
  'bn-IN':  { flag: '🇧🇩', label_pt: 'Bengali',                 endonym: 'বাংলা' },
  'am-ET':  { flag: '🇪🇹', label_pt: 'Amárico',                 endonym: 'አማርኛ' },
  'tl-PH':  { flag: '🇵🇭', label_pt: 'Filipino/Tagalo',         endonym: 'Tagalog' },
  'vi-VN':  { flag: '🇻🇳', label_pt: 'Vietnamita',              endonym: 'Tiếng Việt' },
  'ur-PK':  { flag: '🇵🇰', label_pt: 'Urdu',                    endonym: 'اردو', rtl: true },
};

export type Variant = {
  key: string;
  label_pt: string;
  /** Translated/adapted text for this language */
  text: string;
  when_pt?: string;
};

export type StageScript = {
  stage: Stage;
  order: number;
  /** Title shown in operator UI (always PT) */
  title_pt: string;
  /** Coaching shown to Edson (always PT, language-agnostic) */
  coaching_pt: string;
  /** Form fields the operator should fill at this stage */
  fields?: string[];
  /** Main script in the target language */
  main?: string;
  /** Alternative scripts for context-specific situations */
  variants?: Variant[];
  /** Label of the "next" button in the operator UI */
  next_button_pt: string;
  /** Whether stage allows skipping */
  skippable?: boolean;
  /** Optional pre-recorded audio URL (for Tier 3 languages where TTS is unreliable) */
  audio_url?: string;
};

/**
 * Common Portuguese coaching shared across all target languages.
 * The pitch coaching for Edson doesn't depend on which language he's pitching in —
 * the structure of the sales conversation is universal; only the words spoken
 * to the owner change.
 */
export const COMMON_COACHING_PT: Record<Stage, Pick<StageScript, 'title_pt' | 'coaching_pt' | 'fields' | 'next_button_pt'>> = {
  approach: {
    title_pt: '1. Abordagem',
    coaching_pt:
      'Espere o atendimento ficar livre. Faça contato visual antes de falar. Sorria. Não tem pressa.\n\n' +
      'Toque o áudio. DEIXE O TELEFONE FALAR — sua pronúncia não-nativa pode minar a credibilidade. ' +
      'Pra culturas asiáticas, oriente-se ao mais velho/sênior primeiro.',
    next_button_pt: 'Aceitou ouvir → próximo',
  },
  consent: {
    title_pt: '2. Consentimento',
    coaching_pt:
      'Antes de tirar foto do interior, do dono, ou usar o nome do estabelecimento, grave o consentimento.\n\n' +
      'Toque o áudio em seguida pressione "🎙 Gravar consentimento". Peça pra ele dizer "sim" na própria língua dele ' +
      '(sì / yes / 是的 / نعم / हाँ / etc).\n\n' +
      'Esse arquivo te protege juridicamente. Não pule.',
    next_button_pt: 'Consentimento gravado → próximo',
  },
  capture: {
    title_pt: '3. Coleta',
    coaching_pt:
      'Pergunte abertamente. Deixe ele falar.\n\n' +
      'Fotos a tirar:\n' +
      '• Fachada (obrigatória)\n' +
      '• Interior (com permissão)\n' +
      '• Dono atrás do balcão (alta conversão)\n' +
      '• Menu / vitrine (1-10 fotos)\n\n' +
      'Botão verde "🎙 Voz do dono": peça 30s dele descrevendo o lugar — alimenta a tagline e vira persona do agente WhatsApp.\n\n' +
      'Dados estruturados:\n' +
      '• Nome do estabelecimento\n' +
      '• Endereço\n' +
      '• P.IVA (delicado — pergunta no fim)\n' +
      '• Telefone / WhatsApp\n' +
      '• **Email pessoal do dono** (CRÍTICO — pra ele receber magic link, recibo, suporte)\n' +
      '• Horários\n' +
      '• Vibe (gelateria? caffetteria? ristorante? — pergunta direta)\n' +
      '• Idiomas que o dono quer no SITE (italiano sempre, mais EN/DE/língua nativa pro nicho dele)\n\n' +
      'O email é CHAVE — sem email correto, ele não recebe nada após o checkout. Confirma duas vezes a digitação. ' +
      'Se ele tiver "info@negocio.it" e "marcopersonal@gmail.com", o admin é o pessoal, o info@ vai pro site público.',
    fields: ['nome', 'indirizzo', 'p_iva', 'telefono', 'whatsapp', 'contact_email', 'public_email', 'orari', 'vibe', 'site_locales', 'photos', 'owner_voice'],
    next_button_pt: 'Coleta completa → processar',
  },
  processing: {
    title_pt: '4. Processando',
    coaching_pt:
      'Job rodando em background. Volta pra mesa, come/bebe.\n\n' +
      'ETA: 30-60s. Notificação push quando estiver pronto.\n\n' +
      'Se der erro: app te avisa, dá pra tentar novamente sem perder dados.',
    next_button_pt: 'Aguardando job…',
  },
  ready: {
    title_pt: '5. Pronto pra apresentar',
    coaching_pt:
      'Site gerado. Antes de mostrar:\n\n' +
      '1. Modo paisagem, brilho no máximo, tela cheia\n' +
      '2. Rolada rápida (30s) — preço errado? descrição estranha? alérgeno faltando?\n' +
      '3. Corrige óbvios inline (toque pra editar)\n' +
      '4. Vai até ele com calma',
    next_button_pt: 'Vou apresentar agora',
  },
  present: {
    title_pt: '6. Apresentação',
    coaching_pt:
      'Entrega o celular na mão dele em modo paisagem. Deixa ele tocar, rolar, mexer. Não explica — deixa o produto falar.\n\n' +
      'Depois do áudio: SILÊNCIO. Espera ele reagir. Quem fala primeiro perde força.\n\n' +
      'Linguagem corporal: sorriso + zoom em fotos = quente. Cara séria + telefone devolvido rápido = ainda dá pra recuperar com preço.',
    next_button_pt: 'Ele viu, vou pro preço',
  },
  pricing: {
    title_pt: '7. Preço',
    coaching_pt:
      '**Modelo v1: pacotes pré-pagos em dinheiro.** Cliente paga à vista, sem recurring, sem Stripe necessário.\n\n' +
      '**Apresenta 3 opções (anchor visual no 12 meses como "popular"):**\n' +
      '• 3 meses — €50 cash (entry-level, trial pago — €16,67/mês)\n' +
      '• 6 meses — €99 cash (sweet spot — €16,50/mês)\n' +
      '• **12 meses — €179 cash** ⭐ "scelta più popolare", custom domain incluso (€14,92/mês)\n\n' +
      'Empiricamente espera 30% no 3mo, 50% no 6mo, 20% no 12mo. Cash médio por venda: ~€113.\n\n' +
      'Variant `spinta_12mo`: oferece custom domain pra empurrar do 6mo pro 12mo. Use quando cliente abriu carteira sem hesitar.\n\n' +
      'Variant `so_3mo_6mo`: esconde a opção 12 meses. Use com cliente cauteloso/primeiro contato com tech, evita susto.\n\n' +
      'Cliente pediu feature avançada (custom domain, mais idiomas, reservas)? Use variant `upsell_growth` — Growth 6mo €170.\n\n' +
      'Cliente é restaurante grande, multi-unidade, ou pediu integração? Pro 6mo €490 — só se ele puxar.\n\n' +
      'NUNCA dê desconto não solicitado. NUNCA prometa lifetime.\n\n' +
      '**Quando ele aceitar pagar:**\n' +
      '1. Abre app, mostra checkboxes ToS/Privacy/DPA + **renúncia ao direito de arrependimento** (necessária pra cash sem refund obrigatório)\n' +
      '2. Recebe o dinheiro físico (conta na frente dele, ele conta de volta)\n' +
      '3. Toca "Confirma ricevuto in contanti" — gera recibo PDF e manda por WhatsApp/email\n' +
      '4. Site vai live na hora, válido por 3/6/12 meses conforme pacote\n' +
      '5. Sistema agenda emails de renovação 30/7/1 dias antes do vencimento',
    next_button_pt: 'Falei o preço',
  },
  close: {
    title_pt: '8. Fechamento',
    coaching_pt:
      'Pergunta DIRETA. Silêncio depois — não preencha o vazio.\n\n' +
      '✅ COMPROU (cash) → checkboxes ToS/Privacy/DPA → recebe dinheiro → "Confirmar recebimento" → recibo PDF via WhatsApp\n' +
      '✅ COMPROU (Stripe link) → manda link via WhatsApp/email, site vai live quando webhook confirmar\n' +
      '🤔 VAI PENSAR → preview 30 dias, follow-up automático em 3 e 14 dias\n' +
      '❌ RECUSOU → registra motivo, sai elegante (pode te indicar pro vizinho)\n\n' +
      'Não tente reverter um "não" forte.',
    next_button_pt: 'Registrar resultado',
  },
};

/**
 * Registry of all language-specific script files.
 * Each file exports an array of StageScript matching the COMMON_COACHING_PT.
 */
export const SCRIPTS_REGISTRY: Partial<Record<TargetLang, StageScript[]>> = {
  'it-IT': italianScripts,
  'en-US': englishScripts,
  'zh-CN': mandarinScripts,
  'ar-SA': arabicScripts,
  'hi-IN': hindiScripts,
  // others added as native speakers review them
};

export function getScripts(lang: TargetLang): StageScript[] {
  const scripts = SCRIPTS_REGISTRY[lang];
  if (!scripts) {
    throw new Error(`No scripts registered for ${lang}. Add ./scripts/${lang}.ts and register in SCRIPTS_REGISTRY.`);
  }
  return scripts;
}

export function getStage(lang: TargetLang, stage: Stage): StageScript {
  const s = getScripts(lang).find(x => x.stage === stage);
  if (!s) throw new Error(`Stage ${stage} missing for ${lang}`);
  return s;
}

export function nextStage(stage: Stage): Stage | null {
  const idx = PIPELINE_STAGES.indexOf(stage);
  if (idx === -1 || idx === PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[idx + 1];
}

export const SUPPORTED_LANGS_FOR_PITCH: TargetLang[] = Object.keys(SCRIPTS_REGISTRY) as TargetLang[];

export const OUTCOME_REASONS_PT = [
  { key: 'price', label: 'Achou caro' },
  { key: 'no_decision_maker', label: 'Não é o decisor (sócio, esposa, etc.)' },
  { key: 'already_has_site', label: 'Já tem site' },
  { key: 'distrusts_tech', label: 'Desconfia de tecnologia' },
  { key: 'language_barrier', label: 'Barreira de idioma forte demais (TTS falhou?)' },
  { key: 'cultural_mismatch', label: 'Adaptação cultural do pitch ficou estranha' },
  { key: 'timing', label: 'Não é o momento (em reforma, mudança, etc.)' },
  { key: 'no_p_iva', label: 'Sem P.IVA / informal' },
  { key: 'closed_to_pitch', label: 'Não quis ouvir / ocupado' },
  { key: 'other', label: 'Outro' },
];
