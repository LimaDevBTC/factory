import type { StageScript } from './index';
import { COMMON_COACHING_PT } from './index';

/**
 * Hindi sales pitch scripts for Indian-Italian business owners.
 *
 * ⚠️ STATUS: DRAFT — REQUIRES NATIVE SPEAKER REVIEW BEFORE GOING LIVE.
 *
 * Cultural notes:
 *   - Open with "नमस्ते" (Namaste). For Sikh owners use "Sat Sri Akal" instead.
 *   - Address owner with respect: "Sir/Ji" suffix when in doubt.
 *   - Multi-generational decisions are common — accept "let me discuss with family".
 *   - Indian restaurant scene in Italy is mostly Punjabi-owned; consider also pa-IN script.
 *   - Money discussion is fine and direct, but politeness layer matters.
 *   - Don't show sole of foot. Right hand for giving/receiving.
 *
 * Reviewed by: [PENDING]
 */
export const hindiScripts: StageScript[] = [
  {
    stage: 'approach',
    order: 1,
    ...COMMON_COACHING_PT.approach,
    main: 'नमस्ते जी, मेरा नाम Edson है, मैं ब्राज़ील से हूँ लेकिन यहाँ इटली में रहता हूँ। मैं Factory नाम की एक सेवा चलाता हूँ: दस मिनट में, आपके सामने, आपको दिखाऊँगा कि आपके रेस्तराँ की वेबसाइट कैसी होगी। मुफ़्त में, कोई बंधन नहीं। अगर पसंद आए तो बात करेंगे। अगर नहीं, तो चाय पीकर चला जाऊँगा। क्या मैं दिखा सकता हूँ?',
  },
  {
    stage: 'consent',
    order: 2,
    ...COMMON_COACHING_PT.consent,
    main: 'शुरू करने से पहले, क्या मैं एक सेकंड रिकॉर्ड कर सकता हूँ कि आप फोटो लेने और अपने रेस्तराँ का नाम इस्तेमाल करने की अनुमति दे रहे हैं? बस "हाँ" कह दीजिए।',
  },
  {
    stage: 'capture',
    order: 3,
    ...COMMON_COACHING_PT.capture,
    main: 'क्या आप अपने रेस्तराँ के बारे में बता सकते हैं? नए ग्राहक को आप कैसे परिचय कराएँगे?',
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
    main: 'देखिए, यह मैंने आपके लिए तैयार किया है। फ़ोन हाथ में लीजिए, देखिए। मुझे बताइए कि कैसा लगा।',
  },
  {
    stage: 'pricing',
    order: 7,
    ...COMMON_COACHING_PT.pricing,
    main: 'ऐसे है: हम Starter प्लान से शुरू करते हैं — 20 यूरो सेटअप और 19 यूरो महीना। आज रात ऑनलाइन हो जाएगा, कोई बंधन नहीं, जब चाहें कैंसल करें। पसंद आए और ज़्यादा चाहें — कस्टम डोमेन, बुकिंग, और भाषाएँ — तो Growth प्लान में अपग्रेड करें, 49 सेटअप और 39 महीना। पहले Starter से शुरू करें, ठीक है?',
    variants: [
      {
        key: 'voucher',
        label_pt: 'Voucher governo',
        text: 'Growth प्लान में सरकार का डिजिटलाइज़ेशन वाउचर भी मिलता है, 50% तक राज्य देता है।',
      },
      {
        key: 'upsell_growth',
        label_pt: 'Upsell Growth',
        text: 'इस फ़ीचर के लिए Growth प्लान चाहिए — 49 सेटअप, 39 महीना। कस्टम डोमेन, बुकिंग और तीन भाषाएँ शामिल। सीधे वहीं से शुरू करें?',
      },
    ],
  },
  {
    stage: 'close',
    order: 8,
    ...COMMON_COACHING_PT.close,
    main: 'तो, क्या आप लेंगे? मैं अभी पेमेंट लिंक भेज सकता हूँ।',
    variants: [
      {
        key: 'pensaci',
        label_pt: 'Vai consultar família',
        when_pt: 'Aceite — decisões em família são culturais',
        text: 'कोई बात नहीं, सोचिए, परिवार से बात कीजिए। तीस दिन का प्रीव्यू लिंक छोड़ देता हूँ। कुछ दिन बाद मैं संपर्क करूँगा।',
      },
    ],
  },
];
