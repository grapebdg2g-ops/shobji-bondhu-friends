import { createFileRoute } from "@tanstack/react-router";
import { isAuthorizedCronRequest } from "@/lib/cron-auth.server";

// Daily fetch of Bangladesh DAM (dam.gov.bd) market prices.
// Triggered by pg_cron at 08:00 Asia/Dhaka.
//
// DAM publishes daily price bulletins as HTML tables. The structure can
// change without notice; the parser below targets the common bulletin
// layout. Rows that fail validation are skipped rather than aborting.
//
// You can also POST { rows: [...] } directly to seed/override (useful for
// manual backfill or testing).

const DAM_REPORT_URL = "https://market.dam.gov.bd/market_daily_price_report";

type GovtRow = {
  product_name: string;
  district: string;
  market_name?: string | null;
  price_min?: number | null;
  price_max?: number | null;
  price_avg: number;
  price_date: string; // YYYY-MM-DD
  unit?: string | null;
  price_type?: "retail" | "wholesale" | "growers";
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

function normalizeDigits(s: string): string {
  return s.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
}

function parseNumbers(s: string | undefined | null): number[] {
  if (!s) return [];
  return (
    normalizeDigits(s)
      .replace(/,/g, "")
      .match(/-?\d+(?:\.\d+)?/g) ?? []
  )
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

// Best-effort table parser: tolerate whitespace, nested tags, malformed rows.
function parseDamHtml(html: string, priceDate: string): GovtRow[] {
  const rows: GovtRow[] = [];
  // Match each <tr>...</tr>
  const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRe = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const stripTags = (s: string) =>
    s
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/gi, " ")
      .trim();

  let m: RegExpExecArray | null;
  while ((m = trRe.exec(html))) {
    const cells: string[] = [];
    let c: RegExpExecArray | null;
    const inner = m[1] ?? "";
    while ((c = tdRe.exec(inner))) cells.push(stripTags(c[1] ?? ""));
    if (cells.length < 3) continue;

    // DAM's report table is usually [group, product, unit, price range].
    // Keep a fallback for older tables that start with the product column.
    const officialShape = cells.length >= 4 && parseNumbers(cells[0]).length > 0;
    const productIndex = officialShape ? 1 : 0;
    const product = cells[productIndex]?.trim();
    if (
      !product ||
      /^[০-৯\d\s.,-]+$/.test(product) ||
      /price|পণ্য|product|item|নাম|বিবরণ/i.test(product)
    )
      continue;

    const unit = officialShape ? cells[2]?.trim() || "কেজি" : "কেজি";
    const priceCells = officialShape ? cells.slice(3) : cells.slice(1);
    const nums = priceCells.flatMap((cell) => parseNumbers(cell));
    if (nums.length === 0) continue;

    const priceMin = nums.length >= 2 ? Math.min(...nums) : null;
    const priceMax = nums.length >= 2 ? Math.max(...nums) : null;
    const priceAvg =
      nums.length >= 2 ? Math.round(((priceMin! + priceMax!) / 2) * 100) / 100 : nums[0]!;

    rows.push({
      product_name: product,
      district: "ঢাকা",
      market_name: null,
      price_min: priceMin,
      price_max: priceMax,
      price_avg: priceAvg,
      price_date: priceDate,
      unit,
      price_type: "retail",
      source: "DAM",
    });
  }
  return rows;
}

async function fetchDamRows(priceDate: string): Promise<GovtRow[]> {
  try {
    const headers = {
      "User-Agent": "Mozilla/5.0 KrishokBondhuBot/1.0",
      Accept: "text/html,application/xhtml+xml",
    };
    const form = await fetch(DAM_REPORT_URL, { headers });
    if (!form.ok) return [];
    const formHtml = await form.text();
    const cookie = form.headers.get("set-cookie")?.split(";")[0];
    const token = formHtml.match(/id=["']token["'][^>]*value=["']([^"']+)["']/i)?.[1];
    if (!token) return [];

    const body = new URLSearchParams();
    body.append("PriceType_id[]", "4");
    body.set("date", priceDate);
    body.set("csrf_webspice_tkn", token);
    body.set("filter", "Generate Report");

    const report = await fetch(DAM_REPORT_URL, {
      method: "POST",
      headers: {
        ...headers,
        ...(cookie ? { Cookie: cookie } : {}),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!report.ok) return [];
    return parseDamHtml(await report.text(), priceDate);
  } catch (e) {
    console.warn("[fetch-govt-prices] DAM report failed:", e);
    return [];
  }
}

export const Route = createFileRoute("/api/public/hooks/fetch-govt-prices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Cron auth: preferred `x-cron-secret`, legacy `apikey` accepted
        // during transition (see src/lib/cron-auth.server.ts).
        if (!isAuthorizedCronRequest(request)) {
          return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
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
            ? body.rows.map((r) => ({
                ...r,
                source: r.source ?? "DAM",
                unit: r.unit ?? "কেজি",
                price_type: r.price_type ?? "retail",
              }))
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
          .upsert(
            rows.map((row) => ({
              ...row,
              unit: row.unit ?? "কেজি",
              price_type: row.price_type ?? "retail",
            })),
            {
              onConflict: "product_name,district,market_name,price_date,source",
              ignoreDuplicates: false,
            },
          )
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
