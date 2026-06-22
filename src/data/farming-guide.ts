// src/data/farming-guide.ts
// Source: AIS (ais.gov.bd), BARI, BRRI, DAE

export type TaskType =
  | 'preparation'
  | 'task'
  | 'fertilizer'
  | 'irrigation'
  | 'disease'
  | 'pest'
  | 'harvest'
  | 'post-harvest';

export interface FarmingTask {
  title: string;
  desc: string;
  image: string;
  type: TaskType;
}

export interface FarmingStage {
  id: string;
  name: string;
  icon: string;
  dayRange: string;
  startDay: number;
  endDay: number;
  tasks: FarmingTask[];
}

export interface CropGuide {
  icon: string;
  season: string;
  totalDays: number;
  yield: string;
  varieties: string[];
  soil: string;
  stages: FarmingStage[];
}

export const FARMING_STAGES: Record<string, CropGuide> = {
  // ══════════════════════════════
  // টমেটো — AIS/BARI সুপারিশ
  // ══════════════════════════════
  'টমেটো': {
    icon: '🍅',
    season: 'রবি (অক্টোবর-মার্চ)',
    totalDays: 150,
    yield: '৮০-১২০ মণ/বিঘা',
    varieties: [
      'বারি টমেটো-২', 'বারি টমেটো-৩',
      'বারি টমেটো-৪', 'বারি টমেটো-১৫',
      'হাইব্রিড: মাহি, রতন, চয়ন',
    ],
    soil: 'দো-আঁশ বা এঁটেল দো-আঁশ মাটি, pH ৬.০-৭.০',
    stages: [
      {
        id: 'seed-bed',
        name: 'বীজতলা তৈরি',
        icon: '🌱',
        dayRange: '০ - ২৫ দিন',
        startDay: 0,
        endDay: 25,
        tasks: [
          { title: 'বীজতলা তৈরি', desc: 'উঁচু ও পানি নিষ্কাশনযোগ্য জমিতে ৩×১ মিটার বীজতলা তৈরি করুন। বালু, পচা গোবর ও উর্বর মাটি সমপরিমাণে মিশিয়ে বীজতলা প্রস্তুত করুন।', image: 'seedbed', type: 'preparation' },
          { title: 'বীজ শোধন', desc: '৫০°C গরম পানিতে ৩০ মিনিট বীজ ভিজিয়ে রাখুন। এতে ছত্রাক ও ব্যাকটেরিয়া মরে যায়। বিকল্পে রসুনের রস বা ছত্রাকনাশক ব্যবহার করুন।', image: 'seed-treatment', type: 'task' },
          { title: 'বীজ বপন', desc: 'শোধন করা বীজ ছায়ায় শুকিয়ে সারিতে বপন করুন। সারি থেকে সারি ৫ সেমি দূরত্বে। আগাম: শ্রাবণ-ভাদ্র। মূল মৌসুম: আশ্বিন-কার্তিক।', image: 'sowing', type: 'task' },
          { title: 'চারার যত্ন', desc: '৪-৫ দিন পরপর সেচ দিন। অতিরিক্ত সেচে চারা লম্বা ও দুর্বল হয়। জমাট পানি অবশ্যই সরিয়ে দিন।', image: 'seedling-care', type: 'irrigation' },
          { title: 'ড্যাম্পিং অফ রোগ দমন', desc: 'চারা মরে গেলে কার্বেনডাজিম গ্রুপের ছত্রাকনাশক দিন। বীজতলায় পলিথিন দিয়ে ২ সপ্তাহ ঢেকে রাখলে মাটি শোধন হয়।', image: 'damping-off', type: 'disease' },
        ],
      },
      {
        id: 'land-prep',
        name: 'জমি তৈরি ও রোপণ',
        icon: '🚜',
        dayRange: '২৫ - ৩৫ দিন',
        startDay: 25,
        endDay: 35,
        tasks: [
          { title: 'জমি তৈরি', desc: 'সারাদিন রোদ পায় এমন জমি বেছে নিন। ৪-৫টি গভীর চাষ ও মই দিয়ে মাটি ঝুরঝুরে করুন। ২৩০ সেমি চওড়া ও ২৫-৩০ সেমি উঁচু বেড তৈরি করুন। দুটি বেডের মাঝে ৩০ সেমি নালা রাখুন।', image: 'land-prep', type: 'preparation' },
          { title: 'জমিতে সার দেওয়া', desc: 'শেষ চাষে অর্ধেক গোবর সার ও সম্পূর্ণ TSP মাটিতে মেশান। বাকি গোবর সার চারা লাগানোর গর্তে দিন।', image: 'basal-fertilizer', type: 'fertilizer' },
          { title: 'চারা রোপণ', desc: '২৫-৩০ দিনের সুস্থ চারা রোপণ করুন। সারি থেকে সারি ৬০ সেমি, চারা থেকে চারা ৪৫-৬০ সেমি। বিকেলে রোপণ করুন এবং সেচ দিন।', image: 'transplanting', type: 'task' },
          { title: 'নিমাটোড দমন', desc: 'শিকড়ে কৃমি থাকলে কার্বোফুরান বা ফুরাডান দিন। আগের মৌসুমে সমস্যা থাকলে আগেই দিন।', image: 'nematode', type: 'pest' },
        ],
      },
      {
        id: 'vegetative',
        name: 'গাছের বৃদ্ধি পর্যায়',
        icon: '🌿',
        dayRange: '৩৫ - ৬৫ দিন',
        startDay: 35,
        endDay: 65,
        tasks: [
          { title: 'খুঁটি দেওয়া', desc: '"অ" আকৃতির বাঁশের খুঁটি দিন। খুঁটি ছাড়া গাছ ভেঙে পড়ে ও ফলন কমে। রোপণের ১০-১৫ দিনের মধ্যে খুঁটি দিন।', image: 'staking', type: 'task' },
          { title: 'আগাছা দমন', desc: 'রোপণের ১৫-২০ দিন পর প্রথম নিড়ানি দিন। মাসে ১-২ বার নিড়ানি দিন।', image: 'weeding', type: 'task' },
          { title: 'জল ব্যবস্থাপনা', desc: '৭-১০ দিন পরপর সেচ দিন। গাছের গোড়ায় পানি না জমতে দেওয়া। বৃষ্টির পানি দ্রুত সরিয়ে দিন।', image: 'irrigation', type: 'irrigation' },
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'রোপণের ৩য় সপ্তাহে ইউরিয়া ও MOP রিং পদ্ধতিতে গাছের চারদিকে দিন। দেওয়ার পর মাটিতে মিশিয়ে সেচ দিন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আর্লি ব্লাইট রোগ দমন', desc: 'পাতায় বাদামি গোলাকার দাগ দেখলে ম্যানকোজেব দিন। আক্রান্ত পাতা তুলে পুড়িয়ে দিন। ১০ দিন পর পুনরায় স্প্রে করুন।', image: 'early-blight', type: 'disease' },
          { title: 'টমেটো মোজাইক ভাইরাস', desc: 'পাতা কুঁকড়ে গেলে আক্রান্ত গাছ তুলে ফেলুন। ভাইরাসের ওষুধ নেই — সাদা মাছি ও জাব পোকা দমন করুন।', image: 'mosaic-virus', type: 'disease' },
          { title: 'লিফ স্পট দমন', desc: 'পাতায় ছোট হলুদ দাগ দেখলে কপার অক্সিক্লোরাইড দিন।', image: 'leaf-spot', type: 'disease' },
          { title: 'শোষক পোকা দমন', desc: 'জাব পোকা, সাদা মাছি, থ্রিপস দমনে ইমিডাক্লোপ্রিড বা ডায়ামেথোয়েট স্প্রে করুন। নিম তেলও কার্যকর।', image: 'sucking-pest', type: 'pest' },
        ],
      },
      {
        id: 'flowering',
        name: 'ফুল আসার সময়',
        icon: '🌸',
        dayRange: '৬৫ - ৯৫ দিন',
        startDay: 65,
        endDay: 95,
        tasks: [
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'রোপণের ৫ম সপ্তাহে ইউরিয়া ও MOP রিং পদ্ধতিতে দিন। ফুল আসার সময় সার দিলে ফল বেশি হয়।', image: 'urea-2', type: 'fertilizer' },
          { title: 'পুনিং (গাছ ছাঁটাই)', desc: 'অতিরিক্ত শাখা ছেঁটে ফেলুন। ২-৩টি মূল শাখা রাখুন। ছাঁটাই না করলে ফল ছোট হয়।', image: 'pruning', type: 'task' },
          { title: 'ম্যাগনেসিয়াম সালফেট', desc: 'পাতা হলুদ হলে ম্যাগনেসিয়াম সালফেট পাতায় স্প্রে করুন। ১০০ গ্রাম / ১০ লিটার পানি।', image: 'mg-sulfate', type: 'fertilizer' },
          { title: 'টমেটো বোরার দমন', desc: 'ফলে ছিদ্র দেখলে ক্লোরপাইরিফস বা সাইপারমেথ্রিন দিন। ফেরোমন ফাঁদ ব্যবহার করুন।', image: 'tomato-borer', type: 'pest' },
          { title: 'অ্যানথ্রাকনোজ দমন', desc: 'ফলে কালো দাগ পড়লে কার্বেনডাজিম দিন। আক্রান্ত ফল তুলে ফেলুন।', image: 'anthracnose', type: 'disease' },
          { title: 'পাউডারি মিলডিউ দমন', desc: 'পাতায় সাদা গুঁড়া দেখলে সালফার বা কার্বেনডাজিম স্প্রে করুন।', image: 'powdery-mildew', type: 'disease' },
          { title: 'লেট ব্লাইট দমন', desc: 'পাতায় জলসিক্ত কালো দাগ দেখলে ম্যানকোজেব + মেটালক্সিল দিন। বৃষ্টির পরে বিশেষ সতর্ক থাকুন।', image: 'late-blight', type: 'disease' },
        ],
      },
      {
        id: 'fruit-dev',
        name: 'ফলের বিকাশের পর্যায়',
        icon: '🍅',
        dayRange: '৯৫ - ১৩০ দিন',
        startDay: 95,
        endDay: 130,
        tasks: [
          { title: 'জল ব্যবস্থাপনা', desc: 'নিয়মিত সেচ দিন। মাটি শুকিয়ে গেলে ফল ফেটে যায় ও ব্লসম এন্ড রট হয়।', image: 'irrigation', type: 'irrigation' },
          { title: 'আগাছা দমন', desc: 'নিয়মিত নিড়ানি দিন। ফল বড় হওয়ার সময় পুষ্টির প্রতিযোগিতা কমান।', image: 'weeding', type: 'task' },
          { title: 'পাতায় সার স্প্রে', desc: 'জিংক সালফেট ও বোরন পাতায় স্প্রে করুন। ফল বড় ও মানসম্পন্ন হবে।', image: 'foliar-spray', type: 'fertilizer' },
          { title: 'লেট ব্লাইট দমন', desc: 'ম্যানকোজেব + মেটালক্সিল নিয়মিত দিন। ঠান্ডা আবহাওয়ায় বেশি সতর্ক থাকুন।', image: 'late-blight', type: 'disease' },
          { title: 'শোষক পোকা দমন', desc: 'থ্রিপস ও সাদা মাছি দমনে ইমিডাক্লোপ্রিড দিন।', image: 'sucking-pest', type: 'pest' },
        ],
      },
      {
        id: 'harvest',
        name: 'ফল সংগ্রহ',
        icon: '🧺',
        dayRange: '১৩০ - ১৫০ দিন',
        startDay: 130,
        endDay: 150,
        tasks: [
          { title: 'ফসল সংগ্রহ', desc: 'ফল হালকা লাল হলে সংগ্রহ শুরু করুন। দূরে বিক্রির জন্য সবুজাভ লাল অবস্থায় তুলুন। সকালে ঠান্ডায় ৫-৭ দিন পরপর সংগ্রহ করুন।', image: 'harvesting', type: 'harvest' },
          { title: 'বাজারজাতকরণ', desc: 'ফল গ্রেড অনুযায়ী আলাদা করুন। বড়: ৫০+ গ্রাম, মাঝারি: ৩০-৫০ গ্রাম। কার্টনে প্যাক করে বাজারে পাঠান।', image: 'marketing', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // বোরো ধান — BRRI সুপারিশ
  // ══════════════════════════════
  'বোরো ধান': {
    icon: '🌾',
    season: 'বোরো (ডিসেম্বর-মে)',
    totalDays: 150,
    yield: '৩০-৪৫ মণ/বিঘা',
    varieties: ['BRRI dhan28', 'BRRI dhan29', 'BRRI dhan58', 'BRRI dhan74', 'বিনা ধান-১৪'],
    soil: 'যেকোনো মাটি, সেচের সুবিধা থাকতে হবে',
    stages: [
      {
        id: 'seedbed', name: 'বীজতলা', icon: '🌱', dayRange: '০ - ৩০ দিন', startDay: 0, endDay: 30,
        tasks: [
          { title: 'বীজ নির্বাচন ও শোধন', desc: 'পুষ্ট বীজ বাছাই করুন। পানিতে ডুবিয়ে ভাসা বীজ ফেলুন। কার্বেনডাজিম দিয়ে বীজ শোধন করুন।', image: 'seed-selection', type: 'preparation' },
          { title: 'বীজতলা প্রস্তুত', desc: 'বিঘা প্রতি ১ কাঠা বীজতলা করুন। জমি চাষ দিয়ে কাদাময় করুন। নভেম্বর মাসে বীজতলা করুন।', image: 'seedbed-prep', type: 'preparation' },
          { title: 'চারার যত্ন', desc: 'থ্রিপস পোকা দেখলে মেলাথিয়ন স্প্রে করুন। চারা হলুদ হলে ইউরিয়া ছিটান।', image: 'seedling-care', type: 'task' },
        ],
      },
      {
        id: 'transplanting', name: 'চারা রোপণ', icon: '🚜', dayRange: '৩০ - ৪৫ দিন', startDay: 30, endDay: 45,
        tasks: [
          { title: 'জমি তৈরি', desc: '৪-৫টি চাষ ও মই দিয়ে কাদাময় করুন। শেষ চাষে TSP, MOP, Gypsum, Zinc মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'চারা রোপণ', desc: '২৫-৩০ দিনের চারা রোপণ করুন। সারিতে ২০×১৫ সেমি দূরত্বে। গুছিতে ২-৩টি চারা।', image: 'transplanting', type: 'task' },
          { title: 'পাখি বসার ডাল পোঁতা', desc: 'জমিতে ডালপালা পুঁতে দিন। পাখি বসে ক্ষতিকর পোকা খাবে।', image: 'bird-perch', type: 'pest' },
        ],
      },
      {
        id: 'vegetative-rice', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '৪৫ - ৮০ দিন', startDay: 45, endDay: 80,
        tasks: [
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'রোপণের ৭-১০ দিন পর ইউরিয়া দিন। ছিপছিপে পানিতে দিন। ২-৩ দিন পানি বন্ধ রাখুন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন', desc: 'রোপণের ১৫-২০ দিন পর নিড়ানি দিন। উইডার বা হাত দিয়ে আগাছা তুলুন।', image: 'weeding', type: 'task' },
          { title: 'সেচ ব্যবস্থাপনা (AWD)', desc: 'AWD পদ্ধতিতে সেচ দিন। পানি শুকিয়ে গেলে ৩-৫ সেমি পানি দিন। কাইচথোড় আসলে সবসময় পানি রাখুন।', image: 'awd-irrigation', type: 'irrigation' },
          { title: 'মাজরা পোকা দমন', desc: 'ডেড হার্ট দেখলে কার্টাপ বা ক্লোরপাইরিফস দিন। ফেরোমন ফাঁদ ব্যবহার করুন।', image: 'stem-borer', type: 'pest' },
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'রোপণের ২৫-৩০ দিন পর ২য় কিস্তি দিন। কুশি বাড়ার সময়।', image: 'urea-2', type: 'fertilizer' },
        ],
      },
      {
        id: 'panicle', name: 'থোড় আসার সময়', icon: '🌾', dayRange: '৮০ - ১১০ দিন', startDay: 80, endDay: 110,
        tasks: [
          { title: 'ইউরিয়া ৩য় কিস্তি', desc: 'থোড় আসার ৭-১০ দিন আগে ৩য় কিস্তি দিন। এটি সবচেয়ে গুরুত্বপূর্ণ কিস্তি।', image: 'urea-3', type: 'fertilizer' },
          { title: 'ব্লাস্ট রোগ দমন', desc: 'পাতা ও থোড়ে ধূসর ডায়মন্ড আকারের দাগ দেখলে ট্রাইসাইক্লাজোল দিন। ঠান্ডা ও মেঘলা আবহাওয়ায় বেশি সতর্ক থাকুন।', image: 'blast', type: 'disease' },
          { title: 'সেচ নিশ্চিত করুন', desc: 'থোড় ও ফুল আসার সময় অবশ্যই পানি রাখুন। এ সময় পানির অভাবে চিটা বাড়ে।', image: 'irrigation', type: 'irrigation' },
        ],
      },
      {
        id: 'ripening', name: 'ধান পাকার পর্যায়', icon: '🌟', dayRange: '১১০ - ১৪০ দিন', startDay: 110, endDay: 140,
        tasks: [
          { title: 'পানি বের করুন', desc: 'ধান পাকার ১০-১৫ দিন আগে জমি থেকে পানি বের করুন। এতে ধান সমানভাবে পাকে ও মাড়াই সহজ হয়।', image: 'drainage', type: 'irrigation' },
          { title: 'বাদামি গাছফড়িং দমন', desc: 'গাছের গোড়া দেখুন। গাছফড়িং দেখলে কার্বোসালফান বা ক্লোথিয়ানিডিন দিন।', image: 'bph', type: 'pest' },
        ],
      },
      {
        id: 'harvest-rice', name: 'ধান কাটা', icon: '🌾', dayRange: '১৪০ - ১৫০ দিন', startDay: 140, endDay: 150,
        tasks: [
          { title: 'ধান কাটা', desc: '৮০% ধান সোনালি হলে কাটুন। রিপার বা কম্বাইন হার্ভেস্টার ব্যবহার করুন। সকালে কাটলে ঝরে পড়া কম হয়।', image: 'harvesting', type: 'harvest' },
          { title: 'মাড়াই ও শুকানো', desc: 'কাটার পরপর মাড়াই করুন। রোদে ভালো করে শুকান (আর্দ্রতা ১৪% এর নিচে)। ভেজা ধান রাখলে পচে যায়।', image: 'threshing', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // আলু — BARI সুপারিশ
  // ══════════════════════════════
  'আলু': {
    icon: '🥔',
    season: 'রবি (অক্টোবর-ফেব্রুয়ারি)',
    totalDays: 100,
    yield: '৮০-১২০ মণ/বিঘা',
    varieties: ['ডায়মন্ট', 'কার্ডিনাল', 'গ্রানোলা', 'বারি আলু-৭', 'বারি আলু-২৫'],
    soil: 'বেলে দো-আঁশ বা দো-আঁশ মাটি',
    stages: [
      {
        id: 'seed-prep', name: 'বীজ আলু প্রস্তুতি', icon: '🥔', dayRange: '০ - ১৫ দিন', startDay: 0, endDay: 15,
        tasks: [
          { title: 'বীজ আলু নির্বাচন', desc: '৩০-৫০ গ্রাম ওজনের সুস্থ বীজ বাছাই করুন। রোগমুক্ত ও অঙ্কুরিত বীজ ব্যবহার করুন। বড় আলু ২ ভাগ করুন, প্রতি টুকরায় ২-৩টি চোখ রাখুন।', image: 'seed-potato', type: 'preparation' },
          { title: 'বীজ শোধন', desc: 'রোভরাল বা ডাইথেন M-45 দ্রবণে বীজ ভিজিয়ে শোধন করুন। শোধনের পর ছায়ায় শুকান।', image: 'seed-treatment', type: 'preparation' },
          { title: 'জমি তৈরি', desc: '৪-৫টি চাষ দিয়ে মাটি ঝুরঝুরে করুন। শেষ চাষে গোবর, TSP, MOP, Gypsum, Zinc মেশান।', image: 'land-prep', type: 'preparation' },
        ],
      },
      {
        id: 'planting', name: 'বীজ বপন', icon: '🌱', dayRange: '১৫ - ২৫ দিন', startDay: 15, endDay: 25,
        tasks: [
          { title: 'বীজ বপন', desc: 'অক্টোবর-নভেম্বর মাসে বপন করুন। সারি থেকে সারি ৬০ সেমি, বীজ থেকে বীজ ২৫ সেমি। ৮-১০ সেমি গভীরে বপন করুন।', image: 'planting', type: 'task' },
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'বপনের সময় মাটিতে মেশান। মোট ইউরিয়ার অর্ধেক এই কিস্তিতে।', image: 'urea-1', type: 'fertilizer' },
          { title: 'নিমাটোড দমন', desc: 'আগের মৌসুমে শিকড়ে কৃমি ছিলে কার্বোফুরান দিন।', image: 'nematode', type: 'pest' },
        ],
      },
      {
        id: 'emergence', name: 'গাছ বের হওয়া', icon: '🌿', dayRange: '২৫ - ৪৫ দিন', startDay: 25, endDay: 45,
        tasks: [
          { title: 'আগাছা দমন', desc: 'গাছ বের হওয়ার পর নিড়ানি দিন। আগাছামুক্ত রাখুন।', image: 'weeding', type: 'task' },
          { title: 'সেচ দেওয়া', desc: 'মাটি শুকালে সেচ দিন। আলুতে নিয়মিত সেচ দরকার।', image: 'irrigation', type: 'irrigation' },
          { title: 'আর্লি ব্লাইট দমন', desc: 'পাতায় বাদামি দাগ দেখলে ম্যানকোজেব দিন।', image: 'early-blight', type: 'disease' },
        ],
      },
      {
        id: 'hilling', name: 'মাটি তোলা (হিলিং)', icon: '⛏️', dayRange: '৪৫ - ৬০ দিন', startDay: 45, endDay: 60,
        tasks: [
          { title: 'হিলিং (মাটি তোলা)', desc: 'গাছের গোড়ায় মাটি তুলে দিন। এতে আলু বের হবে না ও সবুজ হবে না। হিলিং আলু চাষের সবচেয়ে গুরুত্বপূর্ণ কাজ।', image: 'hilling', type: 'task' },
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'হিলিং এর সময় ইউরিয়া ও MOP দিন। মাটির সাথে মিশিয়ে দিন।', image: 'urea-2', type: 'fertilizer' },
          { title: 'লেট ব্লাইট দমন', desc: 'পাতায় জলসিক্ত কালো দাগ দেখলে ম্যানকোজেব + মেটালক্সিল দিন। আলুর সবচেয়ে ভয়ংকর রোগ — সতর্ক থাকুন।', image: 'late-blight', type: 'disease' },
        ],
      },
      {
        id: 'tuber-dev', name: 'আলু বাঁধার পর্যায়', icon: '🥔', dayRange: '৬০ - ৯০ দিন', startDay: 60, endDay: 90,
        tasks: [
          { title: 'সেচ ব্যবস্থাপনা', desc: 'এ সময় পর্যাপ্ত সেচ দিন। মাটি শুকালে আলু ছোট থাকে।', image: 'irrigation', type: 'irrigation' },
          { title: 'লেট ব্লাইট নিয়মিত দমন', desc: '৭-১০ দিন পরপর ছত্রাকনাশক দিন।', image: 'late-blight', type: 'disease' },
          { title: 'গাছ কাটা', desc: 'বপনের ৯০ দিনে মাটির সমান করে গাছ কাটুন। আরও ১০ দিন মাটিতে রাখুন। এতে আলুর চামড়া শক্ত হবে।', image: 'vine-cutting', type: 'task' },
        ],
      },
      {
        id: 'harvest-potato', name: 'আলু তোলা ও সংরক্ষণ', icon: '🧺', dayRange: '৯০ - ১০০ দিন', startDay: 90, endDay: 100,
        tasks: [
          { title: 'আলু তোলা', desc: 'গাছ কাটার ১০ দিন পর আলু তুলুন। সকালে তুলুন, রোদে বেশিক্ষণ রাখবেন না।', image: 'harvesting', type: 'harvest' },
          { title: 'বাছাই ও গ্রেডিং', desc: 'রোগাক্রান্ত ও ক্ষতিগ্রস্ত আলু আলাদা করুন। আকার অনুযায়ী গ্রেড করুন।', image: 'grading', type: 'post-harvest' },
          { title: 'সংরক্ষণ', desc: 'ঠান্ডা, অন্ধকার ও বায়ুচলাচলযোগ্য জায়গায় রাখুন। কোল্ড স্টোরেজে রাখলে ৬-৮ মাস রাখা যায়।', image: 'storage', type: 'post-harvest' },
          { title: 'বাজারজাতকরণ', desc: 'দামের ওঠানামা দেখে বিক্রির সময় ঠিক করুন। কৃষিবন্ধু বাজার দর দেখুন।', image: 'marketing', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // পেঁয়াজ — BARI সুপারিশ
  // ══════════════════════════════
  'পেঁয়াজ': {
    icon: '🧅',
    season: 'রবি (নভেম্বর-এপ্রিল)',
    totalDays: 130,
    yield: '৪০-৬০ মণ/বিঘা',
    varieties: ['বারি পেঁয়াজ-১', 'বারি পেঁয়াজ-২', 'বারি পেঁয়াজ-৪', 'তাহেরপুরী', 'ফরিদপুরী ভাতি'],
    soil: 'উর্বর বেলে দো-আঁশ মাটি, pH ৬.০-৭.০',
    stages: [
      {
        id: 'seedbed-onion', name: 'বীজতলা', icon: '🌱', dayRange: '০ - ৪৫ দিন', startDay: 0, endDay: 45,
        tasks: [
          { title: 'বীজতলা তৈরি', desc: 'উঁচু, পানি নিষ্কাশনযোগ্য জমিতে ৩×১ মিটার বেড করুন। পচা গোবর ও বালু মিশিয়ে মাটি ঝুরঝুরে করুন। অক্টোবর মাসে বীজ বপন করুন।', image: 'seedbed', type: 'preparation' },
          { title: 'বীজ শোধন ও বপন', desc: 'প্রোভ্যাক্স বা কার্বেনডাজিম দিয়ে বীজ শোধন করুন। বিঘা প্রতি ৪০০-৫০০ গ্রাম বীজ লাগে। সারিতে ৫ সেমি দূরত্বে বপন করুন।', image: 'sowing', type: 'task' },
          { title: 'চারার যত্ন', desc: 'নিয়মিত হালকা সেচ দিন। আগাছা তুলে ফেলুন। ৪০-৪৫ দিনের চারা রোপণযোগ্য।', image: 'seedling-care', type: 'task' },
        ],
      },
      {
        id: 'transplant-onion', name: 'জমি তৈরি ও রোপণ', icon: '🚜', dayRange: '৪৫ - ৬০ দিন', startDay: 45, endDay: 60,
        tasks: [
          { title: 'জমি তৈরি', desc: '৪-৫টি চাষ দিয়ে ঝুরঝুরে করুন। শেষ চাষে গোবর, TSP, MOP, Gypsum মেশান। ১২০ সেমি চওড়া বেড করুন।', image: 'land-prep', type: 'preparation' },
          { title: 'চারা রোপণ', desc: 'সারি থেকে সারি ১৫ সেমি, চারা থেকে চারা ১০ সেমি দূরত্বে রোপণ করুন। বিকেলে রোপণ করে সেচ দিন।', image: 'transplanting', type: 'task' },
          { title: 'প্রথম সেচ', desc: 'রোপণের পরপর সেচ দিন। ৩-৪ দিন পর আবার সেচ দিন।', image: 'irrigation', type: 'irrigation' },
        ],
      },
      {
        id: 'vegetative-onion', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '৬০ - ৯০ দিন', startDay: 60, endDay: 90,
        tasks: [
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'রোপণের ২০-২৫ দিন পর ইউরিয়া উপরিপ্রয়োগ করুন। মাটির সাথে মিশিয়ে সেচ দিন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন', desc: '১৫-২০ দিন পরপর নিড়ানি দিন। পেঁয়াজে আগাছা দ্রুত বাড়ে — পরিষ্কার রাখুন।', image: 'weeding', type: 'task' },
          { title: 'থ্রিপস পোকা দমন', desc: 'পাতা সাদাটে দেখলে ইমিডাক্লোপ্রিড বা স্পাইনোস্যাড স্প্রে করুন। ৭-১০ দিন পরপর।', image: 'sucking-pest', type: 'pest' },
          { title: 'পার্পল ব্লচ রোগ দমন', desc: 'পাতায় বেগুনি দাগ দেখলে ম্যানকোজেব বা কার্বেনডাজিম স্প্রে করুন।', image: 'purple-blotch', type: 'disease' },
        ],
      },
      {
        id: 'bulb-dev', name: 'কন্দ গঠনের পর্যায়', icon: '🧅', dayRange: '৯০ - ১২০ দিন', startDay: 90, endDay: 120,
        tasks: [
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'রোপণের ৪৫ দিন পর ২য় কিস্তি ইউরিয়া ও MOP দিন। কন্দ গঠনের সময় গুরুত্বপূর্ণ।', image: 'urea-2', type: 'fertilizer' },
          { title: 'সেচ নিয়ন্ত্রণ', desc: '৭-১০ দিন পরপর সেচ দিন। কন্দ পরিপক্ক হওয়ার ১৫ দিন আগে সেচ বন্ধ করুন।', image: 'irrigation', type: 'irrigation' },
          { title: 'স্টেমফাইলিয়াম ব্লাইট দমন', desc: 'পাতায় কালচে দাগ দেখলে ম্যানকোজেব + কার্বেনডাজিম দিন।', image: 'leaf-blight', type: 'disease' },
        ],
      },
      {
        id: 'harvest-onion', name: 'পেঁয়াজ তোলা', icon: '🧺', dayRange: '১২০ - ১৩০ দিন', startDay: 120, endDay: 130,
        tasks: [
          { title: 'পেঁয়াজ তোলা', desc: '৭০-৮০% গাছের পাতা শুকিয়ে পড়লে তুলুন। সকালে তুলুন। জমিতে ২-৩ দিন রোদে শুকান।', image: 'harvesting', type: 'harvest' },
          { title: 'কিউরিং ও সংরক্ষণ', desc: 'ছায়ায় ১০-১৫ দিন কিউরিং করুন। শুকনো ও বায়ুচলাচলযোগ্য জায়গায় ঝুলিয়ে রাখুন। ৪-৬ মাস ভালো থাকবে।', image: 'storage', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // রসুন — BARI সুপারিশ
  // ══════════════════════════════
  'রসুন': {
    icon: '🧄',
    season: 'রবি (অক্টোবর-মার্চ)',
    totalDays: 140,
    yield: '৩৫-৫০ মণ/বিঘা',
    varieties: ['বারি রসুন-১', 'বারি রসুন-২', 'বারি রসুন-৩', 'বারি রসুন-৪'],
    soil: 'বেলে দো-আঁশ বা দো-আঁশ মাটি, pH ৬.০-৭.৫',
    stages: [
      {
        id: 'land-prep-garlic', name: 'জমি তৈরি ও বপন', icon: '🚜', dayRange: '০ - ২০ দিন', startDay: 0, endDay: 20,
        tasks: [
          { title: 'জমি তৈরি', desc: '৪-৫টি চাষ দিয়ে মাটি ঝুরঝুরে করুন। শেষ চাষে গোবর, TSP, MOP, Gypsum মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'কোয়া নির্বাচন', desc: 'বড়, পুষ্ট ও রোগমুক্ত কোয়া বেছে নিন। বিঘা প্রতি ২০-২৫ কেজি কোয়া লাগবে।', image: 'seed-selection', type: 'preparation' },
          { title: 'কোয়া বপন', desc: 'অক্টোবর-নভেম্বর মাসে বপন করুন। সারি থেকে সারি ১৫ সেমি, কোয়া থেকে কোয়া ১০ সেমি দূরত্বে ৩-৪ সেমি গভীরে বপন করুন। চোখ উপরের দিকে রাখুন।', image: 'planting', type: 'task' },
        ],
      },
      {
        id: 'vegetative-garlic', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '২০ - ৮০ দিন', startDay: 20, endDay: 80,
        tasks: [
          { title: 'প্রথম সেচ', desc: 'বপনের ১০-১৫ দিন পর সেচ দিন। ১৫-২০ দিন পরপর সেচ অব্যাহত রাখুন।', image: 'irrigation', type: 'irrigation' },
          { title: 'আগাছা দমন', desc: '২০-২৫ দিন পরপর নিড়ানি দিন। ৩-৪ বার নিড়ানি দরকার।', image: 'weeding', type: 'task' },
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'বপনের ২৫-৩০ দিন পর ইউরিয়া উপরিপ্রয়োগ করুন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'থ্রিপস পোকা দমন', desc: 'পাতা সাদাটে দেখলে ইমিডাক্লোপ্রিড স্প্রে করুন।', image: 'sucking-pest', type: 'pest' },
          { title: 'পার্পল ব্লচ রোগ দমন', desc: 'পাতায় বেগুনি দাগ দেখলে ম্যানকোজেব দিন।', image: 'purple-blotch', type: 'disease' },
        ],
      },
      {
        id: 'bulb-garlic', name: 'কন্দ গঠনের পর্যায়', icon: '🧄', dayRange: '৮০ - ১২০ দিন', startDay: 80, endDay: 120,
        tasks: [
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'বপনের ৫০-৫৫ দিন পর ২য় কিস্তি ইউরিয়া ও MOP দিন।', image: 'urea-2', type: 'fertilizer' },
          { title: 'সেচ নিয়ন্ত্রণ', desc: 'কন্দ গঠনের সময় পর্যাপ্ত সেচ দিন। তোলার ১৫ দিন আগে সেচ বন্ধ করুন।', image: 'irrigation', type: 'irrigation' },
        ],
      },
      {
        id: 'harvest-garlic', name: 'রসুন তোলা ও সংরক্ষণ', icon: '🧺', dayRange: '১২০ - ১৪০ দিন', startDay: 120, endDay: 140,
        tasks: [
          { title: 'রসুন তোলা', desc: 'পাতা হলুদ হয়ে শুকাতে শুরু করলে তুলুন। সকালে তুলুন। ২-৩ দিন রোদে শুকান।', image: 'harvesting', type: 'harvest' },
          { title: 'কিউরিং ও সংরক্ষণ', desc: 'পাতাসহ ১০-১৫ দিন ছায়ায় কিউরিং করুন। ঝুলিয়ে শুকনো জায়গায় রাখুন। ৫-৬ মাস ভালো থাকবে।', image: 'storage', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // বেগুন — BARI সুপারিশ
  // ══════════════════════════════
  'বেগুন': {
    icon: '🍆',
    season: 'বারো মাস (প্রধান: রবি ও খরিফ)',
    totalDays: 160,
    yield: '১০০-১৫০ মণ/বিঘা',
    varieties: ['বারি বেগুন-১', 'বারি বেগুন-৫', 'বারি বেগুন-৬', 'বারি বেগুন-৮ (Bt)', 'ইসলামপুরী'],
    soil: 'উর্বর দো-আঁশ মাটি, pH ৫.৫-৬.৮',
    stages: [
      {
        id: 'seedbed-brinjal', name: 'বীজতলা', icon: '🌱', dayRange: '০ - ৪০ দিন', startDay: 0, endDay: 40,
        tasks: [
          { title: 'বীজতলা তৈরি', desc: '৩×১ মিটার বেড করুন। পচা গোবর ও বালু মিশিয়ে মাটি প্রস্তুত করুন। পলিথিন দিয়ে মাটি শোধন করুন।', image: 'seedbed', type: 'preparation' },
          { title: 'বীজ শোধন ও বপন', desc: 'কার্বেনডাজিম দিয়ে বীজ শোধন করে সারিতে ৫ সেমি দূরত্বে বপন করুন। বিঘা প্রতি ৬০-৮০ গ্রাম বীজ লাগে।', image: 'sowing', type: 'task' },
          { title: 'চারার যত্ন', desc: 'নিয়মিত সেচ দিন। ড্যাম্পিং অফ রোগ দেখলে কার্বেনডাজিম স্প্রে করুন।', image: 'seedling-care', type: 'task' },
        ],
      },
      {
        id: 'transplant-brinjal', name: 'জমি তৈরি ও রোপণ', icon: '🚜', dayRange: '৪০ - ৫৫ দিন', startDay: 40, endDay: 55,
        tasks: [
          { title: 'জমি তৈরি', desc: '৪-৫টি চাষ দিয়ে মাটি ঝুরঝুরে করুন। শেষ চাষে গোবর, TSP, MOP, Gypsum, Zinc মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'চারা রোপণ', desc: '৩৫-৪০ দিনের সুস্থ চারা রোপণ করুন। সারি থেকে সারি ৭৫ সেমি, চারা থেকে চারা ৬০ সেমি। বিকেলে রোপণ করে সেচ দিন।', image: 'transplanting', type: 'task' },
        ],
      },
      {
        id: 'vegetative-brinjal', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '৫৫ - ৯০ দিন', startDay: 55, endDay: 90,
        tasks: [
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'রোপণের ১৫-২০ দিন পর ইউরিয়া ও MOP রিং পদ্ধতিতে দিন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন ও মাটি আলগা করা', desc: '২০-২৫ দিন পরপর নিড়ানি দিন এবং গাছের গোড়ায় মাটি তুলে দিন।', image: 'weeding', type: 'task' },
          { title: 'জল ব্যবস্থাপনা', desc: '৭-১০ দিন পরপর সেচ দিন। বৃষ্টির পানি দ্রুত সরিয়ে দিন।', image: 'irrigation', type: 'irrigation' },
          { title: 'ডগা ও ফল ছিদ্রকারী পোকা দমন', desc: 'আক্রান্ত ডগা ও ফল কেটে ধ্বংস করুন। Bt বেগুন চাষ করুন বা ফেরোমন ফাঁদ ব্যবহার করুন। দরকারে ইমামেকটিন বেনজোয়েট স্প্রে করুন।', image: 'fruit-borer', type: 'pest' },
        ],
      },
      {
        id: 'flowering-brinjal', name: 'ফুল ও ফল আসার সময়', icon: '🌸', dayRange: '৯০ - ১২০ দিন', startDay: 90, endDay: 120,
        tasks: [
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'রোপণের ৪০-৪৫ দিন পর ২য় কিস্তি ইউরিয়া ও MOP দিন।', image: 'urea-2', type: 'fertilizer' },
          { title: 'জাব পোকা ও সাদা মাছি দমন', desc: 'ইমিডাক্লোপ্রিড বা নিম তেল স্প্রে করুন।', image: 'sucking-pest', type: 'pest' },
          { title: 'ফোমোপসিস ব্লাইট দমন', desc: 'ফলে গোলাকার বাদামি দাগ দেখলে ম্যানকোজেব স্প্রে করুন।', image: 'phomopsis', type: 'disease' },
          { title: 'ব্যাকটেরিয়াল উইল্ট দমন', desc: 'আক্রান্ত গাছ তুলে পুড়িয়ে ফেলুন। জমিতে কপার অক্সিক্লোরাইড দিন। প্রতিরোধী জাত চাষ করুন।', image: 'bacterial-wilt', type: 'disease' },
        ],
      },
      {
        id: 'harvest-brinjal', name: 'ফল সংগ্রহ', icon: '🧺', dayRange: '১২০ - ১৬০ দিন', startDay: 120, endDay: 160,
        tasks: [
          { title: 'ফসল সংগ্রহ', desc: 'কচি ও চকচকে ফল ৪-৫ দিন পরপর সংগ্রহ করুন। সকালে কাটুন। ফল শক্ত হলে স্বাদ কমে।', image: 'harvesting', type: 'harvest' },
          { title: 'বাজারজাতকরণ', desc: 'আকার অনুযায়ী গ্রেড করে কার্টন বা ঝুড়িতে প্যাক করুন। দ্রুত বাজারে পাঠান।', image: 'marketing', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // মরিচ — BARI সুপারিশ
  // ══════════════════════════════
  'মরিচ': {
    icon: '🌶️',
    season: 'রবি ও খরিফ',
    totalDays: 180,
    yield: 'শুকনা: ৮-১২ মণ/বিঘা, কাঁচা: ৪০-৬০ মণ/বিঘা',
    varieties: ['বারি মরিচ-১', 'বারি মরিচ-২', 'বারি মরিচ-৩', 'বগুড়ার মরিচ', 'হাইব্রিড: বিজলী, অগ্নি'],
    soil: 'উর্বর দো-আঁশ মাটি, pH ৬.০-৭.০',
    stages: [
      {
        id: 'seedbed-chili', name: 'বীজতলা', icon: '🌱', dayRange: '০ - ৪০ দিন', startDay: 0, endDay: 40,
        tasks: [
          { title: 'বীজতলা তৈরি', desc: 'উঁচু জমিতে ৩×১ মিটার বেড করুন। গোবর ও বালু মিশিয়ে প্রস্তুত করুন।', image: 'seedbed', type: 'preparation' },
          { title: 'বীজ শোধন ও বপন', desc: 'প্রোভ্যাক্স বা কার্বেনডাজিম দিয়ে বীজ শোধন করুন। সারিতে ৫ সেমি দূরত্বে বপন করুন।', image: 'sowing', type: 'task' },
          { title: 'চারার যত্ন', desc: 'হালকা সেচ দিন। ড্যাম্পিং অফ দেখলে ছত্রাকনাশক দিন।', image: 'seedling-care', type: 'task' },
        ],
      },
      {
        id: 'transplant-chili', name: 'জমি তৈরি ও রোপণ', icon: '🚜', dayRange: '৪০ - ৫৫ দিন', startDay: 40, endDay: 55,
        tasks: [
          { title: 'জমি তৈরি', desc: '৪-৫টি চাষ দিয়ে মাটি ঝুরঝুরে করুন। গোবর, TSP, MOP, Gypsum মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'চারা রোপণ', desc: '৩৫-৪০ দিনের চারা রোপণ করুন। সারি থেকে সারি ৬০ সেমি, চারা থেকে চারা ৪৫ সেমি। বিকেলে রোপণ করুন।', image: 'transplanting', type: 'task' },
        ],
      },
      {
        id: 'vegetative-chili', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '৫৫ - ৯০ দিন', startDay: 55, endDay: 90,
        tasks: [
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'রোপণের ২০-২৫ দিন পর ইউরিয়া ও MOP দিন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন', desc: '২০ দিন পরপর নিড়ানি দিন।', image: 'weeding', type: 'task' },
          { title: 'সেচ ব্যবস্থাপনা', desc: '৭-১০ দিন পরপর সেচ দিন। পানি জমতে দেবেন না।', image: 'irrigation', type: 'irrigation' },
          { title: 'থ্রিপস ও সাদা মাছি দমন', desc: 'পাতা কুঁকড়ে গেলে ইমিডাক্লোপ্রিড বা স্পাইনোস্যাড স্প্রে করুন।', image: 'sucking-pest', type: 'pest' },
        ],
      },
      {
        id: 'flowering-chili', name: 'ফুল ও ফল আসার সময়', icon: '🌸', dayRange: '৯০ - ১৩০ দিন', startDay: 90, endDay: 130,
        tasks: [
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'রোপণের ৪৫ দিন পর ২য় কিস্তি ইউরিয়া দিন।', image: 'urea-2', type: 'fertilizer' },
          { title: 'অ্যানথ্রাকনোজ রোগ দমন', desc: 'ফলে কালো গোলাকার দাগ দেখলে কার্বেনডাজিম বা প্রোপিকোনাজোল স্প্রে করুন।', image: 'anthracnose', type: 'disease' },
          { title: 'লিফ কার্ল ভাইরাস দমন', desc: 'পাতা কুঁকড়ে গেলে আক্রান্ত গাছ তুলে ফেলুন। বাহক সাদা মাছি দমন করুন।', image: 'leaf-curl', type: 'disease' },
          { title: 'ফল ছিদ্রকারী পোকা দমন', desc: 'আক্রান্ত ফল সংগ্রহ করে ধ্বংস করুন। ফেরোমন ফাঁদ ব্যবহার করুন। দরকারে ইমামেকটিন বেনজোয়েট দিন।', image: 'fruit-borer', type: 'pest' },
        ],
      },
      {
        id: 'harvest-chili', name: 'ফল সংগ্রহ', icon: '🧺', dayRange: '১৩০ - ১৮০ দিন', startDay: 130, endDay: 180,
        tasks: [
          { title: 'কাঁচা মরিচ সংগ্রহ', desc: 'কচি ও সবুজ মরিচ ৭-১০ দিন পরপর সংগ্রহ করুন। সকালে তুলুন।', image: 'harvesting', type: 'harvest' },
          { title: 'পাকা মরিচ সংগ্রহ ও শুকানো', desc: 'লাল পাকা মরিচ একসাথে তুলে রোদে ৪-৫ দিন শুকান। আর্দ্রতা ১০% এর নিচে আনুন।', image: 'drying', type: 'post-harvest' },
          { title: 'বাজারজাতকরণ', desc: 'বাছাই করে বস্তায় ভরে শুকনো জায়গায় রাখুন। দাম বুঝে বিক্রি করুন।', image: 'marketing', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // গম — BARI সুপারিশ
  // ══════════════════════════════
  'গম': {
    icon: '🌾',
    season: 'রবি (নভেম্বর-মার্চ)',
    totalDays: 110,
    yield: '১২-১৬ মণ/বিঘা',
    varieties: ['বারি গম-২৬', 'বারি গম-২৮', 'বারি গম-৩০', 'বারি গম-৩৩', 'বারি গম-৩২ (ব্লাস্ট প্রতিরোধী)'],
    soil: 'দো-আঁশ থেকে এঁটেল দো-আঁশ মাটি, pH ৬.০-৭.৫',
    stages: [
      {
        id: 'land-prep-wheat', name: 'জমি তৈরি ও বপন', icon: '🚜', dayRange: '০ - ১৫ দিন', startDay: 0, endDay: 15,
        tasks: [
          { title: 'জমি তৈরি', desc: '৩-৪টি চাষ ও মই দিয়ে মাটি ঝুরঝুরে করুন। শেষ চাষে গোবর, TSP, MOP, Gypsum, Zinc মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'বীজ শোধন', desc: 'প্রোভ্যাক্স বা ভিটাভেক্স দিয়ে বীজ শোধন করুন। এতে লুজ স্মাট রোগ প্রতিরোধ হয়।', image: 'seed-treatment', type: 'preparation' },
          { title: 'বীজ বপন', desc: 'নভেম্বরের ১৫ থেকে ৩০ তারিখের মধ্যে বপন করুন। বিঘা প্রতি ১৬-১৮ কেজি বীজ। সারিতে ২০ সেমি দূরত্বে ৫ সেমি গভীরে বপন করুন।', image: 'sowing', type: 'task' },
        ],
      },
      {
        id: 'vegetative-wheat', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '১৫ - ৬০ দিন', startDay: 15, endDay: 60,
        tasks: [
          { title: 'প্রথম সেচ (CRI)', desc: 'বপনের ১৭-২১ দিনের মধ্যে প্রথম সেচ (Crown Root Initiation) দিন। এটি সবচেয়ে গুরুত্বপূর্ণ সেচ।', image: 'irrigation', type: 'irrigation' },
          { title: 'ইউরিয়া উপরিপ্রয়োগ', desc: 'প্রথম সেচের পর জো অবস্থায় ইউরিয়া উপরিপ্রয়োগ করুন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন', desc: 'হাত দিয়ে আগাছা তুলুন। চওড়া পাতার আগাছা থাকলে 2,4-D স্প্রে করুন।', image: 'weeding', type: 'task' },
          { title: 'ইঁদুর দমন', desc: 'গর্তে জিংক ফসফাইড বা ব্রোমাডায়োলোন বিষটোপ ব্যবহার করুন।', image: 'rodent', type: 'pest' },
        ],
      },
      {
        id: 'booting-wheat', name: 'থোড় আসার সময়', icon: '🌾', dayRange: '৬০ - ৮৫ দিন', startDay: 60, endDay: 85,
        tasks: [
          { title: 'দ্বিতীয় সেচ', desc: 'বপনের ৫৫-৬০ দিনের মধ্যে থোড় আসার সময় সেচ দিন।', image: 'irrigation', type: 'irrigation' },
          { title: 'গম ব্লাস্ট রোগ দমন', desc: 'শীষে সাদা/বাদামি দাগ দেখলে নাটিভো বা ফিলিয়া স্প্রে করুন। প্রতিরোধী জাত (বারি গম-৩২) চাষ করুন। বাংলাদেশে গমের সবচেয়ে ভয়ংকর রোগ।', image: 'wheat-blast', type: 'disease' },
          { title: 'মরিচা রোগ দমন', desc: 'পাতায় হলুদ/বাদামি গুঁড়া দেখলে প্রোপিকোনাজোল স্প্রে করুন।', image: 'rust', type: 'disease' },
        ],
      },
      {
        id: 'grain-fill-wheat', name: 'দানা ভরাট পর্যায়', icon: '🌟', dayRange: '৮৫ - ১০০ দিন', startDay: 85, endDay: 100,
        tasks: [
          { title: 'তৃতীয় সেচ', desc: 'দানা ভরাটের সময় হালকা সেচ দিন। এ সময় পানির অভাবে দানা চিটা হয়।', image: 'irrigation', type: 'irrigation' },
          { title: 'এফিড পোকা দমন', desc: 'শীষে জাব পোকা দেখলে ম্যালাথিয়ন বা ইমিডাক্লোপ্রিড স্প্রে করুন।', image: 'aphid', type: 'pest' },
        ],
      },
      {
        id: 'harvest-wheat', name: 'গম কাটা', icon: '🧺', dayRange: '১০০ - ১১০ দিন', startDay: 100, endDay: 110,
        tasks: [
          { title: 'গম কাটা', desc: 'দানা শক্ত হয়ে সোনালি হলে কাটুন। কম্বাইন হার্ভেস্টার বা কাস্তে দিয়ে কাটুন।', image: 'harvesting', type: 'harvest' },
          { title: 'মাড়াই ও শুকানো', desc: 'মাড়াইয়ের পর রোদে শুকান। আর্দ্রতা ১২% এর নিচে নামান। শুকনো বস্তায় ভরে গোলায় রাখুন।', image: 'threshing', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // ভুট্টা — BARI সুপারিশ
  // ══════════════════════════════
  'ভুট্টা': {
    icon: '🌽',
    season: 'রবি (নভেম্বর-এপ্রিল) ও খরিফ',
    totalDays: 130,
    yield: '৩৫-৫০ মণ/বিঘা',
    varieties: ['বারি ভুট্টা-৭', 'বারি ভুট্টা-৯', 'হাইব্রিড: পাইওনিয়ার, সুপার-৯০০M, NK-৪০'],
    soil: 'উর্বর দো-আঁশ মাটি, pH ৬.০-৭.৫',
    stages: [
      {
        id: 'land-prep-maize', name: 'জমি তৈরি ও বপন', icon: '🚜', dayRange: '০ - ১৫ দিন', startDay: 0, endDay: 15,
        tasks: [
          { title: 'জমি তৈরি', desc: '৩-৪টি চাষ দিয়ে মাটি ঝুরঝুরে করুন। শেষ চাষে গোবর, TSP, MOP, Gypsum, Zinc, Boron মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'বীজ শোধন', desc: 'প্রোভ্যাক্স বা ক্যাপ্টান দিয়ে বীজ শোধন করুন।', image: 'seed-treatment', type: 'preparation' },
          { title: 'বীজ বপন', desc: 'নভেম্বরের ১৫ থেকে ডিসেম্বর শেষে বপন করুন। সারি থেকে সারি ৬০-৭৫ সেমি, বীজ থেকে বীজ ২০-২৫ সেমি দূরত্বে ৪-৫ সেমি গভীরে বপন করুন। বিঘা প্রতি ৩-৪ কেজি বীজ লাগে।', image: 'sowing', type: 'task' },
        ],
      },
      {
        id: 'vegetative-maize', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '১৫ - ৫০ দিন', startDay: 15, endDay: 50,
        tasks: [
          { title: 'প্রথম সেচ', desc: 'বপনের ২০-২৫ দিন পর প্রথম সেচ দিন।', image: 'irrigation', type: 'irrigation' },
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'গাছ ৩০ সেমি লম্বা হলে ইউরিয়া উপরিপ্রয়োগ করুন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন ও মাটি তোলা', desc: '২৫-৩০ দিন পর নিড়ানি দিয়ে গাছের গোড়ায় মাটি তুলে দিন।', image: 'weeding', type: 'task' },
          { title: 'ফল আর্মিওয়ার্ম দমন', desc: 'পাতায় ছিদ্র ও মলমূত্র দেখলে ইমামেকটিন বেনজোয়েট বা স্পাইনোস্যাড স্প্রে করুন। কেন্দ্রীয় পাতার গোড়ায় বালু মেশানো ছাই দিন।', image: 'fall-armyworm', type: 'pest' },
        ],
      },
      {
        id: 'tasseling-maize', name: 'মঞ্জরী আসার সময়', icon: '🌾', dayRange: '৫০ - ৮৫ দিন', startDay: 50, endDay: 85,
        tasks: [
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'মঞ্জরী আসার আগে (৪৫-৫০ দিনে) ২য় কিস্তি ইউরিয়া দিন। সবচেয়ে গুরুত্বপূর্ণ কিস্তি।', image: 'urea-2', type: 'fertilizer' },
          { title: 'সেচ অত্যাবশ্যক', desc: 'মঞ্জরী ও সিল্ক আসার সময় অবশ্যই পানি রাখুন। পানির অভাবে দানা চিটা হয়।', image: 'irrigation', type: 'irrigation' },
          { title: 'নর্দার্ন লিফ ব্লাইট দমন', desc: 'পাতায় লম্বা ধূসর দাগ দেখলে ম্যানকোজেব বা প্রোপিকোনাজোল স্প্রে করুন।', image: 'leaf-blight', type: 'disease' },
        ],
      },
      {
        id: 'grain-fill-maize', name: 'দানা ভরাট পর্যায়', icon: '🌟', dayRange: '৮৫ - ১২০ দিন', startDay: 85, endDay: 120,
        tasks: [
          { title: 'সেচ অব্যাহত রাখুন', desc: 'দানা ভরাটের সময় ১০-১৫ দিন পরপর সেচ দিন।', image: 'irrigation', type: 'irrigation' },
          { title: 'কব ছিদ্রকারী পোকা দমন', desc: 'মোচায় ছিদ্র দেখলে ক্লোরপাইরিফস বা ইমামেকটিন বেনজোয়েট দিন।', image: 'cob-borer', type: 'pest' },
        ],
      },
      {
        id: 'harvest-maize', name: 'মোচা সংগ্রহ', icon: '🧺', dayRange: '১২০ - ১৩০ দিন', startDay: 120, endDay: 130,
        tasks: [
          { title: 'মোচা সংগ্রহ', desc: 'বাইরের পাতা শুকিয়ে বাদামি হলে এবং দানা শক্ত হলে মোচা সংগ্রহ করুন।', image: 'harvesting', type: 'harvest' },
          { title: 'শুকানো ও সংরক্ষণ', desc: 'মোচা রোদে ভালো করে শুকান। দানা ছাড়িয়ে আর্দ্রতা ১৩% এর নিচে নামিয়ে শুকনো বস্তায় রাখুন।', image: 'storage', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // আমন ধান — BRRI সুপারিশ
  // ══════════════════════════════
  'আমন ধান': {
    icon: '🌾',
    season: 'আমন (জুন-ডিসেম্বর)',
    totalDays: 145,
    yield: '২৫-৩৫ মণ/বিঘা',
    varieties: ['BRRI dhan49', 'BRRI dhan51 (জলমগ্ন সহিষ্ণু)', 'BRRI dhan52', 'BRRI dhan75', 'BRRI dhan87', 'বিনা ধান-১৭'],
    soil: 'যেকোনো মাটি, বৃষ্টিনির্ভর',
    stages: [
      {
        id: 'seedbed-aman', name: 'বীজতলা', icon: '🌱', dayRange: '০ - ৩০ দিন', startDay: 0, endDay: 30,
        tasks: [
          { title: 'বীজ নির্বাচন ও শোধন', desc: 'পুষ্ট বীজ পানিতে ডুবিয়ে ভাসা বীজ ফেলুন। প্রোভ্যাক্স দিয়ে বীজ শোধন করুন।', image: 'seed-selection', type: 'preparation' },
          { title: 'বীজতলা প্রস্তুত', desc: 'আষাঢ় মাসে (জুন-জুলাই) বীজতলা করুন। বিঘা প্রতি ১ কাঠা বীজতলা যথেষ্ট।', image: 'seedbed-prep', type: 'preparation' },
          { title: 'চারার যত্ন', desc: 'নিয়মিত পানি দিন। থ্রিপস দেখলে মেলাথিয়ন দিন।', image: 'seedling-care', type: 'task' },
        ],
      },
      {
        id: 'transplant-aman', name: 'চারা রোপণ', icon: '🚜', dayRange: '৩০ - ৪৫ দিন', startDay: 30, endDay: 45,
        tasks: [
          { title: 'জমি তৈরি', desc: 'বর্ষার পানিতে ৩-৪টি চাষ দিয়ে কাদাময় করুন। শেষ চাষে TSP, MOP, Gypsum, Zinc মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'চারা রোপণ', desc: '২৫-৩০ দিনের চারা শ্রাবণ-ভাদ্র মাসে রোপণ করুন। সারিতে ২৫×১৫ সেমি দূরত্বে। গুছিতে ৩-৪টি চারা।', image: 'transplanting', type: 'task' },
        ],
      },
      {
        id: 'vegetative-aman', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '৪৫ - ৮৫ দিন', startDay: 45, endDay: 85,
        tasks: [
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'রোপণের ১০-১৫ দিন পর ইউরিয়া দিন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন', desc: 'রোপণের ১৫-২০ দিন পর নিড়ানি দিন।', image: 'weeding', type: 'task' },
          { title: 'বৃষ্টির পানি ব্যবস্থাপনা', desc: 'অতিরিক্ত পানি বের করুন। ৫-১০ সেমি পানি রাখুন।', image: 'irrigation', type: 'irrigation' },
          { title: 'মাজরা পোকা ও পাতা মোড়ানো পোকা দমন', desc: 'কার্টাপ বা ক্লোরপাইরিফস দিন। আলোক ফাঁদ ব্যবহার করুন।', image: 'stem-borer', type: 'pest' },
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'রোপণের ৩০ দিন পর ২য় কিস্তি দিন।', image: 'urea-2', type: 'fertilizer' },
        ],
      },
      {
        id: 'panicle-aman', name: 'থোড় আসার সময়', icon: '🌾', dayRange: '৮৫ - ১১৫ দিন', startDay: 85, endDay: 115,
        tasks: [
          { title: 'ইউরিয়া ৩য় কিস্তি', desc: 'থোড় আসার ৭-১০ দিন আগে ৩য় কিস্তি দিন।', image: 'urea-3', type: 'fertilizer' },
          { title: 'ব্লাস্ট ও শিথ ব্লাইট দমন', desc: 'ব্লাস্টে ট্রাইসাইক্লাজোল এবং শিথ ব্লাইটে প্রোপিকোনাজোল স্প্রে করুন।', image: 'blast', type: 'disease' },
          { title: 'বাদামি গাছফড়িং দমন', desc: 'গাছের গোড়া দেখুন। আক্রান্ত হলে কার্বোসালফান দিন।', image: 'bph', type: 'pest' },
        ],
      },
      {
        id: 'ripening-aman', name: 'ধান পাকার পর্যায়', icon: '🌟', dayRange: '১১৫ - ১৪০ দিন', startDay: 115, endDay: 140,
        tasks: [
          { title: 'পানি ব্যবস্থাপনা', desc: 'পাকার ১০-১৫ দিন আগে পানি বের করুন।', image: 'drainage', type: 'irrigation' },
          { title: 'পাখি ও ইঁদুর দমন', desc: 'পাখি তাড়াতে কাকতাড়ুয়া দিন। ইঁদুরের গর্তে বিষটোপ দিন।', image: 'rodent', type: 'pest' },
        ],
      },
      {
        id: 'harvest-aman', name: 'ধান কাটা', icon: '🌾', dayRange: '১৪০ - ১৪৫ দিন', startDay: 140, endDay: 145,
        tasks: [
          { title: 'ধান কাটা', desc: '৮০% ধান সোনালি হলে কাটুন। অগ্রহায়ণ মাসে কাটা হয়।', image: 'harvesting', type: 'harvest' },
          { title: 'মাড়াই ও শুকানো', desc: 'কাটার পর মাড়াই করে রোদে শুকান। আর্দ্রতা ১৪% এর নিচে নামান।', image: 'threshing', type: 'post-harvest' },
        ],
      },
    ],
  },

  // ══════════════════════════════
  // আউশ ধান — BRRI সুপারিশ
  // ══════════════════════════════
  'আউশ ধান': {
    icon: '🌾',
    season: 'আউশ (মার্চ-জুলাই)',
    totalDays: 110,
    yield: '২০-৩০ মণ/বিঘা',
    varieties: ['BRRI dhan48', 'BRRI dhan55', 'BRRI dhan82', 'BRRI dhan85', 'বিনা ধান-১৯'],
    soil: 'যেকোনো মাটি, পূর্বমৌসুমি বৃষ্টিনির্ভর বা সেচ',
    stages: [
      {
        id: 'land-prep-aus', name: 'জমি তৈরি ও বপন/রোপণ', icon: '🚜', dayRange: '০ - ১৫ দিন', startDay: 0, endDay: 15,
        tasks: [
          { title: 'বীজ নির্বাচন ও শোধন', desc: 'পুষ্ট বীজ বাছাই করে প্রোভ্যাক্স দিয়ে শোধন করুন।', image: 'seed-selection', type: 'preparation' },
          { title: 'জমি তৈরি', desc: 'চৈত্র-বৈশাখ মাসে ৩-৪টি চাষ দিয়ে জমি প্রস্তুত করুন। শেষ চাষে TSP, MOP, Gypsum, Zinc মেশান।', image: 'land-prep', type: 'preparation' },
          { title: 'সরাসরি বপন বা চারা রোপণ', desc: 'সরাসরি বপন: বিঘা প্রতি ৪-৫ কেজি বীজ ছিটিয়ে দিন। চারা রোপণ: ২০-২৫ দিনের চারা ২০×১৫ সেমি দূরত্বে রোপণ করুন।', image: 'sowing', type: 'task' },
        ],
      },
      {
        id: 'vegetative-aus', name: 'গাছের বৃদ্ধি', icon: '🌿', dayRange: '১৫ - ৫৫ দিন', startDay: 15, endDay: 55,
        tasks: [
          { title: 'ইউরিয়া ১ম কিস্তি', desc: 'বপন/রোপণের ১৫-২০ দিন পর ইউরিয়া দিন।', image: 'urea-1', type: 'fertilizer' },
          { title: 'আগাছা দমন', desc: '২০-২৫ দিন পর নিড়ানি দিন। আউশে আগাছার চাপ বেশি।', image: 'weeding', type: 'task' },
          { title: 'সেচ ব্যবস্থাপনা', desc: 'প্রাক-বর্ষায় সেচ লাগতে পারে। ৩-৫ সেমি পানি রাখুন।', image: 'irrigation', type: 'irrigation' },
          { title: 'মাজরা পোকা দমন', desc: 'ডেড হার্ট দেখলে কার্টাপ বা ক্লোরপাইরিফস দিন।', image: 'stem-borer', type: 'pest' },
          { title: 'ইউরিয়া ২য় কিস্তি', desc: 'বপনের ৩৫-৪০ দিন পর ২য় কিস্তি দিন।', image: 'urea-2', type: 'fertilizer' },
        ],
      },
      {
        id: 'panicle-aus', name: 'থোড় আসার সময়', icon: '🌾', dayRange: '৫৫ - ৮০ দিন', startDay: 55, endDay: 80,
        tasks: [
          { title: 'ইউরিয়া ৩য় কিস্তি', desc: 'থোড় আসার ৭-১০ দিন আগে ৩য় কিস্তি দিন।', image: 'urea-3', type: 'fertilizer' },
          { title: 'ব্লাস্ট রোগ দমন', desc: 'পাতা ও থোড়ে ধূসর দাগ দেখলে ট্রাইসাইক্লাজোল স্প্রে করুন।', image: 'blast', type: 'disease' },
          { title: 'সেচ নিশ্চিত করুন', desc: 'থোড় ও ফুল আসার সময় পানি রাখুন।', image: 'irrigation', type: 'irrigation' },
        ],
      },
      {
        id: 'ripening-aus', name: 'ধান পাকার পর্যায়', icon: '🌟', dayRange: '৮০ - ১০৫ দিন', startDay: 80, endDay: 105,
        tasks: [
          { title: 'পানি বের করুন', desc: 'পাকার ১০ দিন আগে জমি থেকে পানি বের করুন।', image: 'drainage', type: 'irrigation' },
          { title: 'গাছফড়িং দমন', desc: 'গাছের গোড়া দেখুন। আক্রান্ত হলে কার্বোসালফান দিন।', image: 'bph', type: 'pest' },
        ],
      },
      {
        id: 'harvest-aus', name: 'ধান কাটা', icon: '🌾', dayRange: '১০৫ - ১১০ দিন', startDay: 105, endDay: 110,
        tasks: [
          { title: 'ধান কাটা', desc: '৮০% ধান সোনালি হলে কাটুন। শ্রাবণ-ভাদ্র মাসে কাটা হয়। বর্ষায় দ্রুত কাটুন।', image: 'harvesting', type: 'harvest' },
          { title: 'মাড়াই ও শুকানো', desc: 'বর্ষাকাল হওয়ায় দ্রুত মাড়াই ও শুকানো জরুরি। ড্রায়ার ব্যবহার করতে পারেন। আর্দ্রতা ১৪% এর নিচে নামান।', image: 'threshing', type: 'post-harvest' },
        ],
      },
    ],
  },
};

// Task type colors:
export const TASK_TYPE_CONFIG: Record<TaskType, { color: string; label: string; icon: string }> = {
  preparation:    { color: '#6366F1', label: 'প্রস্তুতি', icon: '⚙️' },
  task:           { color: '#2D6A4F', label: 'কাজ',       icon: '✅' },
  fertilizer:     { color: '#0891B2', label: 'সার',        icon: '💊' },
  irrigation:     { color: '#0284C7', label: 'সেচ',        icon: '💧' },
  disease:        { color: '#DC2626', label: 'রোগ',        icon: '🔴' },
  pest:           { color: '#D97706', label: 'পোকা',       icon: '🐛' },
  harvest:        { color: '#CA8A04', label: 'সংগ্রহ',     icon: '🌾' },
  'post-harvest': { color: '#7C3AED', label: 'বিপণন',      icon: '🏪' },
};
