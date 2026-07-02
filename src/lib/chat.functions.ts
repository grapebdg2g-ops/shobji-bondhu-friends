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
});

const SuggestInputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 11 || m <= 2) return "রবি";
  if (m >= 3 && m <= 6) return "খরিফ-১";
  return "খরিফ-২";
}

function buildSystemPrompt(ctx?: z.infer<typeof UserContextSchema>) {
  const name = ctx?.name || "কৃষক ভাই";
  const district = ctx?.district || "অজানা";
  const upazila = ctx?.upazila || "অজানা";
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
১. সবসময় বাংলায় উত্তর দাও
২. সহজ ও সংক্ষিপ্ত রাখো (সর্বোচ্চ ১৫০ শব্দ)
৩. কৃষি বিষয়ক প্রশ্নে সরাসরি উত্তর দাও
৪. স্থানীয় বাজার ও মৌসুম উল্লেখ করো
৫. প্রয়োজনে numbered list ব্যবহার করো
৬. ক্ষতিকর পরামর্শ কখনো দেবে না
৭. নিশ্চিত না হলে "কৃষি অফিসে জিজ্ঞেস করুন" বলো`;
}

async function callGateway(body: unknown): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI সেবা এখন উপলব্ধ নয়");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error("অনেক অনুরোধ এসেছে, একটু পরে আবার চেষ্টা করুন");
  if (res.status === 402) throw new Error("AI ক্রেডিট শেষ, অনুগ্রহ করে ওয়ার্কস্পেসে যোগ করুন");
  if (!res.ok) throw new Error("AI সেবা সাড়া দিচ্ছে না");
  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? "").trim();
}

export const chatWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const system = buildSystemPrompt(data.userContext);
    const reply = await callGateway({
      model: MODEL,
      temperature: 0.7,
      max_tokens: 600,
      messages: [{ role: "system", content: system }, ...data.messages],
    });
    return { reply: reply || "দুঃখিত, উত্তর তৈরি করতে পারিনি।" };
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
      const raw = await callGateway({
        model: MODEL,
        temperature: 0.5,
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content:
              'তুমি একটি JSON generator। শুধু একটি JSON array দাও, অন্য কিছু নয়। format: ["প্রশ্ন১","প্রশ্ন২","প্রশ্ন৩"]',
          },
          {
            role: "user",
            content: `নিচের কৃষি কথোপকথন পড়ে ৩টি সংক্ষিপ্ত (৫-৭ শব্দ) বাংলা follow-up প্রশ্ন দাও। শুধু JSON array।\n\n${transcript}`,
          },
        ],
      });
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
