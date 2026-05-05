import type { StageScript } from './index';
import { COMMON_COACHING_PT } from './index';

/**
 * English sales pitch scripts.
 * Useful as fallback when:
 *   - Owner is from a country we don't have native scripts for
 *   - Owner is younger and prefers English to their native language for business
 *   - You're not sure of the owner's native language
 *
 * Cultural notes:
 *   - Direct American-business style works well for younger owners
 *   - For older British/Australian owners, slightly more formal
 *   - Always polite ("please", "thank you")
 */
export const englishScripts: StageScript[] = [
  {
    stage: 'approach',
    order: 1,
    ...COMMON_COACHING_PT.approach,
    main: "Hi, I'm Edson. I'm from Brazil but I live here in Italy. I run a service called Factory: in ten minutes, right here in front of you, I'll show you what your venue's website would look like. Free, no commitment, no payment. If you like it we talk. If not, I have a coffee and I'm gone. May I show you?",
    variants: [
      {
        key: 'curta',
        label_pt: 'Versão curta',
        text: "Hi, I'm Edson. Ten minutes, I show you a website made for your place. Free, no commitment. May I?",
      },
    ],
  },
  {
    stage: 'consent',
    order: 2,
    ...COMMON_COACHING_PT.consent,
    main: 'Before we start, can I record one second of you giving permission for me to take photos and use your business name for the demo? Just to keep things proper. Just say "yes, sure".',
  },
  {
    stage: 'capture',
    order: 3,
    ...COMMON_COACHING_PT.capture,
    main: "Can you describe your place to me? How would you introduce it to a new customer who's just walked in for the first time?",
    variants: [
      {
        key: 'pergunta_email',
        label_pt: 'Email do dono (CRÍTICO)',
        when_pt: 'Pede o email pessoal — magic link e recibo vão por aqui. Confirma duas vezes.',
        text: "I need your email to send you access to the dashboard and your receipt. Can you spell it out slowly so I don't make a typo?",
      },
      {
        key: 'pergunta_email_publico',
        label_pt: 'Email público do negócio',
        when_pt: 'Email separado pra contato público (info@, contact@)',
        text: "Do you have a public business email, like info@ or contact@? That one goes on the public site; your personal email stays private.",
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
    main: "Look, this is what I made for you. Take the phone, play with it. Tell me what you think.",
  },
  {
    stage: 'pricing',
    order: 7,
    ...COMMON_COACHING_PT.pricing,
    main: "Here's how it works: we start you on the Starter plan — €20 setup and €19 per month. Online tonight, no commitment, cancel anytime. If you like it and want more — custom domain, reservations, extra languages — you upgrade to Growth, €49 setup and €39 per month. Let's start with Starter, sound fair?",
    variants: [
      {
        key: 'voucher',
        label_pt: 'Voucher Digitalizzazione',
        text: "If you go with the Growth plan, there's also the Italian Digitalizzazione voucher — government covers up to 50%. I can help you apply.",
      },
      {
        key: 'upsell_growth',
        label_pt: 'Upsell pra Growth',
        text: "For that feature you'd want the Growth plan — €49 setup, €39/month. Includes custom domain, reservations, and up to 3 languages. Want to start there directly?",
      },
      {
        key: 'concorrenza',
        label_pt: 'Âncora concorrência',
        text: "Look, I checked the 5 closest places to yours. None has a decent website. For €20/month, that changes.",
      },
    ],
  },
  {
    stage: 'close',
    order: 8,
    ...COMMON_COACHING_PT.close,
    main: "So, are you in? I can send you the payment link right now.",
    variants: [
      {
        key: 'pensaci',
        label_pt: 'Vai pensar',
        text: "No problem, take your time. I'll leave the preview link, you have it for 30 days. I'll message you in a few days to check in. Sound good?",
      },
      {
        key: 'agradecimento',
        label_pt: 'Saída elegante',
        text: "No worries, thanks for your time. If you change your mind, you have my number. Have a great day.",
      },
    ],
  },
];
