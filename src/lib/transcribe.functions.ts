import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({
  audioBase64: z.string().min(10).max(20_000_000),
  mimeType: z.string().default("audio/webm"),
});

function mimeToExt(mime: string): string {
  const m = mime.split(";")[0].trim().toLowerCase();
  if (m.includes("mp4")) return "mp4";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("wav")) return "wav";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("m4a")) return "m4a";
  return "webm";
}

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<{ text: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("ভয়েস সেবা এখন উপলব্ধ নয়");

    const binary = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    const ext = mimeToExt(data.mimeType);
    const blob = new Blob([binary as unknown as ArrayBuffer], { type: data.mimeType });

    const form = new FormData();
    form.append("file", blob, `recording.${ext}`);
    form.append("model", "openai/gpt-4o-mini-transcribe");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });

    if (res.status === 429) throw new Error("অনেক অনুরোধ, একটু পরে চেষ্টা করুন");
    if (res.status === 402) throw new Error("ক্রেডিট শেষ, পরে চেষ্টা করুন");
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error("STT error", res.status, err);
      throw new Error("ভয়েস রূপান্তর ব্যর্থ");
    }

    const json = await res.json();
    const text = (json?.text ?? "").toString().trim();
    return { text };
  });
