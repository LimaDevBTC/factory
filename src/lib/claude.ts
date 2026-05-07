import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { ALLERGENS, DIETARY } from '@/lib/supabase/types';
import { VIBE_CONFIG, type Vibe } from '@/lib/verticals';
import { createAdminClient } from '@/lib/supabase/admin';

const VISION_MODEL = process.env.ANTHROPIC_MODEL_VISION ?? 'claude-opus-4-7';
const TEXT_MODEL = process.env.ANTHROPIC_MODEL_TEXT ?? 'claude-haiku-4-5-20251001';

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY não configurada em .env.local');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const ExtractedItemSchema = z.object({
  category_name_it: z.string().trim().min(1),
  name_it: z.string().trim().min(1),
  description_it: z.string().nullable(),
  price_cents: z.number().int().nonnegative(),
  allergens: z.array(z.string()).transform((arr) =>
    arr.filter((a): a is (typeof ALLERGENS)[number] =>
      (ALLERGENS as readonly string[]).includes(a),
    ),
  ),
  dietary: z.array(z.string()).transform((arr) =>
    arr.filter((d): d is (typeof DIETARY)[number] =>
      (DIETARY as readonly string[]).includes(d),
    ),
  ),
});

const ExtractedCategorySchema = z.object({
  name_it: z.string().trim().min(1),
  display_order: z.number().int().nonnegative(),
});

const MenuExtractionSchema = z.object({
  categories: z.array(ExtractedCategorySchema).min(0),
  items: z.array(ExtractedItemSchema).min(0),
});

export type MenuExtractionResult = z.infer<typeof MenuExtractionSchema>;

function buildExtractionPrompt(vibe: Vibe): string {
  const conf = VIBE_CONFIG[vibe];
  const hints = conf.categoryHints.join(', ');
  return `You are extracting a food & beverage menu from photographs.
The business type is: ${vibe} (${conf.label.it}).
Common categories for this vibe: ${hints}.

Return ONLY valid JSON matching this schema (no prose, no markdown fences):
{
  "categories": [{ "name_it": string, "display_order": number }],
  "items": [{
    "category_name_it": string,
    "name_it": string,
    "description_it": string | null,
    "price_cents": number,
    "allergens": string[],
    "dietary": string[]
  }]
}

Rules:
- Prices are integers in cents (€2.50 → 250, €12.50 → 1250, €0.90 → 90).
- If an item has no description in the photo, set description_it to null. Do NOT invent.
- Allergens: only include those visible in the menu (asterisks, footnotes, explicit mention). Do NOT guess from name. Use snake_case Italian: ${ALLERGENS.join(', ')}.
- Dietary: only when explicitly marked. Use: ${DIETARY.join(', ')}.
- If a price is unreadable, set price_cents to 0; operator will fix.
- Respect menu's category structure. If absent, use category_hints as fallback.
- For gelaterie: each gusto is one item. Coppe and granite separate categories.
- For caffetterie: differentiate caffetteria (espresso/cappuccino) from pasticceria (croissant/cornetti) from panini.
- For enoteche: respect wine list (region, vintage, vintner if present).`;
}

export async function extractMenu({
  photoUrls,
  vibe,
  tenantId,
  pitchSessionId,
}: {
  photoUrls: string[];
  vibe: Vibe;
  tenantId: string | null;
  pitchSessionId: string;
}): Promise<MenuExtractionResult> {
  if (photoUrls.length === 0) {
    return { categories: [], items: [] };
  }

  const prompt = buildExtractionPrompt(vibe);
  const promptHash = createHash('sha256').update(prompt).digest('hex');

  type SupportedMime = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
  const SUPPORTED: SupportedMime[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const imageBlocks = await Promise.all(
    photoUrls.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao baixar foto: ${url} (${res.status})`);
      const buf = await res.arrayBuffer();
      const rawMime = (res.headers.get('content-type') ?? 'image/jpeg').split(';')[0].trim();
      const mediaType: SupportedMime = SUPPORTED.includes(rawMime as SupportedMime)
        ? (rawMime as SupportedMime)
        : 'image/jpeg';
      return {
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: mediaType,
          data: Buffer.from(buf).toString('base64'),
        },
      };
    }),
  );

  const response = await client().messages.create({
    model: VISION_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageBlocks,
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';

  // Log AI call mesmo se falhar parse — input/output tokens contam pra custo
  const supabase = createAdminClient();
  await supabase.from('ai_calls').insert({
    tenant_id: tenantId,
    model: VISION_MODEL,
    purpose: 'menu_extraction',
    input_tokens: response.usage?.input_tokens ?? null,
    output_tokens: response.usage?.output_tokens ?? null,
    prompt_hash: promptHash,
    metadata: { pitch_session_id: pitchSessionId, photo_count: photoUrls.length },
  });

  const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Claude retornou JSON inválido: ${e instanceof Error ? e.message : 'parse error'}. Raw: ${cleaned.slice(0, 200)}`);
  }

  return MenuExtractionSchema.parse(parsed);
}

export async function generateItemCopy({
  nameIt,
  vibe,
  tenantId,
  pitchSessionId,
}: {
  nameIt: string;
  vibe: Vibe;
  tenantId: string | null;
  pitchSessionId: string;
}): Promise<{ description_it: string; description_en: string; description_de: string } | null> {
  const conf = VIBE_CONFIG[vibe];
  const prompt = `Item: "${nameIt}" — vibe: ${vibe} (${conf.label.it}).

Write a 1-2 sentence description in Italian. Tone: ${vibe}. Length: max 25 words.
Stay factual: only describe ingredients/method/origin evident from the item name. Do NOT invent.

Then translate to English and German with same constraints.

Return ONLY JSON: { "description_it": string, "description_en": string, "description_de": string }`;
  const promptHash = createHash('sha256').update(prompt).digest('hex');

  const response = await client().messages.create({
    model: TEXT_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  const raw = textBlock && textBlock.type === 'text' ? textBlock.text : '';

  const supabase = createAdminClient();
  await supabase.from('ai_calls').insert({
    tenant_id: tenantId,
    model: TEXT_MODEL,
    purpose: 'copy_generation',
    input_tokens: response.usage?.input_tokens ?? null,
    output_tokens: response.usage?.output_tokens ?? null,
    prompt_hash: promptHash,
    metadata: { pitch_session_id: pitchSessionId, item_name: nameIt },
  });

  const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  try {
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.description_it === 'string' &&
      typeof parsed.description_en === 'string' &&
      typeof parsed.description_de === 'string'
    ) {
      return parsed;
    }
  } catch {
    // ignore — sem descrição é melhor que descrição inventada
  }
  return null;
}
