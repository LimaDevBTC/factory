import type { StageScript } from './index';
import { COMMON_COACHING_PT } from './index';

/**
 * Italian sales pitch scripts.
 * Cultural notes:
 *   - Open with "Buongiorno" + introduction. Italians value pace, not rush.
 *   - "Senza impegno" repeated reduces defensive walls.
 *   - End with "Posso?" — asking permission is cultural courtesy, not weakness.
 *   - Use formal "Lei" with older owners, "tu" can work with younger café owners.
 *   - For trattoria/agriturismo: warmer tone. For pizzeria/aperitivo bar: more direct.
 *   - Reviewed by: [pending — Vavà to confirm]
 */
export const italianScripts: StageScript[] = [
  {
    stage: 'approach',
    order: 1,
    ...COMMON_COACHING_PT.approach,
    main: 'Buongiorno, sono Edson, sono brasiliano ma vivo qui. Faccio una cosa che si chiama Factory: in dieci minuti, davanti a te, ti faccio vedere come sarebbe il sito web del tuo locale. Senza impegno, senza pagamento, niente. Se ti piace ne parliamo. Se no, prendo un caffè e ti saluto. Posso?',
    variants: [
      {
        key: 'curta',
        label_pt: 'Versão curta (lugar movimentado)',
        when_pt: 'Use quando o lugar tá cheio e ele tem 10 segundos só',
        text: 'Buongiorno, sono Edson. In dieci minuti ti faccio vedere come sarebbe il sito del tuo locale. Gratis, senza impegno. Posso?',
      },
      {
        key: 'calorosa',
        label_pt: 'Versão calorosa (trattoria familiar)',
        when_pt: 'Trattoria/agriturismo onde tom familiar funciona melhor',
        text: 'Buongiorno, mi scusi il disturbo. Mi chiamo Edson, sono brasiliano. Aiuto i locali come il vostro a essere visibili online — turisti, clienti nuovi, quel tipo di cose. Se mi dà dieci minuti, le mostro qualcosa di concreto fatto sul vostro locale. Senza pagare niente, senza impegno. Le va?',
      },
    ],
  },
  {
    stage: 'consent',
    order: 2,
    ...COMMON_COACHING_PT.consent,
    main: 'Allora, prima di iniziare, posso registrare un secondo che mi dai il permesso di fare delle foto e di usare il nome del tuo locale per la prova? Solo per essere a posto. Basta che dici "sì certo".',
  },
  {
    stage: 'capture',
    order: 3,
    ...COMMON_COACHING_PT.capture,
    main: 'Mi descrivi un attimo il tuo locale? Come lo presenteresti a un cliente nuovo che entra per la prima volta?',
    variants: [
      {
        key: 'pergunta_vibe',
        label_pt: 'Confirma vibe',
        text: 'Tu come ti descriveresti? Sei più una trattoria familiare, una caffetteria moderna, un wine bar...?',
      },
      {
        key: 'pergunta_horarios',
        label_pt: 'Horários de funcionamento',
        text: 'Mi puoi dire gli orari di apertura, durante la settimana e nel weekend?',
      },
      {
        key: 'pergunta_p_iva',
        label_pt: 'P.IVA (no fim)',
        when_pt: 'Pergunta no fim, depois de criar rapport',
        text: 'Per il sito mi serve la partita IVA, te la chiedo poi prima di pubblicare. Va bene?',
      },
      {
        key: 'pergunta_email',
        label_pt: 'Email do dono (CRÍTICO)',
        when_pt: 'Pede o email pessoal dele — magic link e recibo vão por aqui. Confirma duas vezes.',
        text: "Mi serve la tua email per mandarti l'accesso al pannello e la ricevuta. Mi puoi dettarla? Lentamente, così non sbaglio.",
      },
      {
        key: 'pergunta_email_publico',
        label_pt: 'Email público do negócio',
        when_pt: 'Se ele tiver email separado pra contato público (info@, contatti@)',
        text: "Hai un'email pubblica del locale, tipo info@ o contatti@? Quella va sul sito, la tua personale resta privata.",
      },
    ],
  },
  {
    stage: 'processing',
    order: 4,
    ...COMMON_COACHING_PT.processing,
  },
  {
    stage: 'ready',
    order: 5,
    ...COMMON_COACHING_PT.ready,
  },
  {
    stage: 'present',
    order: 6,
    ...COMMON_COACHING_PT.present,
    main: 'Guarda cosa ho preparato per te. Prendilo, gioca con lui. Dimmi cosa ne pensi.',
  },
  {
    stage: 'pricing',
    order: 7,
    ...COMMON_COACHING_PT.pricing,
    main: 'Allora, sono tre opzioni semplici. Pacchetto tre mesi, cinquanta euro in contanti. Pacchetto sei mesi, novantanove euro tutto compreso, ti dimentichi del pagamento per sei mesi. Pacchetto dodici mesi, centosettantanove euro — è la scelta più popolare e ci metto dentro anche il dominio personalizzato. Tu cosa preferisci?',
    variants: [
      {
        key: 'spinta_12mo',
        label_pt: 'Empurra pra 12 meses',
        when_pt: 'Cliente parecer convicto, abriu carteira sem hesitar',
        text: "Senti, se vai sui dodici mesi ti includo il dominio personalizzato — tipo trattoriadamarco.it. Vale quaranta euro l'anno, e il sito sembra molto più professionale. È quello che fa la differenza con Google.",
      },
      {
        key: 'so_3mo_6mo',
        label_pt: 'Cliente cauteloso (esconde 12mo)',
        when_pt: 'Cliente parece duvidoso, hesitante, primeiro contato com tech',
        text: 'Allora ti propongo due opzioni semplici: tre mesi a cinquanta euro per provare, o sei mesi a novantanove se ti senti tranquillo. Decidi tu.',
      },
      {
        key: 'voucher',
        label_pt: 'Voucher Digitalizzazione',
        when_pt: 'Use pra Growth/Pro tier (não vale pena pra Starter)',
        text: "Per i piani superiori c'è anche il Voucher Digitalizzazione, lo Stato copre la metà.",
      },
      {
        key: 'upsell_growth',
        label_pt: 'Upsell pra Growth',
        when_pt: 'Use se ele pedir feature avançada (custom domain, mais idiomas)',
        text: "Per quello che mi chiedi serve il piano Growth — sei mesi a centosettanta in contanti. Include dominio personalizzato, prenotazioni e fino a tre lingue.",
      },
      {
        key: 'concorrenza',
        label_pt: 'Âncora da concorrência',
        when_pt: 'ANTES do preço — ancora valor',
        text: "Guarda, ho controllato i 5 locali più vicini al tuo. Nessuno ha un sito decente. Per cinquanta euro provi tre mesi. Se non funziona, non rinnovi.",
      },
    ],
  },
  {
    stage: 'close',
    order: 8,
    ...COMMON_COACHING_PT.close,
    main: 'Allora, lo prendi? Posso mandarti il link di pagamento adesso?',
    variants: [
      {
        key: 'pensaci',
        label_pt: 'Vai pensar',
        text: "Tranquillo, pensaci. Ti lascio il link del preview, ce l'hai per 30 giorni. Ti scrivo io fra qualche giorno per vedere come va. Va bene?",
      },
      {
        key: 'agradecimento',
        label_pt: 'Saída elegante',
        text: 'Nessun problema, grazie comunque del tempo. Se cambia idea, hai il mio numero. Buona giornata.',
      },
    ],
  },
];
