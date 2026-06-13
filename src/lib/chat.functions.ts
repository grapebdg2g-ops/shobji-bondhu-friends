import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

const SYSTEM_PROMPT = `তুমি একজন অভিজ্ঞ বাংলাদেশী কৃষি বিশেষজ্ঞ "বলো বন্ধু"। কৃষকদের প্রশ্নের উত্তর সহজ বাংলায়, সংক্ষেপে (৪-৬ বাক্যে) দাও। ফসল, সার, কীটনাশক, রোগ, আবহাওয়া, বাজার দর — যেকোনো কৃষি বিষয়ে সাহায্য করো। অপ্রাসঙ্গিক প্রশ্নে বিনয়ের সাথে কৃষি বিষয়ে ফিরিয়ে আনো।`;

export const chatWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const apiKey = process.env.NEXT_PUBLIC_KIMI_API_KEY;
    if (!apiKey) throw new Error("AI সেবা এখন উপলব্ধ নয়");

    const res = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "kimi-latest",
        temperature: 0.6,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...data.messages],
      }),
    });
    if (!res.ok) throw new Error("AI সেবা সাড়া দিচ্ছে না");
    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() ?? "দুঃখিত, উত্তর তৈরি করতে পারিনি।";
    return { reply };
  });
