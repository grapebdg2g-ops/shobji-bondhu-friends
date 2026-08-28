import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SoilInputSchema = z.object({
  soilType: z.string().min(1),
  phLevel: z.number().optional(),
  nitrogen: z.string().optional(), // low, medium, high
  phosphorus: z.string().optional(),
  potassium: z.string().optional(),
  organicMatter: z.string().optional(),
  lastCrop: z.string().optional(),
  plannedCrop: z.string().optional(),
});

export type SoilAnalysisResult = {
  healthScore: number; // 0-100
  summary: string;
  nutrientStatus: {
    nitrogen: string;
    phosphorus: string;
    potassium: string;
    ph: string;
  };
  recommendations: {
    fertilizers: { name: string; amount: string; timing: string }[];
    organicAmendments: string[];
    soilManagement: string[];
  };
  suitableCrops: string[];
  warnings: string[];
};

const SYSTEM_PROMPT = `তুমি একজন অভিজ্ঞ বাংলাদেশী মৃত্তিকা বিজ্ঞানী (Soil Scientist)। কৃষকের দেওয়া মাটির তথ্য (মাটির ধরন, pH, পুষ্টির মাত্রা) বিশ্লেষণ করে বাংলায় একটি বিস্তারিত রিপোর্ট প্রদান করো।

রিপোর্টটি অবশ্যই নিচের JSON ফরম্যাটে হতে হবে:

{
  "healthScore": 0-100,
  "summary": "মাটির স্বাস্থ্যের একটি সংক্ষিপ্ত সারসংক্ষেপ (২-৩ বাক্য)",
  "nutrientStatus": {
    "nitrogen": "নাইট্রোজেনের অবস্থা ও পরামর্শ",
    "phosphorus": "ফসফরাসের অবস্থা ও পরামর্শ",
    "potassium": "পটাশিয়ামের অবস্থা ও পরামর্শ",
    "ph": "pH লেভেলের অবস্থা ও পরামর্শ"
  },
  "recommendations": {
    "fertilizers": [
      { "name": "সারের নাম", "amount": "পরিমাণ (যেমন: বিঘাপ্রতি কেজি)", "timing": "কখন প্রয়োগ করতে হবে" }
    ],
    "organicAmendments": ["জৈব সার বা মাটির উন্নতির উপায় ১", "উপায় ২"],
    "soilManagement": ["চাষাবাদ পদ্ধতি বা ম্যানেজমেন্ট পরামর্শ ১", "পরামর্শ ২"]
  },
  "suitableCrops": ["উপযুক্ত ফসল ১", "ফসল ২", "ফসল ৩"],
  "warnings": ["সতর্কতা ১ (যদি থাকে)", "সতর্কতা ২"]
}

উত্তর শুধুমাত্র বাংলায় হবে এবং JSON ছাড়া অন্য কোনো টেক্সট থাকবে না।`;

export const analyzeSoil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SoilInputSchema.parse(d))
  .handler(async ({ data, context }): Promise<SoilAnalysisResult> => {
    const apiKey = process.env.NEXT_PUBLIC_KIMI_API_KEY;
    if (!apiKey) throw new Error("Kimi API key অনুপস্থিত");

    const prompt = `
মাটির তথ্য:
- ধরন: ${data.soilType}
- pH লেভেল: ${data.phLevel ?? "অজানা"}
- নাইট্রোজেন (N): ${data.nitrogen ?? "অজানা"}
- ফসফরাস (P): ${data.phosphorus ?? "অজানা"}
- পটাশিয়াম (K): ${data.potassium ?? "অজানা"}
- জৈব উপাদান: ${data.organicMatter ?? "অজানা"}
- আগের ফসল: ${data.lastCrop ?? "অজানা"}
- পরিকল্পিত ফসল: ${data.plannedCrop ?? "অজানা"}

এই তথ্যগুলো বিশ্লেষণ করে মাটির স্বাস্থ্যের রিপোর্ট এবং সারের সুপারিশ প্রদান করো।`;

    const res = await fetch("https://api.moonshot.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "kimi-latest",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(`API ত্রুটি (${res.status})`);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "";

    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error("ফলাফল প্রসেস করা যায়নি");
    }
  });
