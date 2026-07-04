import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const UserContextSchema = z
  .object({
    name: z.string().nullish(),
    district: z.string().nullish(),
    upazila: z.string().nullish(),
    crops: z.array(z.string()).nullish(),
  })
  .optional();

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
  userContext: UserContextSchema,
  skipCache: z.boolean().optional(),
});

const SuggestInputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

const FeedbackSchema = z.object({
  cacheId: z.string().uuid(),
  helpful: z.boolean(),
});

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const EMBEDDING_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি";
  if (m >= 3 && m <= 6) return "খরিফ-১";
  return "খরিফ-২";
}

function detectCategory(q: string): string {
  const s = q.toLowerCase();
  if (/রোগ|পোকা|ব্লাস্ট|ব্লাইট|পচা|হলুদ|দাগ|মরে/.test(s)) return "disease";
  if (/সার|ইউরিয়া|টিএসপি|এমওপি|সেচ|পানি/.test(s)) return "fertilizer";
  if (/দাম|বাজার|বিক্রি|দর|লাভ|কোথায়/.test(s)) return "market";
  if (/বৃষ্টি|ঝড়|আবহাওয়া|রোদ|খরা|বন্যা/.test(s)) return "weather";
  if (/কখন|লাগাবো|বপন|রোপণ|মৌসুম|চাষ/.test(s)) return "planting";
  return "general";
}

function detectCropType(q: string): string {
  const crops: Record<string, string[]> = {
    "ধান": ["ধান", "বোরো", "আমন", "আউশ"],
    "আলু": ["আলু"],
    "টমেটো": ["টমেটো"],
    "পেঁয়াজ": ["পেঁয়াজ"],
    "বেগুন": ["বেগুন"],
    "মরিচ": ["মরিচ"],
    "সরিষা": ["সরিষা"],
    "গম": ["গম"],
    "ভুট্টা": ["ভুট্টা"],
  };
  for (const [crop, kws] of Object.entries(crops)) {
    if (kws.some((k) => q.includes(k))) return crop;
  }
  return "general";
}

function buildSystemPrompt(ctx?: z.infer<typeof UserContextSchema>) {
  const name = ctx?.name || "কৃষক ভাই";
  const district = ctx?.district || "চট্টগ্রাম";
  const upazila = ctx?.upazila || "নবীনগর";
  const crops = ctx?.crops?.length ? ctx.crops.join(", ") : "উল্লেখ নেই";
  const today = new Date().toLocaleDateString("bn-BD");

  return `তুমি "কৃষি বন্ধু" — বাংলাদেশের কৃষকদের জন্য একটি AI সহকারী।

ব্যবহারকারীর তথ্য:
- নাম: ${name}
- জেলা: ${district}
- উপজেলা: ${upazila}
- ফসল: ${crops}
- আজকের তারিখ: ${today}
- মৌসুম: ${getCurrentSeason()}

তোমার নিয়ম:
১. সবসময় একেবারে শুদ্ধ ও প্রমিত বাংলায় (Formal Bengali) উত্তর দাও। কোনোভাবেই অপ্রাতিষ্ঠানিক বা আঞ্চলিক শব্দ ব্যবহার করবে না।
২. উত্তর যথাসম্ভব সম্পূর্ণ ও পূর্ণাঙ্গ দাও, তবে অপ্রয়োজনীয় দীর্ঘ করবে না।
৩. কৃষি বিষয়ক প্রশ্নে সরাসরি উত্তর দাও।
৪. স্থানীয় বাজার ও মৌসুম উল্লেখ করো।
৫. প্রয়োজনে numbered list ব্যবহার করো।
৬. ক্ষতিকর পরামর্শ কখনো দেবে না।
৭. নিশ্চিত না হলে বিনীতভাবে "কৃষি অফিসে জিজ্ঞেস করুন" বলো।`;
}

type ChatMsg = z.infer<typeof MessageSchema>;

async function callGemini(
  system: string,
  messages: ChatMsg[],
  opts: { temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("AI সেবা এখন উপলব্ধ নয়");

  const contents = messages.map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents,
      generationConfig: {
        temperature: opts.temperature ?? 0.7,
        maxOutputTokens: opts.maxTokens ?? 500,
        topP: 0.8,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    }),
  });

  if (res.status === 429) throw new Error("অনেক অনুরোধ এসেছে, একটু পরে আবার চেষ্টা করুন");
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("Gemini API error", res.status, err);
    throw new Error("AI সেবা সাড়া দিচ্ছে না");
  }

  const data = await res.json();
  return (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim();
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${EMBEDDING_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
        taskType: "SEMANTIC_SIMILARITY",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const values = data?.embedding?.values;
    return Array.isArray(values) ? values : null;
  } catch {
    return null;
  }
}

export const chatWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(
    async ({
      data,
    }): Promise<{ reply: string; source: "cache" | "gemini"; cacheId: string | null; similarity?: number }> => {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      const lastUser = [...data.messages].reverse().find((m) => m.role === "user");
      const userQuestion = lastUser?.content?.trim() ?? "";
      const category = detectCategory(userQuestion);
      const season = getCurrentSeason();
      const cropType = detectCropType(userQuestion);
      const singleTurn = data.messages.length <= 2;

      let embedding: number[] | null = null;
      if (userQuestion && singleTurn && !data.skipCache) {
        embedding = await generateEmbedding(userQuestion);
      }

      // Cache lookup
      if (embedding) {
        const { data: hits } = await supabaseAdmin.rpc("search_cache" as never, {
          query_embedding: embedding as unknown as string,
          similarity_threshold: 0.82,
          max_results: 1,
          filter_category: category,
          filter_season: season,
        } as never);
        const arr = (hits as Array<{ id: string; answer: string; similarity: number }> | null) ?? [];
        if (arr.length > 0) {
          const hit = arr[0];
          await supabaseAdmin.rpc("increment_cache_hit" as never, { _id: hit.id } as never);
          return { reply: hit.answer, source: "cache", cacheId: hit.id, similarity: hit.similarity };
        }
      }

      // Cache miss → Gemini
      const system = buildSystemPrompt(data.userContext);
      const reply = await callGemini(system, data.messages, { temperature: 0.7, maxTokens: 4096 });
      const finalReply = reply || "দুঃখিত, উত্তর তৈরি করতে পারিনি।";

      if (embedding && reply) {
        await supabaseAdmin.from("ai_chat_cache" as never).insert({
          question: userQuestion,
          embedding: embedding as unknown as string,
          answer: finalReply,
          category,
          crop_type: cropType,
          season,
        } as never);
      }

      return { reply: finalReply, source: "gemini", cacheId: null };
    },
  );

export const recordCacheFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FeedbackSchema.parse(d))
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("record_cache_feedback" as never, {
      _id: data.cacheId,
      _helpful: data.helpful,
    } as never);
    return { ok: true };
  });

export const suggestFollowUps = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SuggestInputSchema.parse(d))
  .handler(async ({ data }): Promise<{ suggestions: string[] }> => {
    const transcript = data.messages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "কৃষক" : "সহকারী"}: ${m.content}`)
      .join("\n");
    try {
      const raw = await callGemini(
        'তুমি একটি JSON generator। শুধু একটি JSON array দাও, অন্য কিছু নয়। format: ["প্রশ্ন১","প্রশ্ন২","প্রশ্ন৩"]',
        [
          {
            role: "user",
            content: `নিচের কৃষি কথোপকথন পড়ে ৩টি সংক্ষিপ্ত (৫-৭ শব্দ) শুদ্ধ বাংলার follow-up প্রশ্ন দাও। শুধু JSON array।\n\n${transcript}`,
          },
        ],
        { temperature: 0.5, maxTokens: 200 },
      );
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return { suggestions: [] };
      const arr = JSON.parse(match[0]);
      if (!Array.isArray(arr)) return { suggestions: [] };
      return {
        suggestions: arr
          .filter((s: unknown): s is string => typeof s === "string")
          .slice(0, 3)
          .map((s) => s.trim())
          .filter(Boolean),
      };
    } catch {
      return { suggestions: [] };
    }
  });
