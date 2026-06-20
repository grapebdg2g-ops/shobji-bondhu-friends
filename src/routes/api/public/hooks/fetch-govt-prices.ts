import { createFileRoute } from "@tanstack/react-router";

// Daily fetch of Bangladesh DAM (dam.gov.bd) market prices.
// Triggered by pg_cron at 08:00 Asia/Dhaka.
//
// DAM publishes daily price bulletins as HTML tables. The structure can
// change without notice; the parser below targets the common bulletin
// layout. Rows that fail validation are skipped rather than aborting.
//
// You can also POST { rows: [...] } directly to seed/override (useful for
// manual backfill or testing).

const DAM_BULLETIN_URLS = [
  "https://dam.portal.gov.bd/sites/default/files/files/dam.portal.gov.bd/daily_market_price/",
  "https://www.dam.gov.bd/",
];

type GovtRow = {
  product_name: string;
  district: string;
  market_name?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  price_avg: number;
  price_date: string; // YYYY-MM-DD
  source?: string;
};

function todayInDhaka(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function parseNumber(s: string | undefined | null): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^\d.\-]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// Best-effort table parser: tolerate whitespace, nested tags, malformed rows.
function parseDamHtml(html: string, priceDate: string): GovtRow[] {
  const rows: GovtRow[] = [];
  // Match each <tr>...</tr>
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();

  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html))) {
    const cells: string[] = [];
    let c: RegExpExecArray | null;
    const inner = m[1] ?? "";
    while ((c = tdRe.exec(inner))) cells.push(stripTags(c[1] ?? ""));
    if (cells.length < 3) continue;

    // Heuristic: [product, ..., price] or [product, market, min, max, avg]
    const product = cells[0]?.trim();
    if (!product || /price|পণ্য|product|item/i.test(product)) continue;

    const nums = cells.slice(1).map(parseNumber).filter((n): n is number => n !== null);
    if (nums.length === 0) continue;

    const priceMin = nums.length >= 2 ? Math.min(...nums) : null;
    const priceMax = nums.length >= 2 ? Math.max(...nums) : null;
    const priceAvg =
      nums.length >= 2
        ? Math.round(((priceMin! + priceMax!) / 2) * 100) / 100
        : nums[0]!;

    rows.push({
      product_name: product,
      district: "ঢাকা", // DAM national bulletins default to Dhaka wholesale
      market_name: cells.length > nums.length + 1 ? cells[1] ?? null : null,
      price_min: priceMin,
      price_max: priceMax,
      price_avg: priceAvg,
      price_date: priceDate,
      source: "DAM",
    });
  }
  return rows;
}

async function fetchDamRows(priceDate: string): Promise<GovtRow[]> {
  for (const url of DAM_BULLETIN_URLS) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 KrishiBondhuBot/1.0" },
      });
      if (!res.ok) continue;
      const html = await res.text();
      const rows = parseDamHtml(html, priceDate);
      if (rows.length > 0) return rows;
    } catch (e) {
      console.warn("[fetch-govt-prices] source failed:", url, e);
    }
  }
  return [];
}

export const Route = createFileRoute("/api/public/hooks/fetch-govt-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Lightweight auth: require Supabase anon/publishable apikey header
        const apikey = request.headers.get("apikey") ?? request.headers.get("x-apikey");
        const expected =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
        if (!apikey || apikey !== expected) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Optional manual override: POST { rows: [...] } to seed data
        let body: { rows?: GovtRow[] } = {};
        try {
          body = (await request.json()) as { rows?: GovtRow[] };
        } catch {
          body = {};
        }

        const priceDate = todayInDhaka();
        const rows: GovtRow[] =
          Array.isArray(body.rows) && body.rows.length > 0
            ? body.rows.map((r) => ({ ...r, source: r.source ?? "DAM" }))
            : await fetchDamRows(priceDate);

        if (rows.length === 0) {
          return new Response(
            JSON.stringify({
              ok: true,
              inserted: 0,
              skipped: true,
              reason: "no rows parsed from DAM bulletin",
            }),
            { headers: { "Content-Type": "application/json" } },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data, error } = await supabaseAdmin
          .from("govt_prices")
          .upsert(rows, {
            onConflict: "product_name,district,market_name,price_date,source",
            ignoreDuplicates: false,
          })
          .select("id");

        if (error) {
          console.error("[fetch-govt-prices] upsert failed:", error);
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(
          JSON.stringify({ ok: true, inserted: data?.length ?? 0, price_date: priceDate }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
