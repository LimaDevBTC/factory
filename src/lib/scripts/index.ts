/**
 * Pipeline playbook — Portuguese coaching + optional Italian cheat-sheet.
 *
 * v1 simplificado: zero infraestrutura multilíngue. O operador (Edson) lê o
 * coaching em PT, e cada estágio carrega uma sugestão de frase em italiano
 * (`italian_hint`) que ele pode ler/improvisar com o dono. Sem TTS, sem
 * SpeakButton, sem registry de idiomas. Quando v1.x precisar de scripts em
 * outros idiomas (chinês, árabe, hindi pra diáspora), volta como tarefa nova
 * — git history preserva a versão multilíngue anterior.
 *
 * Pipeline = state machine: stages avançam, outcomes registrados, falha é
 * dado. NÃO é wizard.
 */

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

export type ItalianVariant = {
  /** Nome curto da variante em PT. Ex.: "Versão curta (lugar movimentado)" */
  label_pt: string;
  /** Quando usar (PT). Opcional. */
  when_pt?: string;
  /** Frase em italiano pra ler/improvisar com o dono. */
  text: string;
};

export type StagePlaybook = {
  stage: Stage;
  order: number;
  /** Título do card no operator UI (PT). */
  title_pt: string;
  /** Coaching pro Edson — o que pensar/observar/fazer (PT). */
  coaching_pt: string;
  /** Campos a preencher neste estágio (operator form). */
  fields?: string[];
  /** Label do botão de avanço (PT). */
  next_button_pt: string;
  /** Sugestão de frase em italiano (cheat-sheet, opcional). */
  italian_hint?: string;
  /** Variantes pra contextos diferentes. */
  italian_variants?: ItalianVariant[];
};

export const PIPELINE_PLAYBOOK: Record<Stage, StagePlaybook> = {
  approach: {
    stage: 'approach',
    order: 1,
    title_pt: '1. Abordagem',
    coaching_pt:
      'Espere o atendimento ficar livre. Faça contato visual antes de falar. Sorria. Não tem pressa.\n\n' +
      'Lê a sugestão IT abaixo e improvisa com naturalidade — não decora.',
    next_button_pt: 'Aceitou ouvir → próximo',
    italian_hint:
      'Buongiorno, sono Edson, sono brasiliano ma vivo qui. Faccio una cosa che si chiama Factory: in dieci minuti, davanti a te, ti faccio vedere come sarebbe il sito web del tuo locale. Senza impegno, senza pagamento, niente. Se ti piace ne parliamo. Se no, prendo un caffè e ti saluto. Posso?',
    italian_variants: [
      {
        label_pt: 'Versão curta (lugar movimentado)',
        when_pt: 'Lugar cheio, dono tem 10 segundos',
        text: 'Buongiorno, sono Edson. In dieci minuti ti faccio vedere come sarebbe il sito del tuo locale. Gratis, senza impegno. Posso?',
      },
      {
        label_pt: 'Versão calorosa (trattoria familiar)',
        when_pt: 'Trattoria/agriturismo, tom familiar funciona melhor',
        text: 'Buongiorno, mi scusi il disturbo. Mi chiamo Edson, sono brasiliano. Aiuto i locali come il vostro a essere visibili online — turisti, clienti nuovi, quel tipo di cose. Se mi dà dieci minuti, le mostro qualcosa di concreto fatto sul vostro locale. Senza pagare niente, senza impegno. Le va?',
      },
    ],
  },
  consent: {
    stage: 'consent',
    order: 2,
    title_pt: '2. Consentimento',
    coaching_pt:
      'Antes de tirar foto do interior, do dono, ou usar o nome do estabelecimento, grave o consentimento.\n\n' +
      'Pede pra ele dizer "sì" enquanto você grava (botão 🎙). Esse arquivo te protege juridicamente. Não pule.',
    next_button_pt: 'Consentimento gravado → próximo',
    italian_hint:
      'Allora, prima di iniziare, posso registrare un secondo che mi dai il permesso di fare delle foto e di usare il nome del tuo locale per la prova? Solo per essere a posto. Basta che dici "sì certo".',
  },
  capture: {
    stage: 'capture',
    order: 3,
    title_pt: '3. Coleta',
    coaching_pt:
      'Pergunte abertamente. Deixe ele falar.\n\n' +
      'Fotos a tirar:\n' +
      '• Fachada (obrigatória)\n' +
      '• Interior (com permissão)\n' +
      '• Dono atrás do balcão (alta conversão)\n' +
      '• Menu / vitrine (1-10 fotos)\n\n' +
      'Botão verde "🎙 Voz do dono": peça 30s dele descrevendo o lugar — alimenta a tagline.\n\n' +
      'Dados estruturados:\n' +
      '• Nome do estabelecimento\n' +
      '• Endereço\n' +
      '• P.IVA (delicado — pergunta no fim)\n' +
      '• Telefone / WhatsApp\n' +
      '• **Email pessoal do dono** (CRÍTICO — magic link, recibo, suporte)\n' +
      '• Horários\n' +
      '• Vibe (gelateria? caffetteria? ristorante? — pergunta direta)\n' +
      '• Idiomas que o dono quer no SITE (italiano sempre, mais EN/DE)\n\n' +
      'Confirma a digitação do email duas vezes. Se ele tiver "info@negocio.it" e "marcopersonal@gmail.com", o admin é o pessoal, o info@ vai pro site público.',
    fields: ['nome', 'indirizzo', 'p_iva', 'telefono', 'whatsapp', 'contact_email', 'public_email', 'orari', 'vibe', 'site_locales', 'photos', 'owner_voice'],
    next_button_pt: 'Coleta completa → processar',
    italian_hint:
      'Mi descrivi un attimo il tuo locale? Come lo presenteresti a un cliente nuovo che entra per la prima volta?',
    italian_variants: [
      {
        label_pt: 'Confirma vibe',
        text: 'Tu come ti descriveresti? Sei più una trattoria familiare, una caffetteria moderna, un wine bar...?',
      },
      {
        label_pt: 'Horários',
        text: 'Mi puoi dire gli orari di apertura, durante la settimana e nel weekend?',
      },
      {
        label_pt: 'P.IVA (no fim)',
        when_pt: 'Pergunta no fim, depois de criar rapport',
        text: 'Per il sito mi serve la partita IVA, te la chiedo poi prima di pubblicare. Va bene?',
      },
      {
        label_pt: 'Email do dono (CRÍTICO)',
        when_pt: 'Confirma duas vezes a digitação',
        text: "Mi serve la tua email per mandarti l'accesso al pannello e la ricevuta. Mi puoi dettarla? Lentamente, così non sbaglio.",
      },
      {
        label_pt: 'Email público do negócio',
        when_pt: 'Se houver info@/contatti@ separado',
        text: "Hai un'email pubblica del locale, tipo info@ o contatti@? Quella va sul sito, la tua personale resta privata.",
      },
    ],
  },
  processing: {
    stage: 'processing',
    order: 4,
    title_pt: '4. Processando',
    coaching_pt:
      'Job rodando em background. Volta pra mesa, come/bebe.\n\n' +
      'ETA: 30-60s. Notificação push quando estiver pronto.\n\n' +
      'Se der erro: app te avisa, dá pra tentar de novo sem perder dados.',
    next_button_pt: 'Aguardando job…',
  },
  ready: {
    stage: 'ready',
    order: 5,
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
    stage: 'present',
    order: 6,
    title_pt: '6. Apresentação',
    coaching_pt:
      'Entrega o celular na mão dele em modo paisagem. Deixa ele tocar, rolar, mexer. Não explica — deixa o produto falar.\n\n' +
      'Depois da frase: SILÊNCIO. Espera ele reagir. Quem fala primeiro perde força.\n\n' +
      'Linguagem corporal: sorriso + zoom em fotos = quente. Cara séria + telefone devolvido rápido = ainda dá pra recuperar com preço.',
    next_button_pt: 'Ele viu, vou pro preço',
    italian_hint: 'Guarda cosa ho preparato per te. Prendilo, gioca con lui. Dimmi cosa ne pensi.',
  },
  pricing: {
    stage: 'pricing',
    order: 7,
    title_pt: '7. Preço',
    coaching_pt:
      '**Modelo v1: pacotes pré-pagos em dinheiro.** Cliente paga à vista, sem recurring, sem Stripe necessário.\n\n' +
      '**Apresenta 3 opções (anchor visual no 12 meses como "popular"):**\n' +
      '• 3 meses — €50 cash (entry-level, trial pago — €16,67/mês)\n' +
      '• 6 meses — €99 cash (sweet spot — €16,50/mês)\n' +
      '• **12 meses — €179 cash** ⭐ "scelta più popolare", custom domain incluso (€14,92/mês)\n\n' +
      'Empiricamente espera 30% no 3mo, 50% no 6mo, 20% no 12mo. Cash médio: ~€113.\n\n' +
      'Variantes (abaixo) cobrem cliente convicto, cliente cauteloso, upsell e voucher.\n\n' +
      'NUNCA dê desconto não solicitado. NUNCA prometa lifetime.\n\n' +
      '**Quando ele aceitar pagar:**\n' +
      '1. Abre app, mostra checkboxes ToS/Privacy/DPA + **renúncia ao direito de arrependimento**\n' +
      '2. Recebe o dinheiro físico (conta na frente dele, ele conta de volta)\n' +
      '3. Toca "Confirma ricevuto in contanti" — gera recibo PDF e manda por WhatsApp/email\n' +
      '4. Site vai live na hora, válido por 3/6/12 meses conforme pacote\n' +
      '5. Sistema agenda emails de renovação 30/7/1 dias antes do vencimento',
    next_button_pt: 'Falei o preço',
    italian_hint:
      'Allora, sono tre opzioni semplici. Pacchetto tre mesi, cinquanta euro in contanti. Pacchetto sei mesi, novantanove euro tutto compreso, ti dimentichi del pagamento per sei mesi. Pacchetto dodici mesi, centosettantanove euro — è la scelta più popolare e ci metto dentro anche il dominio personalizzato. Tu cosa preferisci?',
    italian_variants: [
      {
        label_pt: 'Empurra pra 12 meses',
        when_pt: 'Cliente convicto, abriu carteira sem hesitar',
        text: "Senti, se vai sui dodici mesi ti includo il dominio personalizzato — tipo trattoriadamarco.it. Vale quaranta euro l'anno, e il sito sembra molto più professionale. È quello che fa la differenza con Google.",
      },
      {
        label_pt: 'Cliente cauteloso (esconde 12mo)',
        when_pt: 'Hesitante, primeiro contato com tech',
        text: 'Allora ti propongo due opzioni semplici: tre mesi a cinquanta euro per provare, o sei mesi a novantanove se ti senti tranquillo. Decidi tu.',
      },
      {
        label_pt: 'Voucher Digitalizzazione',
        when_pt: 'Pra Growth/Pro tier',
        text: "Per i piani superiori c'è anche il Voucher Digitalizzazione, lo Stato copre la metà.",
      },
      {
        label_pt: 'Upsell pra Growth',
        when_pt: 'Pediu feature avançada (custom domain, mais idiomas)',
        text: "Per quello che mi chiedi serve il piano Growth — sei mesi a centosettanta in contanti. Include dominio personalizzato, prenotazioni e fino a tre lingue.",
      },
      {
        label_pt: 'Âncora da concorrência',
        when_pt: 'ANTES do preço — ancora valor',
        text: "Guarda, ho controllato i 5 locali più vicini al tuo. Nessuno ha un sito decente. Per cinquanta euro provi tre mesi. Se non funziona, non rinnovi.",
      },
    ],
  },
  close: {
    stage: 'close',
    order: 8,
    title_pt: '8. Fechamento',
    coaching_pt:
      'Pergunta DIRETA. Silêncio depois — não preencha o vazio.\n\n' +
      '✅ COMPROU (cash) → checkboxes ToS/Privacy/DPA → recebe dinheiro → "Confirmar recebimento" → recibo PDF via WhatsApp\n' +
      '🤔 VAI PENSAR → preview 30 dias, follow-up automático em 3 e 14 dias\n' +
      '❌ RECUSOU → registra motivo, sai elegante (pode te indicar pro vizinho)\n\n' +
      'Não tente reverter um "não" forte.',
    next_button_pt: 'Registrar resultado',
    italian_hint: 'Allora, lo prendi? Posso prendere il pagamento adesso?',
    italian_variants: [
      {
        label_pt: 'Vai pensar',
        text: "Tranquillo, pensaci. Ti lascio il link del preview, ce l'hai per 30 giorni. Ti scrivo io fra qualche giorno per vedere come va. Va bene?",
      },
      {
        label_pt: 'Saída elegante',
        text: 'Nessun problema, grazie comunque del tempo. Se cambia idea, hai il mio numero. Buona giornata.',
      },
    ],
  },
};

export function getStagePlaybook(stage: Stage): StagePlaybook {
  return PIPELINE_PLAYBOOK[stage];
}

export function nextStage(stage: Stage): Stage | null {
  const idx = PIPELINE_STAGES.indexOf(stage);
  if (idx === -1 || idx === PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[idx + 1];
}

export const OUTCOME_REASONS_PT = [
  { key: 'price', label: 'Achou caro' },
  { key: 'no_decision_maker', label: 'Não é o decisor (sócio, esposa, etc.)' },
  { key: 'already_has_site', label: 'Já tem site' },
  { key: 'distrusts_tech', label: 'Desconfia de tecnologia' },
  { key: 'language_barrier', label: 'Barreira de idioma forte demais' },
  { key: 'timing', label: 'Não é o momento (em reforma, mudança, etc.)' },
  { key: 'no_p_iva', label: 'Sem P.IVA / informal' },
  { key: 'closed_to_pitch', label: 'Não quis ouvir / ocupado' },
  { key: 'other', label: 'Outro' },
] as const;

export type OutcomeReasonKey = (typeof OUTCOME_REASONS_PT)[number]['key'];
