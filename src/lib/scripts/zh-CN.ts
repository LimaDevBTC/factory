import type { StageScript } from './index';
import { COMMON_COACHING_PT } from './index';

/**
 * Mandarin sales pitch scripts for Chinese-Italian business owners.
 *
 * ⚠️ STATUS: DRAFT — REQUIRES NATIVE SPEAKER REVIEW BEFORE GOING LIVE.
 *
 * Cultural notes:
 *   - Open with formal "您好" (nín hǎo), not casual "你好"
 *   - Address oldest/senior person first if multiple owners present
 *   - Present and receive business cards/phone with BOTH HANDS
 *   - Lead with concrete benefit (more customers, more revenue), not vague concepts
 *   - Decisions are often family/multi-generational — accept "let me discuss" as valid
 *   - Avoid the number 4 in pricing (sounds like "death"). Use 8 (prosperity) when possible.
 *     Note: €490 is fine. Avoid €440 in any future pricing structure.
 *   - Don't push for immediate close — Chinese business culture rewards patience
 *
 * Reviewed by: [PENDING]
 * Last cultural audit: never
 */
export const mandarinScripts: StageScript[] = [
  {
    stage: 'approach',
    order: 1,
    ...COMMON_COACHING_PT.approach,
    main: '您好，我叫Edson，我是巴西人，住在意大利。我做一个叫Factory的服务：十分钟之内，当着您的面，给您看您餐厅的网站会是什么样子。免费，没有任何义务。如果您喜欢，我们再谈。如果不喜欢，我喝杯茶就走。可以吗？',
    variants: [
      {
        key: 'curta',
        label_pt: 'Versão curta',
        text: '您好，我是Edson。十分钟给您看您店的网站演示，免费的。可以吗？',
      },
    ],
  },
  {
    stage: 'consent',
    order: 2,
    ...COMMON_COACHING_PT.consent,
    main: '在开始之前，我可以录一段您允许我拍照和使用您餐厅名字的话吗？只是为了规范。您说"可以"就行。',
  },
  {
    stage: 'capture',
    order: 3,
    ...COMMON_COACHING_PT.capture,
    main: '能请您简单介绍一下您的餐厅吗？您会怎么向第一次来的新客人介绍？',
    variants: [
      {
        key: 'pergunta_horarios',
        label_pt: 'Horários',
        text: '您能告诉我营业时间吗？平时和周末。',
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
    main: '请看，这是我为您做的。请拿着手机看一看，告诉我您的想法。',
  },
  {
    stage: 'pricing',
    order: 7,
    ...COMMON_COACHING_PT.pricing,
    main: '是这样的：从Starter套餐开始 — 设置费20欧元，每月19欧元。今晚就上线，没有任何束缚，随时可以取消。如果您觉得好，想要更多功能 — 比如自定义域名、预订系统、更多语言 — 可以升级到Growth套餐，49欧元设置，每月39欧元。先从Starter开始，您看可以吗？',
    variants: [
      {
        key: 'voucher',
        label_pt: 'Voucher Digitalizzazione',
        text: '如果选Growth套餐，还有政府的数字化补贴，国家可以承担一半的费用。我可以帮您申请。',
      },
      {
        key: 'upsell_growth',
        label_pt: 'Upsell Growth',
        text: '您要的这个功能需要Growth套餐 — 设置49欧元，每月39欧元。包含自定义域名、预订和最多三种语言。要直接从这个开始吗？',
      },
      {
        key: 'concorrenza',
        label_pt: 'Âncora concorrência',
        text: '我看了周围五家最近的同类餐厅，没有一家有像样的网站。每月20欧元就能改变这个。',
      },
    ],
  },
  {
    stage: 'close',
    order: 8,
    ...COMMON_COACHING_PT.close,
    main: '那么，您要做吗？我现在就可以发支付链接给您。',
    variants: [
      {
        key: 'pensaci',
        label_pt: 'Vai discutir com família',
        when_pt: 'Aceitar "preciso falar com a família" — comum e cultural',
        text: '没问题，您可以慢慢考虑，和家人商量。我把预览链接发给您，三十天有效。过几天我再联系您。',
      },
      {
        key: 'agradecimento',
        label_pt: 'Saída respeitosa',
        text: '没关系，谢谢您的时间。如果改主意，您有我的号码。祝您生意兴隆。',
      },
    ],
  },
];
