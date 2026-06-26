
## লক্ষ্য

আপলোডকৃত `master-crop-data.ts` (২৭টি ফসল, ২৭২১ লাইন) কে প্রজেক্টের **একমাত্র crop data source** বানানো। বর্তমানে ৪টি আলাদা ফাইলে ফসলের ডাটা ছড়িয়ে আছে — সব এক জায়গায় আনব।

## ধাপ ১ — Master data file যোগ

- `src/data/master-crop-data.ts` তৈরি (আপলোডকৃত ফাইলের পুরো কন্টেন্ট)
- Helper functions এক্সপোর্ট: `getCropById`, `getCropsBySeason(month)`, `getCropsByCategory`, `getActiveStage(cropId, daysSincePlanting)`, `getFertilizerSchedule(cropId, soilType)`, `getCalendarEvents(cropId)`, `calcTotalCost`, `calcProfit`, `calcROI`

## ধাপ ২ — Feature wiring (৮টি page)

| ফিচার | Route | পরিবর্তন |
|---|---|---|
| Crop Planner | `/crop-planner` (নতুন) | নতুন route, master data থেকে season/soil filter |
| Crop Guide | `/crop-guide`, `/crop-guide/new/$crop`, `/crop-guide/plan/$planId` | `FARMING_STAGES` → `master-crop-data` |
| Fertilizer Calculator | `/ai-bondhu/calculator` | `getFertilizerSchedule()` ব্যবহার, soil adjustment সহ |
| Calendar | `/ai-bondhu/calendar` | `getCalendarEvents()` থেকে মাস ভিত্তিক ইভেন্ট |
| Price Prediction | `/price-prediction` | `avgMarketPrice` + `yieldMin/Max` লিঙ্ক |
| Vegetable Guide | `/vegetable-guide/$slug` | `vegetable-economics.ts` → master data |
| Dashboard Widget | `/dashboard` | আজকের active stage tasks |
| Notifications | বিদ্যমান সিস্টেম | active plan-এর urgent task থেকে notify |

## ধাপ ৩ — পুরাতন ফাইল cleanup

Deprecate (delete বা re-export wrapper):
- `src/data/farming-guide.ts`
- `src/data/vegetable-economics.ts`
- `src/data/vegetable-guide.ts` (অথবা master থেকে derive)
- `src/data/fertilizer-guide.ts`

## প্রযুক্তিগত বিবরণ

- Type-safe: master file-এ ইতিমধ্যে `CropData` interface আছে
- Backward-compat shim: `farming-guide.ts` থেকে `FARMING_STAGES` কে master data থেকে generate করব যাতে existing `crop-advisory-widget.tsx` না ভাঙে
- `user_crop_plans` table-এ `crop_type` string match হবে master data-র `name` (বাংলা) এর সাথে — migration লাগবে না
- কোনো DB schema change নেই, শুধু client-side data layer

## ঝুঁকি

- ২৭২১ লাইনের ফাইল — single edit batch-এ লিখতে হবে
- ৮টি feature touch — প্রতিটিতে UI ভাঙার সম্ভাবনা; ধাপে ধাপে wire করব, প্রতি ধাপের পর typecheck

## প্রশ্ন

পুরো ৩ ধাপ একবারে করব, নাকি **ধাপ ১ (master file + helpers) + ধাপ ২-এর crop-guide wiring** আগে দিয়ে বাকিগুলো আলাদা টার্নে?
