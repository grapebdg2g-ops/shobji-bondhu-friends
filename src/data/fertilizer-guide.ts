// BRRI/BARI fertilizer recommendations.
// Doses are in kg per শতাংশ (1 শতাংশ ≈ 40.46 m²; 1 বিঘা = 33 শতাংশ; 1 একর = 100 শতাংশ; 1 হেক্টর ≈ 247 শতাংশ)
// Source: BRRI Adhunik Dhaner Chash + BARI fertilizer recommendations (approximate).

export type SoilType = "clay" | "loam" | "sandy" | "silt";

export const SOIL_TYPES: { id: SoilType; label: string; emoji: string; note: string }[] = [
  { id: "clay",  emoji: "🟤", label: "এঁটেল মাটি", note: "ভারী, চটচটে" },
  { id: "loam",  emoji: "🟡", label: "দোআঁশ মাটি", note: "সেরা, বেশিরভাগ জমি" },
  { id: "sandy", emoji: "⚪", label: "বালি মাটি",  note: "হালকা, ঝরঝরে" },
  { id: "silt",  emoji: "🔵", label: "পলি মাটি",  note: "নদীর পাড়ে" },
];

// Soil multiplier per fertilizer
const SOIL_FACTOR: Record<SoilType, { urea: number; tsp: number; mop: number; gypsum: number; zinc: number }> = {
  clay:  { urea: 0.90, tsp: 1.10, mop: 1.00, gypsum: 1.00, zinc: 1.00 },
  loam:  { urea: 1.00, tsp: 1.00, mop: 1.00, gypsum: 1.00, zinc: 1.00 },
  sandy: { urea: 1.15, tsp: 0.90, mop: 1.20, gypsum: 1.10, zinc: 1.20 },
  silt:  { urea: 0.95, tsp: 1.00, mop: 0.95, gypsum: 0.90, zinc: 0.90 },
};

export type ScheduleItem = {
  when: string;        // "রোপণের আগে" / "৭-১০ দিন পর"
  daysOffset: number;  // for reminder; 0 = at planting
  detail: string;      // what to apply
  fertilizers: ("urea" | "tsp" | "mop" | "gypsum" | "zinc")[]; // which to include
  ureaShare?: number;  // 0..1 portion of total urea for this dose
};

export type CropDose = {
  id: string;
  emoji: string;
  label: string;
  // base kg per শতাংশ (for loam)
  urea: number;
  tsp: number;
  mop: number;
  gypsum: number;
  zinc: number;
  schedule: ScheduleItem[];
  warnings: string[];
};

// Govt-set rates (BDT per kg, approximate)
export const PRICE_PER_KG = { urea: 27, tsp: 27, mop: 20, gypsum: 18, zinc: 230 } as const;

const splitUrea3 = (warnings: string[]): ScheduleItem[] => [
  { when: "রোপণের আগে", daysOffset: 0,  detail: "TSP, MOP, জিপসাম ও জিংক একসাথে মাটিতে মেশান", fertilizers: ["tsp", "mop", "gypsum", "zinc"] },
  { when: "৭-১০ দিন পর",   daysOffset: 9,  detail: "ইউরিয়া ১ম কিস্তি", fertilizers: ["urea"], ureaShare: 1/3 },
  { when: "২৫-৩০ দিন পর", daysOffset: 28, detail: "ইউরিয়া ২য় কিস্তি", fertilizers: ["urea"], ureaShare: 1/3 },
  { when: "৪০-৫০ দিন পর", daysOffset: 45, detail: "ইউরিয়া ৩য় কিস্তি", fertilizers: ["urea"], ureaShare: 1/3 },
];

const splitUrea2 = (): ScheduleItem[] => [
  { when: "রোপণের আগে", daysOffset: 0,  detail: "TSP, MOP, জিপসাম ও জিংক একসাথে মাটিতে মেশান", fertilizers: ["tsp", "mop", "gypsum", "zinc"] },
  { when: "২০-২৫ দিন পর", daysOffset: 22, detail: "ইউরিয়া ১ম কিস্তি", fertilizers: ["urea"], ureaShare: 1/2 },
  { when: "৪৫-৫০ দিন পর", daysOffset: 47, detail: "ইউরিয়া ২য় কিস্তি", fertilizers: ["urea"], ureaShare: 1/2 },
];

const RICE_WARN = [
  "জমিতে পানি বেশি থাকলে ইউরিয়া দেবেন না",
  "বৃষ্টির ঠিক আগে সার দেবেন না",
  "সার দেওয়ার পর ২-৩ দিন পানি ধরে রাখুন",
];
const VEG_WARN = [
  "শুকনো মাটিতে সার দিলে হালকা সেচ দিন",
  "গাছের গোড়া থেকে ১৫ সেমি দূরে সার দিন",
];

export const CROPS: CropDose[] = [
  { id: "boro",    emoji: "🌾", label: "বোরো ধান", urea: 2.4, tsp: 1.2, mop: 1.4, gypsum: 0.8, zinc: 0.15, schedule: splitUrea3(RICE_WARN), warnings: RICE_WARN },
  { id: "aman",    emoji: "🌾", label: "আমন ধান",  urea: 1.6, tsp: 0.8, mop: 1.0, gypsum: 0.5, zinc: 0.10, schedule: splitUrea3(RICE_WARN), warnings: RICE_WARN },
  { id: "aush",    emoji: "🌾", label: "আউশ ধান",  urea: 1.8, tsp: 1.0, mop: 1.1, gypsum: 0.6, zinc: 0.12, schedule: splitUrea3(RICE_WARN), warnings: RICE_WARN },
  { id: "wheat",   emoji: "🌿", label: "গম",       urea: 2.0, tsp: 1.4, mop: 1.2, gypsum: 0.8, zinc: 0.10, schedule: splitUrea2(),          warnings: VEG_WARN },
  { id: "maize",   emoji: "🌽", label: "ভুট্টা",   urea: 3.0, tsp: 1.6, mop: 1.5, gypsum: 1.0, zinc: 0.15, schedule: splitUrea3(VEG_WARN),  warnings: VEG_WARN },
  { id: "potato",  emoji: "🥔", label: "আলু",      urea: 3.4, tsp: 2.0, mop: 2.6, gypsum: 1.2, zinc: 0.20, schedule: splitUrea2(),          warnings: VEG_WARN },
  { id: "tomato",  emoji: "🍅", label: "টমেটো",    urea: 2.8, tsp: 2.4, mop: 2.0, gypsum: 1.0, zinc: 0.20, schedule: splitUrea3(VEG_WARN),  warnings: VEG_WARN },
  { id: "brinjal", emoji: "🍆", label: "বেগুন",    urea: 2.6, tsp: 2.0, mop: 1.8, gypsum: 1.0, zinc: 0.18, schedule: splitUrea3(VEG_WARN),  warnings: VEG_WARN },
  { id: "onion",   emoji: "🧅", label: "পেঁয়াজ",  urea: 2.4, tsp: 1.8, mop: 1.8, gypsum: 1.0, zinc: 0.15, schedule: splitUrea2(),          warnings: VEG_WARN },
  { id: "garlic",  emoji: "🧄", label: "রসুন",     urea: 2.0, tsp: 1.6, mop: 1.5, gypsum: 0.8, zinc: 0.12, schedule: splitUrea2(),          warnings: VEG_WARN },
  { id: "chili",   emoji: "🌶️", label: "মরিচ",     urea: 2.2, tsp: 1.8, mop: 1.6, gypsum: 0.8, zinc: 0.15, schedule: splitUrea3(VEG_WARN),  warnings: VEG_WARN },
  { id: "gourd",   emoji: "🎃", label: "লাউ/কুমড়া", urea: 2.0, tsp: 1.6, mop: 1.4, gypsum: 0.8, zinc: 0.15, schedule: splitUrea3(VEG_WARN), warnings: VEG_WARN },
  { id: "mustard", emoji: "🌻", label: "সরিষা",    urea: 1.6, tsp: 1.2, mop: 0.8, gypsum: 0.8, zinc: 0.10, schedule: splitUrea2(),          warnings: VEG_WARN },
];

export type Unit = "shotok" | "bigha" | "acre" | "hectare";
export const UNIT_TO_SHOTOK: Record<Unit, number> = { shotok: 1, bigha: 33, acre: 100, hectare: 247 };
export const UNIT_LABEL: Record<Unit, string> = { shotok: "শতক", bigha: "বিঘা", acre: "একর", hectare: "হেক্টর" };

export type CalcResult = {
  urea: number; tsp: number; mop: number; gypsum: number; zinc: number;
  totalCost: number;
  schedule: { when: string; daysOffset: number; detail: string; amounts: { name: string; kg: number }[] }[];
  warnings: string[];
};

const FERT_LABEL = { urea: "ইউরিয়া", tsp: "টিএসপি", mop: "এমওপি", gypsum: "জিপসাম", zinc: "জিংক সালফেট" } as const;

export function calculate(cropId: string, shotok: number, soil: SoilType): CalcResult | null {
  const crop = CROPS.find((c) => c.id === cropId);
  if (!crop) return null;
  const f = SOIL_FACTOR[soil];
  const total = {
    urea:   crop.urea   * shotok * f.urea,
    tsp:    crop.tsp    * shotok * f.tsp,
    mop:    crop.mop    * shotok * f.mop,
    gypsum: crop.gypsum * shotok * f.gypsum,
    zinc:   crop.zinc   * shotok * f.zinc,
  };
  const totalCost =
    total.urea * PRICE_PER_KG.urea +
    total.tsp * PRICE_PER_KG.tsp +
    total.mop * PRICE_PER_KG.mop +
    total.gypsum * PRICE_PER_KG.gypsum +
    total.zinc * PRICE_PER_KG.zinc;

  const schedule = crop.schedule.map((s) => {
    const amounts: { name: string; kg: number }[] = [];
    for (const k of s.fertilizers) {
      const base = total[k];
      const kg = k === "urea" && s.ureaShare ? base * s.ureaShare : base;
      amounts.push({ name: FERT_LABEL[k], kg });
    }
    return { when: s.when, daysOffset: s.daysOffset, detail: s.detail, amounts };
  });

  return { ...total, totalCost, schedule, warnings: crop.warnings };
}
