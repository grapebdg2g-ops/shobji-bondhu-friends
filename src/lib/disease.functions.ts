import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z.string().regex(/^image\/(jpeg|png|webp)$/),
  crop: z.string().min(1).max(50),
});

export type DiseaseResult = {
  diseaseName: string;
  severity: "low" | "medium" | "high";
  description: string;
  treatments: string[];
  prevention: string[];
  cost: { name: string; price: string }[];
  detected: boolean;
  reason?: string;
};

const SYSTEM_PROMPT = `তুমি একজন অভিজ্ঞ বাংলাদেশী কৃষি রোগ বিশেষজ্ঞ। কৃষকের পাঠানো ফসলের ছবি দেখে রোগ শনাক্ত করো এবং বাংলায় উত্তর দাও।

কঠোরভাবে শুধুমাত্র নিচের JSON ফরম্যাটে উত্তর দাও, কোনো অতিরিক্ত লেখা যোগ করো না:

{
  "detected": true/false,
  "diseaseName": "রোগের বাংলা নাম",
  "severity": "low" | "medium" | "high",
  "description": "রোগের বিবরণ ২-৩ বাক্যে",
  "treatments": ["চিকিৎসা ১", "চিকিৎসা ২", "চিকিৎসা ৩"],
  "prevention": ["প্রতিরোধ ১", "প্রতিরোধ ২", "প্রতিরোধ ৩"],
  "cost": [{"name": "ঔষধের নাম", "price": "৳ মূল্য"}],
  "reason": "যদি detected=false হয় তবে কারণ"
}

যদি ছবিতে রোগ স্পষ্ট না হয় বা ফসলের ছবি না হয়, detected=false দাও।`;

export const analyzeDisease = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<DiseaseResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI সেবা প্রস্তুত নয়");

    const dataUrl = `data:${data.mimeType};base64,${data.imageBase64}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: dataUrl } },
              {
                type: "text",
                text: `ফসল: ${data.crop}\n\nএই ছবিতে কী রোগ দেখা যাচ্ছে? উপরে বলা JSON ফরম্যাটে উত্তর দাও।`,
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("AI gateway error:", res.status, errText);
      if (res.status === 429) throw new Error("API ত্রুটি (অনেক বেশি অনুরোধ, একটু পরে চেষ্টা করুন)");
      if (res.status === 402) throw new Error("API ত্রুটি (ক্রেডিট শেষ)");
      throw new Error(`API ত্রুটি (${res.status})`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content ?? "";

    let parsed: Partial<DiseaseResult> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    }

    return {
      detected: parsed.detected ?? false,
      diseaseName: parsed.diseaseName ?? "অজানা",
      severity: (parsed.severity as DiseaseResult["severity"]) ?? "medium",
      description: parsed.description ?? "",
      treatments: Array.isArray(parsed.treatments) ? parsed.treatments : [],
      prevention: Array.isArray(parsed.prevention) ? parsed.prevention : [],
      cost: Array.isArray(parsed.cost) ? parsed.cost : [],
      reason: parsed.reason,
    };
  });
