import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "report_market_price",
  title: "Report a market price",
  description:
    "Submit a new community market price report for a product in a market/district, on behalf of the signed-in user.",
  inputSchema: {
    product_name: z.string().trim().min(1).describe("Product name in Bengali, e.g. 'আলু'."),
    price: z.number().positive().max(1000000).describe("Price in BDT."),
    unit: z.string().trim().min(1).describe("Unit, e.g. 'কেজি'."),
    market_name: z.string().trim().min(1).describe("Market name."),
    district: z.string().trim().min(1).describe("District name in Bengali."),
    upazila: z.string().trim().min(1).optional().describe("Upazila name in Bengali."),
    category: z.string().trim().min(1).describe("Category, e.g. 'সবজি'."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId!)
      .maybeSingle();
    const { data, error } = await supabase
      .from("prices")
      .insert({
        ...input,
        upazila: input.upazila ?? null,
        user_id: userId!,
        user_name: profile?.name ?? "কৃষিবন্ধু ব্যবহারকারী",
      })
      .select("id, product_name, price, unit, market_name, district, previous_price, created_at");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data?.[0] ?? null) }],
      structuredContent: { price: data?.[0] ?? null },
    };
  },
});
