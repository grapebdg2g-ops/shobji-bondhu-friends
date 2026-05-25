import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";
import {
  ArrowLeft, Camera, Edit3, Trash2, Power, Pencil, LogOut,
  Bell, Globe, Info, Star, HelpCircle, ChevronRight, MapPin, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user-context";
import { BottomSheet } from "@/components/krishi/bottom-sheet";
import { EmptyState } from "@/components/krishi/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { DISTRICTS } from "@/lib/bd-data";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({
    meta: [
      { title: "প্রোফাইল — কৃষিবন্ধু" },
      { name: "description", content: "আপনার প্রোফাইল, পোস্ট, বিনিময় ও দাম আপডেট দেখুন।" },
    ],
  }),
});

const CROP_OPTIONS = ["ধান", "গম", "আলু", "টমেটো", "বেগুন", "পেঁয়াজ", "ভুট্টা", "সবজি", "ফল", "অন্যান্য"];
const SUPPORT_PHONE = "01700000000";
const SUPPORT_EMAIL = "support@krishinet.com";

type Counts = { posts: number; exchanges: number; prices: number };
type ProfileFull = {
  id: string;
  name: string;
  phone: string | null;
  district: string | null;
  upazila: string | null;
  crops: string[];
  role: string;
  avatar_url: string | null;
  bio: string | null;
  posts_count: number;
  exchanges_count: number;
  prices_count: number;
};

function initials(name: string | null | undefined) {
  const n = (name || "").trim();
  if (!n) return "ক";
  return n.charAt(0);
}

function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser, signOut } = useUser();

  const [full, setFull] = useState<ProfileFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [tab, setTab] = useState<"posts" | "exchanges" | "prices">("posts");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) { navigate({ to: "/login" }); return; }
      const { data: p } = await supabase
        .from("profiles")
        .select("id, name, phone, district, upazila, crops, role, avatar_url, bio, posts_count, exchanges_count, prices_count")
        .eq("id", uid)
        .maybeSingle();
      setFull((p as ProfileFull | null) ?? null);
      setLoading(false);
    })();
  }, [navigate]);

  const counts: Counts = useMemo(
    () => ({
      posts: full?.posts_count ?? 0,
      exchanges: full?.exchanges_count ?? 0,
      prices: full?.prices_count ?? 0,
    }),
    [full],
  );

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !full) return;
    if (!["image/jpeg", "image/png"].includes(f.type)) {
      toast.error("শুধু JPG/PNG আপলোড করা যাবে");
      return;
    }
    setUploading(true);
    try {
      const compressed = await imageCompression(f, { maxSizeMB: 0.3, maxWidthOrHeight: 400, useWebWorker: true });
      const path = `${full.id}/avatar-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, compressed, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;
      const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", full.id);
      if (dbErr) throw dbErr;
      setFull((p) => (p ? { ...p, avatar_url: url } : p));
      await refreshUser();
      toast.success("ছবি আপডেট হয়েছে");
    } catch {
      toast.error("ছবি আপলোড ব্যর্থ");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdit = async (patch: Partial<ProfileFull>) => {
    if (!full) return;
    const { error } = await supabase.from("profiles").update(patch).eq("id", full.id);
    if (error) { toast.error("সংরক্ষণ ব্যর্থ"); return; }
    setFull({ ...full, ...patch });
    await refreshUser();
    toast.success("✅ প্রোফাইল আপডেট হয়েছে");
    setEditOpen(false);
  };

  const doLogout = async () => {
    setLogoutOpen(false);
    await signOut();
    navigate({ to: "/login" });
  };

  if (loading || !full) {
    return (
      <main className="min-h-screen bg-background p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </main>
    );
  }

  const roleLabel = full.role === "expert" ? "বিশেষজ্ঞ" : "কৃষক";

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-6 pb-10 rounded-b-3xl relative" style={{ background: "var(--gradient-brand)" }}>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          aria-label="ফিরে যান"
          className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>

        <div className="mt-3 flex flex-col items-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-white/20 ring-4 ring-white/40 overflow-hidden flex items-center justify-center">
              {full.avatar_url ? (
                <img src={full.avatar_url} alt={full.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">{initials(full.name)}</span>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">আপলোড...</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="ছবি পরিবর্তন"
              className="absolute bottom-0 right-0 h-9 w-9 rounded-full bg-primary text-primary-foreground border-2 border-white shadow flex items-center justify-center active:scale-95"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={onPickAvatar} />
          </div>

          <h1 className="mt-3 text-2xl font-bold text-white text-center">{full.name || "কৃষক"}</h1>
          <div className="flex items-center gap-1 mt-1 text-white/85 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {full.district || "—"}
              {full.upazila ? `, ${full.upazila}` : ""}
            </span>
          </div>
          <span className="mt-2 inline-flex px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold ring-1 ring-white/30">
            {roleLabel}
          </span>
        </div>
      </header>

      <section className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "পোস্ট", count: counts.posts, sub: "সংখ্যা" },
            { label: "বিনিময়", count: counts.exchanges, sub: "সংখ্যা" },
            { label: "দাম", count: counts.prices, sub: "আপডেট" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl shadow-sm border border-border py-3 text-center">
              <p className="text-xs font-semibold text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground leading-tight mt-1">{s.count}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="mt-4 w-full h-11 rounded-xl border-2 border-primary text-primary font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          <Edit3 className="h-4 w-4" /> প্রোফাইল সম্পাদনা
        </button>

        {full.bio && (
          <p className="mt-3 text-sm text-foreground bg-muted/50 rounded-xl px-3 py-2 whitespace-pre-wrap">
            {full.bio}
          </p>
        )}
      </section>

      <section className="px-4 mt-6">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {([
            ["posts", "আমার পোস্ট"],
            ["exchanges", "আমার বিনিময়"],
            ["prices", "দাম আপডেট"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 h-9 rounded-lg text-xs font-bold transition ${tab === k ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {tab === "posts" && (
            <MyPostsTab
              userId={full.id}
              onChange={(delta) => setFull((p) => (p ? { ...p, posts_count: Math.max(0, p.posts_count + delta) } : p))}
            />
          )}
          {tab === "exchanges" && (
            <MyExchangesTab
              userId={full.id}
              onChange={(delta) => setFull((p) => (p ? { ...p, exchanges_count: Math.max(0, p.exchanges_count + delta) } : p))}
            />
          )}
          {tab === "prices" && (
            <MyPricesTab
              userId={full.id}
              onChange={(delta) => setFull((p) => (p ? { ...p, prices_count: Math.max(0, p.prices_count + delta) } : p))}
            />
          )}
        </div>
      </section>

      <section className="px-4 mt-8">
        <h2 className="text-sm font-bold text-muted-foreground mb-2 px-1">সেটিংস</h2>
        <SettingsList onLogout={() => setLogoutOpen(true)} />
      </section>

      <EditProfileSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        profile={full}
        onSave={handleSaveEdit}
      />

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>লগআউট করবেন?</AlertDialogTitle>
            <AlertDialogDescription>আপনি কি নিশ্চিত যে লগআউট করতে চান?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>না</AlertDialogCancel>
            <AlertDialogAction onClick={doLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              হ্যাঁ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function EditProfileSheet({
  open,
  onClose,
  profile,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  profile: ProfileFull;
  onSave: (p: Partial<ProfileFull>) => Promise<void>;
}) {
  const [name, setName] = useState(profile.name);
  const [district, setDistrict] = useState(profile.district ?? "");
  const [upazila, setUpazila] = useState(profile.upazila ?? "");
  const [crops, setCrops] = useState<string[]>(profile.crops ?? []);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(profile.name);
      setDistrict(profile.district ?? "");
      setUpazila(profile.upazila ?? "");
      setCrops(profile.crops ?? []);
      setBio(profile.bio ?? "");
    }
  }, [open, profile]);

  const toggleCrop = (c: string) =>
    setCrops((x) => (x.includes(c) ? x.filter((y) => y !== c) : [...x, c]));

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("নাম দিন"); return; }
    if (trimmed.length > 100) { toast.error("নাম ১০০ অক্ষরের মধ্যে"); return; }
    if (bio.length > 150) { toast.error("পরিচিতি ১৫০ অক্ষরের মধ্যে"); return; }
    setSaving(true);
    await onSave({
      name: trimmed,
      district: district || null,
      upazila: upazila.trim() || null,
      crops,
      bio: bio.trim() || null,
    });
    setSaving(false);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="প্রোফাইল সম্পাদনা">
      <div className="space-y-4">
        <Field label="পুরো নাম">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 100))}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label="জেলা">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">— নির্বাচন করুন —</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </Field>

        <Field label="উপজেলা">
          <input
            value={upazila}
            onChange={(e) => setUpazila(e.target.value.slice(0, 80))}
            className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label="ফসলের ধরন">
          <div className="flex flex-wrap gap-2">
            {CROP_OPTIONS.map((c) => {
              const sel = crops.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCrop(c)}
                  className={`px-3 h-8 rounded-full text-xs font-semibold border ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-input"}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label={`ছোট পরিচিতি (${bio.length}/১৫০)`}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 150))}
            placeholder="আপনার চাষাবাদ সম্পর্কে কিছু লিখুন..."
            rows={3}
            className="w-full p-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label="ফোন নম্বর">
          <input
            disabled
            value={profile.phone ?? ""}
            className="w-full h-11 px-3 rounded-xl border border-input bg-muted text-sm text-muted-foreground"
          />
          <p className="text-[11px] text-muted-foreground mt-1">ফোন নম্বর পরিবর্তন করা যাবে না</p>
        </Field>

        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50 active:scale-[0.99]"
        >
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
        </button>
      </div>
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-foreground mb-1.5">{label}</p>
      {children}
    </div>
  );
}

type MyPost = {
  id: string; type: string; content: string; image_url: string | null;
  crop_tag: string | null; likes_count: number; comments_count: number;
  created_at: string;
};

function MyPostsTab({ userId, onChange }: { userId: string; onChange: (d: number) => void }) {
  const [rows, setRows] = useState<MyPost[] | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts").select("id, type, content, image_url, crop_tag, likes_count, comments_count, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      setRows((data as MyPost[]) ?? []);
    })();
  }, [userId]);

  const remove = async (id: string) => {
    setConfirmId(null);
    const prev = rows ?? [];
    setRows(prev.filter((r) => r.id !== id));
    onChange(-1);
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { toast.error("মুছতে ব্যর্থ"); setRows(prev); onChange(1); return; }
    toast.success("পোস্ট মুছে ফেলা হয়েছে");
  };

  if (rows === null) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="এখনো কোনো পোস্ট নেই"
        description="আপনার প্রথম পোস্ট দিয়ে শুরু করুন"
        action={
          <Link to="/feed" className="inline-flex h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold items-center gap-2">
            <Plus className="h-4 w-4" /> প্রথম পোস্ট করুন
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {rows.map((p) => (
          <LongPressCard key={p.id} onLongPress={() => setConfirmId(p.id)}>
            <article className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-foreground line-clamp-3 whitespace-pre-wrap flex-1">{p.content}</p>
                {p.image_url && (
                  <img src={p.image_url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" loading="lazy" />
                )}
              </div>
              <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                <span>👍 {p.likes_count} · 💬 {p.comments_count}{p.crop_tag ? ` · 🌾 ${p.crop_tag}` : ""}</span>
                <button
                  type="button"
                  onClick={() => setConfirmId(p.id)}
                  className="text-destructive p-1 active:scale-95"
                  aria-label="মুছুন"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          </LongPressCard>
        ))}
      </div>

      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>পোস্টটি মুছে ফেলবেন?</AlertDialogTitle>
            <AlertDialogDescription>এই কাজটি ফিরিয়ে আনা যাবে না।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>না</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmId && remove(confirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              হ্যাঁ, মুছুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <span className="hidden" aria-hidden>{String(!!navigate)}</span>
    </>
  );
}

function LongPressCard({ children, onLongPress }: { children: React.ReactNode; onLongPress: () => void }) {
  const timer = useRef<number | null>(null);
  const start = () => {
    timer.current = window.setTimeout(onLongPress, 550);
  };
  const cancel = () => {
    if (timer.current) { window.clearTimeout(timer.current); timer.current = null; }
  };
  return (
    <div
      onTouchStart={start}
      onTouchEnd={cancel}
      onTouchMove={cancel}
      onMouseDown={start}
      onMouseUp={cancel}
      onMouseLeave={cancel}
    >
      {children}
    </div>
  );
}

type MyExchange = {
  id: string; title: string; type: string; price: number | null; unit: string | null;
  is_free: boolean; is_active: boolean; district: string; created_at: string; image_url: string | null;
};

function MyExchangesTab({ userId, onChange }: { userId: string; onChange: (d: number) => void }) {
  const [rows, setRows] = useState<MyExchange[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("exchanges").select("id, title, type, price, unit, is_free, is_active, district, created_at, image_url")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      setRows((data as MyExchange[]) ?? []);
    })();
  }, [userId]);

  const toggleActive = async (e: MyExchange) => {
    const next = !e.is_active;
    setRows((r) => r?.map((x) => (x.id === e.id ? { ...x, is_active: next } : x)) ?? null);
    const { error } = await supabase.from("exchanges").update({ is_active: next }).eq("id", e.id);
    if (error) {
      setRows((r) => r?.map((x) => (x.id === e.id ? { ...x, is_active: e.is_active } : x)) ?? null);
      toast.error("আপডেট ব্যর্থ");
    } else {
      toast.success(next ? "সক্রিয় করা হয়েছে" : "নিষ্ক্রিয় করা হয়েছে");
    }
  };

  const remove = async (id: string) => {
    const prev = rows ?? [];
    setRows(prev.filter((r) => r.id !== id));
    onChange(-1);
    const { error } = await supabase.from("exchanges").delete().eq("id", id);
    if (error) { setRows(prev); onChange(1); toast.error("মুছতে ব্যর্থ"); return; }
    toast.success("বিজ্ঞাপন মুছে ফেলা হয়েছে");
  };

  if (rows === null) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (rows.length === 0) {
    return (
      <EmptyState
        title="কোনো বিজ্ঞাপন নেই"
        description="আপনার প্রথম বিজ্ঞাপন দিন"
        action={
          <Link to="/exchange" className="inline-flex h-10 px-4 rounded-xl bg-primary text-primary-foreground font-bold items-center gap-2">
            <Plus className="h-4 w-4" /> বিজ্ঞাপন দিন
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((e) => (
        <article key={e.id} className={`rounded-2xl border bg-card p-3 ${e.is_active ? "border-border" : "border-dashed border-muted-foreground/40 opacity-70"}`}>
          <div className="flex items-start gap-3">
            {e.image_url ? (
              <img src={e.image_url} alt="" className="h-14 w-14 rounded-lg object-cover shrink-0" loading="lazy" />
            ) : (
              <div className="h-14 w-14 rounded-lg bg-muted shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{e.title}</p>
              <p className="text-xs text-muted-foreground">
                {e.is_free ? "বিনামূল্যে" : `${e.price ?? "—"} ${e.unit ?? ""}`} · {e.district}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${e.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
              {e.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => toggleActive(e)}
              className="flex-1 h-9 rounded-lg bg-muted text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Power className="h-3.5 w-3.5" /> {e.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
            </button>
            <Link
              to="/exchange"
              className="flex-1 h-9 rounded-lg bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5" /> সম্পাদনা
            </Link>
            <button
              type="button"
              onClick={() => remove(e.id)}
              className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-95"
              aria-label="মুছুন"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

type MyPrice = {
  id: string; product_name: string; price: number; unit: string;
  market_name: string; district: string; created_at: string;
};

function MyPricesTab({ userId, onChange }: { userId: string; onChange: (d: number) => void }) {
  const [rows, setRows] = useState<MyPrice[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("prices").select("id, product_name, price, unit, market_name, district, created_at")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
      setRows((data as MyPrice[]) ?? []);
    })();
  }, [userId]);

  const remove = async (id: string) => {
    const prev = rows ?? [];
    setRows(prev.filter((r) => r.id !== id));
    onChange(-1);
    const { error } = await supabase.from("prices").delete().eq("id", id);
    if (error) { setRows(prev); onChange(1); toast.error("মুছতে ব্যর্থ"); return; }
    toast.success("মুছে ফেলা হয়েছে");
  };

  if (rows === null) return <Skeleton className="h-32 w-full rounded-2xl" />;
  if (rows.length === 0) {
    return <EmptyState title="কোনো দাম আপডেট নেই" description="বাজার দর পেজ থেকে দাম যোগ করুন" />;
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
      {rows.map((p) => (
        <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{p.product_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {p.market_name} · {new Date(p.created_at).toLocaleDateString("bn-BD")}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-primary">৳{p.price}</p>
            <p className="text-[10px] text-muted-foreground">/{p.unit}</p>
          </div>
          <button
            type="button"
            onClick={() => remove(p.id)}
            className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center active:scale-95"
            aria-label="মুছুন"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function SettingsList({ onLogout }: { onLogout: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const [prefs, setPrefs] = useState(() => {
    if (typeof window === "undefined") return { price: true, posts: true, comments: true, exchange: true };
    try { return JSON.parse(localStorage.getItem("krishi:notif") || "") || { price: true, posts: true, comments: true, exchange: true }; }
    catch { return { price: true, posts: true, comments: true, exchange: true }; }
  });
  const updatePref = (k: keyof typeof prefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    try { localStorage.setItem("krishi:notif", JSON.stringify(next)); } catch { /* ignore */ }
  };

  const rate = () => {
    window.open("https://play.google.com/store", "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <SettingRow icon={Bell} label="নোটিফিকেশন সেটিংস" onClick={() => setNotifOpen(true)} />
        <SettingRow icon={Globe} label="ভাষা" value="বাংলা" onClick={() => setLangOpen(true)} />
        <SettingRow icon={Info} label="অ্যাপ সম্পর্কে" onClick={() => setAboutOpen(true)} />
        <SettingRow icon={Star} label="অ্যাপ রেট করুন" onClick={rate} />
        <SettingRow icon={HelpCircle} label="সাহায্য ও সাপোর্ট" onClick={() => setHelpOpen(true)} last />
      </div>

      <button
        type="button"
        onClick={onLogout}
        className="mt-6 w-full h-12 rounded-xl bg-destructive/10 text-destructive font-bold flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        <LogOut className="h-4 w-4" /> লগআউট
      </button>

      <BottomSheet open={notifOpen} onClose={() => setNotifOpen(false)} title="নোটিফিকেশন সেটিংস">
        <div className="space-y-3">
          {([
            ["price", "দাম আপডেট"],
            ["posts", "নতুন পোস্ট"],
            ["comments", "মন্তব্য"],
            ["exchange", "বিনিময়"],
          ] as const).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between py-2">
              <span className="text-sm font-semibold text-foreground">{label}</span>
              <Switch checked={prefs[k]} onCheckedChange={(v) => updatePref(k, v)} />
            </div>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={langOpen} onClose={() => setLangOpen(false)} title="ভাষা নির্বাচন">
        <div className="space-y-2">
          <button className="w-full h-12 rounded-xl border-2 border-primary bg-primary/5 text-primary font-bold">
            বাংলা ✓
          </button>
          <button disabled className="w-full h-12 rounded-xl border border-input text-muted-foreground font-semibold">
            English (শীঘ্রই আসছে)
          </button>
        </div>
      </BottomSheet>

      <BottomSheet open={aboutOpen} onClose={() => setAboutOpen(false)} title="অ্যাপ সম্পর্কে">
        <div className="space-y-3 text-sm text-foreground">
          <p><span className="font-bold">কৃষিবন্ধু</span> — বাংলাদেশের কৃষকদের জন্য একটি কমিউনিটি অ্যাপ।</p>
          <p>সংস্করণ: <span className="font-mono">1.0.0</span></p>
          <a href="#" className="block text-primary font-semibold">শর্তাবলী</a>
          <a href="#" className="block text-primary font-semibold">গোপনীয়তা নীতি</a>
        </div>
      </BottomSheet>

      <BottomSheet open={helpOpen} onClose={() => setHelpOpen(false)} title="সাহায্য ও সাপোর্ট">
        <div className="space-y-3">
          <a
            href={`https://wa.me/${SUPPORT_PHONE.replace(/^0/, "880")}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200"
          >
            <span className="text-sm font-bold text-emerald-700">WhatsApp</span>
            <span className="text-xs text-emerald-700">{SUPPORT_PHONE}</span>
          </a>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-200"
          >
            <span className="text-sm font-bold text-sky-700">ইমেইল</span>
            <span className="text-xs text-sky-700">{SUPPORT_EMAIL}</span>
          </a>
        </div>
      </BottomSheet>
    </>
  );
}

function SettingRow({
  icon: Icon, label, value, onClick, last,
}: {
  icon: typeof Bell; label: string; value?: string; onClick: () => void; last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted ${last ? "" : "border-b border-border"}`}
    >
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <span className="flex-1 text-left text-sm font-semibold text-foreground">{label}</span>
      {value && <span className="text-xs text-muted-foreground">{value}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
