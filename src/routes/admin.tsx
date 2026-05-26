import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Search, Shield, Ban, CheckCircle2, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user-context";
import { useRole, type AppRole } from "@/hooks/use-role";
import { RoleBadge } from "@/components/krishi/role-badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "অ্যাডমিন প্যানেল — কৃষিবন্ধু" },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type AdminProfile = {
  id: string;
  name: string;
  phone: string | null;
  district: string | null;
  upazila: string | null;
  is_verified: boolean;
  is_suspended: boolean;
  suspension_until: string | null;
  expert_specialty: string | null;
  expert_institution: string | null;
  created_at: string;
};

const ROLES: AppRole[] = ["farmer", "expert", "moderator", "admin"];
const RANK: Record<AppRole, number> = { farmer: 0, expert: 1, moderator: 2, admin: 3 };

function AdminPage() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!userLoading && !user) navigate({ to: "/login" });
  }, [user, userLoading, navigate]);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin", "profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, phone, district, upazila, is_verified, is_suspended, suspension_until, expert_specialty, expert_institution, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data as AdminProfile[]) ?? [];
    },
  });

  const { data: allRoles = [] } = useQuery({
    queryKey: ["admin", "all-roles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return ((data as { user_id: string; role: AppRole }[] | null) ?? []);
    },
  });

  const rolesByUser = useMemo(() => {
    const m = new Map<string, AppRole[]>();
    for (const r of allRoles) {
      const arr = m.get(r.user_id) ?? [];
      arr.push(r.role);
      m.set(r.user_id, arr);
    }
    return m;
  }, [allRoles]);

  const stats = useMemo(() => {
    const counts = { farmer: 0, expert: 0, moderator: 0, admin: 0 };
    for (const arr of rolesByUser.values()) {
      const top = arr.reduce<AppRole>((a, r) => (RANK[r] > RANK[a] ? r : a), "farmer");
      counts[top] = (counts[top] ?? 0) + 1;
    }
    return counts;
  }, [rolesByUser]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.phone ?? "").toLowerCase().includes(q) ||
        (p.district ?? "").toLowerCase().includes(q),
    );
  }, [profiles, search]);

  const setRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: AppRole }) => {
      // Strategy: remove all existing roles, insert the new one.
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (delErr) throw delErr;
      const { error: insErr } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole, granted_by: user?.id ?? null });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      toast.success("ভূমিকা আপডেট হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "all-roles"] });
      qc.invalidateQueries({ queryKey: ["role"] });
      qc.invalidateQueries({ queryKey: ["users-meta"] });
    },
    onError: () => toast.error("ভূমিকা পরিবর্তন ব্যর্থ"),
  });

  const verifyExpert = useMutation({
    mutationFn: async ({
      userId,
      specialty,
      institution,
    }: {
      userId: string;
      specialty: string;
      institution: string;
    }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user?.id ?? null,
          expert_specialty: specialty || null,
          expert_institution: institution || null,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("বিশেষজ্ঞ যাচাই হয়েছে");
      qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
      qc.invalidateQueries({ queryKey: ["users-meta"] });
    },
    onError: () => toast.error("যাচাই ব্যর্থ"),
  });

  const toggleSuspend = useMutation({
    mutationFn: async ({
      userId,
      suspend,
      reason,
      days,
    }: {
      userId: string;
      suspend: boolean;
      reason?: string;
      days?: number;
    }) => {
      const patch = suspend
        ? {
            is_suspended: true,
            suspension_reason: reason || "নীতি লঙ্ঘন",
            suspension_until: days ? new Date(Date.now() + days * 86400_000).toISOString() : null,
          }
        : { is_suspended: false, suspension_reason: null, suspension_until: null };
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("সম্পন্ন");
      qc.invalidateQueries({ queryKey: ["admin", "profiles"] });
    },
    onError: () => toast.error("ব্যর্থ"),
  });

  if (userLoading || roleLoading) {
    return (
      <main className="p-4 space-y-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="mt-3 font-bold">শুধু প্রশাসকদের জন্য</p>
          <button
            onClick={() => navigate({ to: "/dashboard" })}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
          >
            হোমে ফিরে যান
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="px-4 pt-6 pb-6 rounded-b-3xl" style={{ background: "var(--gradient-brand)" }}>
        <button
          onClick={() => navigate({ to: "/dashboard" })}
          aria-label="ফিরে যান"
          className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center ring-2 ring-white/20"
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="mt-3 flex items-center gap-2">
          <UserCog className="h-6 w-6 text-white" />
          <h1 className="text-xl font-bold text-white">অ্যাডমিন প্যানেল</h1>
        </div>
      </header>

      <section className="px-4 mt-4 grid grid-cols-4 gap-2">
        {(["farmer", "expert", "moderator", "admin"] as AppRole[]).map((r) => (
          <div key={r} className="bg-card rounded-xl border border-border p-2 text-center">
            <p className="text-[10px] font-semibold text-muted-foreground">
              {r === "farmer" ? "কৃষক" : r === "expert" ? "বিশেষজ্ঞ" : r === "moderator" ? "মডারেটর" : "প্রশাসক"}
            </p>
            <p className="text-xl font-bold text-foreground">{stats[r] ?? 0}</p>
          </div>
        ))}
      </section>

      <section className="px-4 mt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="নাম, ফোন বা জেলা..."
            className="w-full h-11 pl-9 pr-3 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </section>

      <section className="px-4 mt-4 space-y-2">
        {profilesLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
        ) : (
          filtered.map((p) => {
            const roles = rolesByUser.get(p.id) ?? ["farmer"];
            const top = roles.reduce<AppRole>((a, r) => (RANK[r] > RANK[a] ? r : a), "farmer");
            return (
              <UserRow
                key={p.id}
                profile={p}
                currentRole={top}
                onChangeRole={(newRole) => setRole.mutate({ userId: p.id, newRole })}
                onVerify={(specialty, institution) =>
                  verifyExpert.mutate({ userId: p.id, specialty, institution })
                }
                onSuspend={(reason, days) =>
                  toggleSuspend.mutate({ userId: p.id, suspend: true, reason, days })
                }
                onUnsuspend={() => toggleSuspend.mutate({ userId: p.id, suspend: false })}
              />
            );
          })
        )}
      </section>
    </main>
  );
}

function UserRow({
  profile,
  currentRole,
  onChangeRole,
  onVerify,
  onSuspend,
  onUnsuspend,
}: {
  profile: AdminProfile;
  currentRole: AppRole;
  onChangeRole: (r: AppRole) => void;
  onVerify: (specialty: string, institution: string) => void;
  onSuspend: (reason: string, days: number) => void;
  onUnsuspend: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [specialty, setSpecialty] = useState(profile.expert_specialty ?? "");
  const [institution, setInstitution] = useState(profile.expert_institution ?? "");
  const [reason, setReason] = useState("");
  const [days, setDays] = useState(7);

  return (
    <article className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center shrink-0">
          {profile.name.charAt(0) || "ক"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-sm truncate">{profile.name || "—"}</p>
            <RoleBadge role={currentRole} verified={profile.is_verified} />
            {profile.is_suspended && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-300">
                স্থগিত
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {profile.phone ?? "—"} · {profile.district ?? "—"}
          </p>
        </div>
        <button
          onClick={() => setExpanded((x) => !x)}
          className="text-xs font-semibold text-primary px-2 py-1"
        >
          {expanded ? "বন্ধ" : "পরিচালনা"}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div>
            <p className="text-xs font-bold mb-1">ভূমিকা</p>
            <div className="flex gap-1.5 flex-wrap">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => onChangeRole(r)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
                    currentRole === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-input text-foreground"
                  }`}
                >
                  {r === "farmer" ? "কৃষক" : r === "expert" ? "বিশেষজ্ঞ" : r === "moderator" ? "মডারেটর" : "প্রশাসক"}
                </button>
              ))}
            </div>
          </div>

          {currentRole === "expert" && (
            <div className="space-y-2">
              <p className="text-xs font-bold">বিশেষজ্ঞ যাচাই</p>
              <input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="বিশেষত্ব (যেমন: ধান বিশেষজ্ঞ)"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="প্রতিষ্ঠান (যেমন: BRRI)"
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
              />
              <button
                onClick={() => onVerify(specialty, institution)}
                className="h-9 px-3 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                {profile.is_verified ? "পুনরায় যাচাই" : "যাচাই করুন"}
              </button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-bold">স্থগিতাদেশ</p>
            {profile.is_suspended ? (
              <button
                onClick={onUnsuspend}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
              >
                স্থগিতাদেশ তুলুন
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="কারণ"
                  className="w-full h-9 px-3 rounded-lg border border-input bg-background text-xs"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value) || 0)}
                    className="h-9 w-20 px-2 rounded-lg border border-input bg-background text-xs"
                  />
                  <span className="text-xs text-muted-foreground">দিন (০ = অনির্দিষ্ট)</span>
                </div>
                <button
                  onClick={() => onSuspend(reason, days)}
                  className="h-9 px-3 rounded-lg bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Ban className="h-4 w-4" /> স্থগিত করুন
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
