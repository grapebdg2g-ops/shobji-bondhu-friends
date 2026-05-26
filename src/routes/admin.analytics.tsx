import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toBn, fmtBdt } from "@/lib/bn";
import { subDays } from "date-fns";

export const Route = createFileRoute("/admin/analytics")({ component: AnalyticsPage });

type Range = "1" | "7" | "30";

function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30");
  const since = useMemo(() => subDays(new Date(), Number(range)).toISOString(), [range]);

  const { data: districts = [] } = useQuery({
    queryKey: ["admin", "analytics", "districts", range],
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("district").gte("created_at", since).limit(2000);
      const c: Record<string, number> = {};
      (data ?? []).forEach((r) => { if (r.district) c[r.district] = (c[r.district] ?? 0) + 1; });
      return Object.entries(c).map(([d, n]) => ({ district: d, count: n })).sort((a, b) => b.count - a.count).slice(0, 10);
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin", "analytics", "products", range],
    queryFn: async () => {
      const { data } = await supabase.from("prices").select("product_name").gte("created_at", since).limit(2000);
      const c: Record<string, number> = {};
      (data ?? []).forEach((r) => { if (r.product_name) c[r.product_name] = (c[r.product_name] ?? 0) + 1; });
      return Object.entries(c).map(([p, n]) => ({ product: p, count: n })).sort((a, b) => b.count - a.count).slice(0, 10);
    },
  });

  const { data: diseases = [] } = useQuery({
    queryKey: ["admin", "analytics", "diseases", range],
    queryFn: async () => {
      const { data } = await supabase.from("disease_history").select("disease_name, crop_type").gte("created_at", since).limit(2000);
      const c: Record<string, number> = {};
      (data ?? []).forEach((r) => { if (r.disease_name) c[r.disease_name] = (c[r.disease_name] ?? 0) + 1; });
      return Object.entries(c).map(([d, n]) => ({ disease: d, count: n })).sort((a, b) => b.count - a.count).slice(0, 5);
    },
  });

  const { data: retention } = useQuery({
    queryKey: ["admin", "analytics", "retention"],
    queryFn: async () => {
      const w1 = subDays(new Date(), 14).toISOString();
      const w1end = subDays(new Date(), 7).toISOString();
      const { data: cohort } = await supabase.from("profiles").select("id, created_at").gte("created_at", w1).lt("created_at", w1end);
      const ids = (cohort ?? []).map((c) => c.id);
      if (!ids.length) return { week1: 0, total: 0 };
      const { data: active } = await supabase.from("posts").select("user_id").gte("created_at", w1end).in("user_id", ids);
      const returned = new Set((active ?? []).map((a) => a.user_id)).size;
      return { week1: Math.round((returned / ids.length) * 100), total: ids.length };
    },
  });

  const exportCsv = (rows: Array<Record<string, unknown>>, name: string) => {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map((r) => keys.map((k) => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${name}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-2">
        <p className="font-bold text-sm pl-2">Analytics</p>
        <div className="flex gap-1">
          {(["1", "7", "30"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold ${range === r ? "bg-purple-600 text-white" : "text-gray-700"}`}>
              {r === "1" ? "আজ" : `${toBn(r)} দিন`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="১ম সপ্তাহে ফিরে আসা" value={`${toBn(retention?.week1 ?? 0)}%`} sub={`কোহোর্ট: ${toBn(retention?.total ?? 0)} জন`} />
        <Stat label="সক্রিয় জেলা" value={toBn(districts.length)} />
        <Stat label="MRR (Revenue)" value={fmtBdt(0)} sub="Pro শীঘ্রই" />
      </div>

      <Card title="সক্রিয় জেলা (টপ ১০)" onExport={() => exportCsv(districts, "districts")}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={districts}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="district" fontSize={10} angle={-25} textAnchor="end" height={60} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="জনপ্রিয় পণ্য (দাম আপডেট)" onExport={() => exportCsv(products, "products")}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={products}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="product" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="শীর্ষ ৫ রোগ" onExport={() => exportCsv(diseases, "diseases")}>
        <ul className="divide-y divide-gray-100">
          {diseases.map((d) => (
            <li key={d.disease} className="py-2 flex justify-between text-sm">
              <span>{d.disease}</span><span className="font-bold">{toBn(d.count)}</span>
            </li>
          ))}
          {diseases.length === 0 && <li className="py-4 text-center text-gray-400 text-sm">তথ্য নেই</li>}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
    </div>
  );
}

function Card({ title, children, onExport }: { title: string; children: React.ReactNode; onExport?: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold">{title}</h3>
        {onExport && (
          <Button size="sm" variant="outline" onClick={onExport}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        )}
      </div>
      {children}
    </div>
  );
}
