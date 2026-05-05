import type { StageScript } from '../index';
import { COMMON_COACHING_PT } from '../index';

/**
 * Arabic sales pitch scripts for Arab-Italian business owners.
 *
 * ⚠️ STATUS: DRAFT — REQUIRES NATIVE SPEAKER REVIEW BEFORE GOING LIVE.
 *
 * Cultural notes:
 *   - Open with "السلام عليكم" (as-salāmu ʿalaykum). Wait for response "وعليكم السلام".
 *   - Accept tea/coffee/water if offered — refusing is rude. Sit and drink before business.
 *   - Allow several minutes of small talk about family/health/origin BEFORE pitching.
 *   - Never point sole of foot at owner. Don't show LEFT hand for handing things.
 *   - Don't push for fast close. Arabic business culture builds trust over multiple visits.
 *   - Use Modern Standard Arabic (MSA) for the script — most Arab-Italian owners speak
 *     dialects (Moroccan, Egyptian, Levantine) but understand MSA. Egyptian is the most
 *     widely-understood dialect for TTS.
 *   - For owners with hijab/conservative dress, avoid extended eye contact, prefer indirect.
 *   - The site itself should support Arabic (RTL) as a locale option for the diaspora.
 *
 * Reviewed by: [PENDING]
 * Last cultural audit: never
 */
export const arabicScripts: StageScript[] = [
  {
    stage: 'approach',
    order: 1,
    ...COMMON_COACHING_PT.approach,
    main: 'السلام عليكم. اسمي Edson، أنا من البرازيل لكني أعيش هنا في إيطاليا. أعمل على شيء اسمه Factory: في عشر دقائق، أمامك، أريك كيف سيكون موقع الإنترنت الخاص بمحلك. مجاناً، بدون أي التزام. إذا أعجبك نتكلم. إذا لا، أشرب قهوة وأذهب. تسمح لي؟',
    variants: [
      {
        key: 'after_tea',
        label_pt: 'Depois do chá/café',
        when_pt: 'Use SÓ depois de aceitar bebida e fazer small talk',
        text: 'الآن، إذا تسمح، أريد أن أريك شيئاً. عشر دقائق فقط. هل عندك وقت؟',
      },
    ],
  },
  {
    stage: 'consent',
    order: 2,
    ...COMMON_COACHING_PT.consent,
    main: 'قبل أن نبدأ، هل أستطيع أن أسجل لحظة بأنك تسمح لي بأخذ صور واستخدام اسم محلك للتجربة؟ فقط من أجل النظام. تقول "نعم" فقط.',
  },
  {
    stage: 'capture',
    order: 3,
    ...COMMON_COACHING_PT.capture,
    main: 'هل تستطيع أن تصف لي محلك؟ كيف تقدمه لزبون جديد يدخل لأول مرة؟',
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
    main: 'انظر، هذا ما حضرته لك. خذ الهاتف، شاهده. قل لي رأيك.',
  },
  {
    stage: 'pricing',
    order: 7,
    ...COMMON_COACHING_PT.pricing,
    main: 'الموضوع هكذا: نبدأ بباقة Starter — 20 يورو تركيب و 19 يورو شهرياً. على الإنترنت الليلة، بدون أي التزام، تلغي وقتما تريد. إذا أعجبك وتريد ميزات أكثر — نطاق مخصص، حجوزات، لغات إضافية — تترقى إلى باقة Growth، 49 يورو تركيب و 39 يورو شهرياً. نبدأ بـ Starter، يناسبك؟',
    variants: [
      {
        key: 'voucher',
        label_pt: 'Voucher Digitalizzazione',
        text: 'إذا اخترت باقة Growth، هناك أيضاً قسيمة الرقمنة من الدولة، تغطي حتى 50%.',
      },
      {
        key: 'upsell_growth',
        label_pt: 'Upsell Growth',
        text: 'لهذه الميزة تحتاج باقة Growth — 49 يورو تركيب و 39 شهرياً. تشمل نطاق مخصص وحجوزات وحتى ثلاث لغات. تريد البدء مباشرة من هناك؟',
      },
    ],
  },
  {
    stage: 'close',
    order: 8,
    ...COMMON_COACHING_PT.close,
    main: 'إذاً، هل تريد المتابعة؟ أستطيع أن أرسل لك رابط الدفع الآن.',
    variants: [
      {
        key: 'pensaci',
        label_pt: 'Quer pensar / consultar',
        when_pt: 'Comum e válido — não force',
        text: 'لا مشكلة، فكر براحتك، تكلم مع شريكك أو عائلتك. أترك لك رابط المعاينة لمدة ثلاثين يوماً. أتصل بك بعد أيام.',
      },
      {
        key: 'agradecimento',
        label_pt: 'Saída respeitosa',
        text: 'لا بأس، شكراً على وقتك. إذا غيرت رأيك، عندك رقمي. الله يبارك في تجارتك.',
      },
    ],
  },
];
