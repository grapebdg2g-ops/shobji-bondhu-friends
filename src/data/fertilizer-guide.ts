// BRRI/BARI fertilizer recommendations.
// Base doses are stored as kg per শতাংশ for the calculator UI.
// 1 শতাংশ ≈ 40.46 m²; 1 বিঘা = 33 শতাংশ; 1 একর = 100 শতাংশ; 1 হেক্টর ≈ 247 শতাংশ.
// Official recommendations are soil-test/AEZ dependent. Never treat an unverified row as a universal dose.

export const BARC_PROTOCOL_INDEX_URL =
  "https://barc.gov.bd/pages/static-pages/6922dc3e933eb65569e0f37a";
export const BARI_FRG_2024_NOTICE_URL =
  "https://bari.gov.bd/pages/notices/6922e2c0dbfbab28ce081cb5";
export const BRINJAL_BARC_2024_PROTOCOL_URL =
  "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2024/12/d029ab0fd1304a108df54a008133e02f.pdf";
export const BOTTLE_GOURD_BARC_2024_PROTOCOL_URL =
  "https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2024/12/29bfab5e2e2645068816e65b6786b9b2.pdf";

const HECTARE_TO_SHOTOK = 1 / 247;

export type SoilType = "clay" | "loam" | "sandy" | "silt";

export const SOIL_TYPES: { id: SoilType; label: string; emoji: string; note: string }[] = [
  { id: "clay", emoji: "🟤", label: "এঁটেল মাটি", note: "ভারী, চটচটে" },
  { id: "loam", emoji: "🟡", label: "দোআঁশ মাটি", note: "সেরা, বেশিরভাগ জমি" },
  { id: "sandy", emoji: "⚪", label: "বালি মাটি", note: "হালকা, ঝরঝরে" },
  { id: "silt", emoji: "🔵", label: "পলি মাটি", note: "নদীর পাড়ে" },
];

export type ScheduleItem = {
  when: string; // "রোপণের আগে" / "৭-১০ দিন পর"
  daysOffset: number; // for reminder; 0 = at planting
  detail: string; // what to apply
  fertilizers: ("urea" | "tsp" | "mop" | "gypsum" | "zinc")[]; // which to include
  ureaShare?: number; // 0..1 portion of total urea for this dose
  mopShare?: number; // 0..1 portion of total MOP for this dose
};

export type SupplementalDose = {
  name: string;
  kgPerHectare: number;
  note?: string;
};

export type CropDose = {
  id: string;
  emoji: string;
  label: string;
  // Base kg per শতাংশ. Official source rows are converted from kg/hectare.
  urea: number;
  tsp: number;
  mop: number;
  gypsum: number;
  zinc: number;
  schedule: ScheduleItem[];
  warnings: string[];
  verified: boolean;
  sourceTitle: string;
  sourceUrl: string;
  sourceNote: string;
  supplemental?: SupplementalDose[];
};

// Govt-set rates (BDT per kg, approximate)
export const PRICE_PER_KG = { urea: 27, tsp: 27, mop: 20, gypsum: 18, zinc: 230 } as const;

const splitUrea3 = (warnings: string[]): ScheduleItem[] => [
  {
    when: "রোপণের আগে",
    daysOffset: 0,
    detail: "TSP, MOP, জিপসাম ও জিংক একসাথে মাটিতে মেশান",
    fertilizers: ["tsp", "mop", "gypsum", "zinc"],
  },
  {
    when: "৭-১০ দিন পর",
    daysOffset: 9,
    detail: "ইউরিয়া ১ম কিস্তি",
    fertilizers: ["urea"],
    ureaShare: 1 / 3,
  },
  {
    when: "২৫-৩০ দিন পর",
    daysOffset: 28,
    detail: "ইউরিয়া ২য় কিস্তি",
    fertilizers: ["urea"],
    ureaShare: 1 / 3,
  },
  {
    when: "৪০-৫০ দিন পর",
    daysOffset: 45,
    detail: "ইউরিয়া ৩য় কিস্তি",
    fertilizers: ["urea"],
    ureaShare: 1 / 3,
  },
];

const splitUrea2 = (): ScheduleItem[] => [
  {
    when: "রোপণের আগে",
    daysOffset: 0,
    detail: "TSP, MOP, জিপসাম ও জিংক একসাথে মাটিতে মেশান",
    fertilizers: ["tsp", "mop", "gypsum", "zinc"],
  },
  {
    when: "২০-২৫ দিন পর",
    daysOffset: 22,
    detail: "ইউরিয়া ১ম কিস্তি",
    fertilizers: ["urea"],
    ureaShare: 1 / 2,
  },
  {
    when: "৪৫-৫০ দিন পর",
    daysOffset: 47,
    detail: "ইউরিয়া ২য় কিস্তি",
    fertilizers: ["urea"],
    ureaShare: 1 / 2,
  },
];

const RICE_WARN = [
  "জমিতে পানি বেশি থাকলে ইউরিয়া দেবেন না",
  "বৃষ্টির ঠিক আগে সার দেবেন না",
  "সার দেওয়ার পর ২-৩ দিন পানি ধরে রাখুন",
];
const VEG_WARN = ["শুকনো মাটিতে সার দিলে হালকা সেচ দিন", "গাছের গোড়া থেকে ১৫ সেমি দূরে সার দিন"];

const UNVERIFIED_SOURCE_NOTE =
  "এই ফসলের exact BARC FRG-2024 table এখনো অ্যাপে mapping করা হয়নি। বর্তমান হিসাবটি প্রাথমিক; মাটি পরীক্ষা ও স্থানীয় কৃষি কর্মকর্তার পরামর্শ ছাড়া চূড়ান্ত dose হিসেবে ব্যবহার করবেন না।";
const UNVERIFIED_CROP_META = {
  verified: false,
  sourceTitle: "BARC official GAP protocol index / FRG-2024 mapping pending",
  sourceUrl: BARC_PROTOCOL_INDEX_URL,
  sourceNote: UNVERIFIED_SOURCE_NOTE,
} as const;

export const CROPS: CropDose[] = [
  {
    id: "boro",
    emoji: "🌾",
    label: "বোরো ধান",
    urea: 2.4,
    tsp: 1.2,
    mop: 1.4,
    gypsum: 0.8,
    zinc: 0.15,
    schedule: splitUrea3(RICE_WARN),
    warnings: RICE_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "aman",
    emoji: "🌾",
    label: "আমন ধান",
    urea: 1.6,
    tsp: 0.8,
    mop: 1.0,
    gypsum: 0.5,
    zinc: 0.1,
    schedule: splitUrea3(RICE_WARN),
    warnings: RICE_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "aush",
    emoji: "🌾",
    label: "আউশ ধান",
    urea: 1.8,
    tsp: 1.0,
    mop: 1.1,
    gypsum: 0.6,
    zinc: 0.12,
    schedule: splitUrea3(RICE_WARN),
    warnings: RICE_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "wheat",
    emoji: "🌿",
    label: "গম",
    urea: 2.0,
    tsp: 1.4,
    mop: 1.2,
    gypsum: 0.8,
    zinc: 0.1,
    schedule: splitUrea2(),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "maize",
    emoji: "🌽",
    label: "ভুট্টা",
    urea: 3.0,
    tsp: 1.6,
    mop: 1.5,
    gypsum: 1.0,
    zinc: 0.15,
    schedule: splitUrea3(VEG_WARN),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "potato",
    emoji: "🥔",
    label: "আলু",
    urea: 3.4,
    tsp: 2.0,
    mop: 2.6,
    gypsum: 1.2,
    zinc: 0.2,
    schedule: splitUrea2(),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "tomato",
    emoji: "🍅",
    label: "টমেটো",
    urea: 2.8,
    tsp: 2.4,
    mop: 2.0,
    gypsum: 1.0,
    zinc: 0.2,
    schedule: splitUrea3(VEG_WARN),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "brinjal",
    emoji: "🍆",
    label: "বেগুন",
    // BARC GAP protocol: Urea 300, TSP 300, MOP 250, gypsum 100, zinc sulfate 5 kg/hectare.
    urea: 300 * HECTARE_TO_SHOTOK,
    tsp: 300 * HECTARE_TO_SHOTOK,
    mop: 250 * HECTARE_TO_SHOTOK,
    gypsum: 100 * HECTARE_TO_SHOTOK,
    zinc: 5 * HECTARE_TO_SHOTOK,
    schedule: [
      {
        when: "রোপণের ৭ দিন আগে",
        daysOffset: 0,
        detail: "সমস্ত জৈবসার, TSP, জিপসাম, জিংক ও ১/৪ এমওপি মাটিতে মেশান",
        fertilizers: ["tsp", "gypsum", "zinc", "mop"],
        mopShare: 1 / 4,
      },
      {
        when: "চারা রোপণের পর",
        daysOffset: 7,
        detail: "ইউরিয়া ও বাকি এমওপি উপরিপ্রয়োগ করুন",
        fertilizers: ["urea", "mop"],
        ureaShare: 1,
        mopShare: 3 / 4,
      },
    ],
    warnings: [
      ...VEG_WARN,
      "BARC protocol অনুযায়ী শেষ dose মাটি পরীক্ষার ফলের ভিত্তিতে সমন্বয় করুন",
    ],
    verified: true,
    sourceTitle: "বাংলাদেশ GAP প্রোটোকল: বেগুন — BARC (FRG-2024 reference)",
    sourceUrl: BRINJAL_BARC_2024_PROTOCOL_URL,
    sourceNote:
      "Official protocol-এর hectare dose থেকে হিসাব করা হয়েছে: ইউরিয়া ৩০০, টিএসপি ৩০০, এমওপি ২৫০, জিপসাম ১০০ এবং জিংক সালফেট ৫ কেজি/হেক্টর। একই protocol-এ গোবর ১,০০০ (farm compost ২,০০০), বোরিক এসিড ৫ ও ম্যাগনেসিয়াম অক্সাইড ৫ কেজি/হেক্টরও উল্লেখ আছে; এগুলো এই calculator-এর chemical total-এ অন্তর্ভুক্ত নয়। চূড়ান্ত dose মাটি পরীক্ষাভিত্তিক।",
    supplemental: [
      { name: "গোবর সার", kgPerHectare: 1000, note: "ফার্ম কম্পোস্ট হলে ২০০০ কেজি/হেক্টর" },
      { name: "বোরিক এসিড", kgPerHectare: 5 },
      { name: "ম্যাগনেসিয়াম অক্সাইড", kgPerHectare: 5 },
    ],
  },
  {
    id: "onion",
    emoji: "🧅",
    label: "পেঁয়াজ",
    urea: 2.4,
    tsp: 1.8,
    mop: 1.8,
    gypsum: 1.0,
    zinc: 0.15,
    schedule: splitUrea2(),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "garlic",
    emoji: "🧄",
    label: "রসুন",
    urea: 2.0,
    tsp: 1.6,
    mop: 1.5,
    gypsum: 0.8,
    zinc: 0.12,
    schedule: splitUrea2(),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "chili",
    emoji: "🌶️",
    label: "মরিচ",
    urea: 2.2,
    tsp: 1.8,
    mop: 1.6,
    gypsum: 0.8,
    zinc: 0.15,
    schedule: splitUrea3(VEG_WARN),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
  {
    id: "gourd",
    emoji: "🎃",
    label: "লাউ",
    // BARC GAP protocol: Urea 160, TSP 180, MOP 120, gypsum 120, zinc sulfate 10 kg/hectare.
    urea: 160 * HECTARE_TO_SHOTOK,
    tsp: 180 * HECTARE_TO_SHOTOK,
    mop: 120 * HECTARE_TO_SHOTOK,
    gypsum: 120 * HECTARE_TO_SHOTOK,
    zinc: 10 * HECTARE_TO_SHOTOK,
    schedule: [
      {
        when: "রোপণের ৭ দিন আগে",
        daysOffset: 0,
        detail: "সমস্ত জৈবসার, TSP, জিপসাম, জিংক, ম্যাগনেসিয়াম ও ১/৪ এমওপি মাটিতে/পিটে মেশান",
        fertilizers: ["tsp", "gypsum", "zinc", "mop"],
        mopShare: 1 / 4,
      },
      {
        when: "চারা রোপণের ১৫–২০ দিন পর",
        daysOffset: 18,
        detail: "ইউরিয়া ও এমওপির ১ম উপরিপ্রয়োগ",
        fertilizers: ["urea", "mop"],
        ureaShare: 1 / 4,
        mopShare: 1 / 4,
      },
      {
        when: "চারা রোপণের ৫০–৫৫ দিন পর",
        daysOffset: 53,
        detail: "ইউরিয়া ও এমওপির ২য় উপরিপ্রয়োগ",
        fertilizers: ["urea", "mop"],
        ureaShare: 1 / 4,
        mopShare: 1 / 4,
      },
      {
        when: "চারা রোপণের ৯০–১০০ দিন পর",
        daysOffset: 95,
        detail: "ইউরিয়া ও এমওপির ৩য় উপরিপ্রয়োগ",
        fertilizers: ["urea", "mop"],
        ureaShare: 1 / 4,
        mopShare: 1 / 4,
      },
      {
        when: "চারা রোপণের ১২০–১৩০ দিন পর",
        daysOffset: 125,
        detail: "ইউরিয়ার শেষ কিস্তি উপরিপ্রয়োগ",
        fertilizers: ["urea"],
        ureaShare: 1 / 4,
      },
    ],
    warnings: [
      ...VEG_WARN,
      "এই dose লাউ-এর জন্য; কুমড়ার জন্য আলাদা BARC table না পাওয়া পর্যন্ত একই dose ব্যবহার করবেন না",
      "BARC protocol অনুযায়ী মাটি বিশ্লেষণের ফলের ভিত্তিতে final dose সমন্বয় করুন",
    ],
    verified: true,
    sourceTitle: "বাংলাদেশ GAP প্রোটোকল: লাউ — BARC (FRG-2024 reference)",
    sourceUrl: BOTTLE_GOURD_BARC_2024_PROTOCOL_URL,
    sourceNote:
      "Official protocol-এর hectare table থেকে হিসাব করা হয়েছে: ইউরিয়া ১৬০, টিএসপি ১৮০, এমওপি ১২০, জিপসাম ১২০ ও জিংক সালফেট ১০ কেজি/হেক্টর। একই table-এ গোবর/কম্পোস্ট ১০ টন, ভার্মি-কম্পোস্ট ৫ টন, বোরিক এসিড ৮ ও ম্যাগনেসিয়াম অক্সাইড ১২ কেজি/হেক্টর উল্লেখ আছে। চূড়ান্ত dose মাটি পরীক্ষাভিত্তিক।",
    supplemental: [
      { name: "গোবর/কম্পোস্ট", kgPerHectare: 10000, note: "লাউ protocol table" },
      { name: "ভার্মি-কম্পোস্ট", kgPerHectare: 5000 },
      { name: "বোরিক এসিড", kgPerHectare: 8 },
      { name: "ম্যাগনেসিয়াম অক্সাইড", kgPerHectare: 12 },
    ],
  },
  {
    id: "mustard",
    emoji: "🌻",
    label: "সরিষা",
    urea: 1.6,
    tsp: 1.2,
    mop: 0.8,
    gypsum: 0.8,
    zinc: 0.1,
    schedule: splitUrea2(),
    warnings: VEG_WARN,
    ...UNVERIFIED_CROP_META,
  },
];

export type Unit = "shotok" | "bigha" | "acre" | "hectare";
export const UNIT_TO_SHOTOK: Record<Unit, number> = {
  shotok: 1,
  bigha: 33,
  acre: 100,
  hectare: 247,
};
export const UNIT_LABEL: Record<Unit, string> = {
  shotok: "শতক",
  bigha: "বিঘা",
  acre: "একর",
  hectare: "হেক্টর",
};

export type CalcResult = {
  urea: number;
  tsp: number;
  mop: number;
  gypsum: number;
  zinc: number;
  supplemental: { name: string; kg: number; note?: string }[];
  totalCost: number;
  schedule: {
    when: string;
    daysOffset: number;
    detail: string;
    amounts: { name: string; kg: number }[];
  }[];
  warnings: string[];
};

const FERT_LABEL = {
  urea: "ইউরিয়া",
  tsp: "টিএসপি",
  mop: "এমওপি",
  gypsum: "জিপসাম",
  zinc: "জিংক সালফেট",
} as const;

export function calculate(cropId: string, shotok: number, _soil: SoilType): CalcResult | null {
  const crop = CROPS.find((c) => c.id === cropId);
  if (!crop) return null;
  // Soil multipliers are intentionally not applied: FRG-2024 requires soil-test/AEZ context.
  const total = {
    urea: crop.urea * shotok,
    tsp: crop.tsp * shotok,
    mop: crop.mop * shotok,
    gypsum: crop.gypsum * shotok,
    zinc: crop.zinc * shotok,
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
      const kg =
        k === "urea" && s.ureaShare
          ? base * s.ureaShare
          : k === "mop" && s.mopShare
            ? base * s.mopShare
            : base;
      amounts.push({ name: FERT_LABEL[k], kg });
    }
    return { when: s.when, daysOffset: s.daysOffset, detail: s.detail, amounts };
  });

  const supplemental = (crop.supplemental ?? []).map((item) => ({
    name: item.name,
    kg: item.kgPerHectare * shotok * HECTARE_TO_SHOTOK,
    note: item.note,
  }));

  return { ...total, supplemental, totalCost, schedule, warnings: crop.warnings };
}
