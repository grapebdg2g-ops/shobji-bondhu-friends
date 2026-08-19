import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user-context";
import { FarmerCard, type FarmerProfile } from "@/components/krishi/farmer-card";
import { type ConnectionRow } from "@/hooks/use-connections";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/friends")({
  component: FriendsPage,
  head: () => ({
    meta: [
      { title: "বন্ধু তালিকা — কৃষিবন্ধু" },
      { name: "description", content: "আপনার সঙ্গে সংযুক্ত কৃষকদের বন্ধু তালিকা দেখুন এবং সাজান।" },
    ],
  }),
});

type SortMode = "newest" | "oldest" | "name";
type FriendRecord = { profile: FarmerProfile; connection: ConnectionRow };

function FriendsPage() {
  const { user } = useUser();
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");

  const friendsQuery = useQuery({
    queryKey: ["friends-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select("id,requester_id,addressee_id,status,created_at,updated_at")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const connections = (data as ConnectionRow[]) ?? [];
      const profileIds = Array.from(
        new Set(
          connections.map((row) =>
            row.requester_id === user!.id ? row.addressee_id : row.requester_id,
          ),
        ),
      );
      if (!profileIds.length) return [] as FriendRecord[];
      const profilesResult = await supabase
        .from("profiles")
        .select("id,name,district,upazila,avatar_url,bio,crops,role,is_verified")
        .in("id", profileIds);
      if (profilesResult.error) throw profilesResult.error;
      const profiles = (profilesResult.data as FarmerProfile[]) ?? [];
      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
      return connections.flatMap((connection) => {
        const friendId =
          connection.requester_id === user!.id ? connection.addressee_id : connection.requester_id;
        const profile = profileById.get(friendId);
        return profile ? [{ profile, connection }] : [];
      });
    },
  });

  const filteredFriends = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("bn-BD");
    const filtered = (friendsQuery.data ?? []).filter(
      ({ profile }) =>
        !needle ||
        [profile.name, profile.district, profile.upazila, profile.bio, ...(profile.crops ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("bn-BD")
          .includes(needle),
    );
    return [...filtered].sort((a, b) => {
      if (sortMode === "name")
        return (a.profile.name ?? "").localeCompare(b.profile.name ?? "", "bn-BD");
      const aDate = new Date(a.connection.updated_at || a.connection.created_at).getTime();
      const bDate = new Date(b.connection.updated_at || b.connection.created_at).getTime();
      return sortMode === "newest" ? bDate - aDate : aDate - bDate;
    });
  }, [friendsQuery.data, query, sortMode]);

  return (
    <main className="min-h-screen bg-background pb-24">
      <header className="relative overflow-hidden rounded-b-[30px] px-4 pb-7 pt-6 sm:px-6">
        <div className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full bg-[#74C69D]/25 blur-3xl" />
        <div className="relative z-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            aria-label="প্রোফাইলে ফিরে যান"
            className="home-pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/65">
              আমার নেটওয়ার্ক
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-white">বন্ধু তালিকা</h1>
          </div>
          <span className="ml-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md">
            <Users className="h-6 w-6" />
          </span>
        </div>
        <p className="relative z-10 mt-3 max-w-md text-sm leading-relaxed text-white/75">
          আপনার সঙ্গে সংযুক্ত কৃষকদের খুঁজুন, সাজান এবং দ্রুত যোগাযোগ করুন।
        </p>
      </header>

      <section className="space-y-3 px-4 pt-4 sm:px-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="বন্ধুর নাম, এলাকা বা ফসল দিয়ে খুঁজুন"
            className="h-12 w-full rounded-2xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-card)]">
          <CalendarDays className="ml-1 h-4 w-4 shrink-0 text-primary" />
          <label htmlFor="friend-sort" className="sr-only">
            বন্ধু তালিকা সাজান
          </label>
          <select
            id="friend-sort"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="h-10 min-w-0 flex-1 rounded-xl bg-transparent px-2 text-xs font-bold text-foreground outline-none"
          >
            <option value="newest">তারিখ: নতুন থেকে পুরোনো</option>
            <option value="oldest">তারিখ: পুরোনো থেকে নতুন</option>
            <option value="name">নাম: ক থেকে য</option>
          </select>
        </div>
      </section>

      <section className="px-4 pb-6 pt-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-extrabold text-muted-foreground">
            {friendsQuery.data?.length ?? 0} জন সংযুক্ত কৃষক
          </p>
          {sortMode !== "name" && (
            <p className="text-[10px] font-semibold text-muted-foreground">
              সংযুক্তির তারিখ অনুযায়ী
            </p>
          )}
        </div>
        {friendsQuery.isLoading ? (
          <FriendSkeletons />
        ) : friendsQuery.error ? (
          <EmptyFriends text="বন্ধু তালিকা লোড করা যায়নি" />
        ) : filteredFriends.length === 0 ? (
          <EmptyFriends
            text={query ? "এই নামে কোনো বন্ধু পাওয়া যায়নি" : "এখনো কোনো সংযুক্ত কৃষক নেই"}
          />
        ) : (
          <div className="space-y-3">
            {filteredFriends.map(({ profile, connection }) => (
              <div key={connection.id}>
                <FarmerCard profile={profile} currentUserId={user?.id} connection={connection} />
                <p className="mt-1 px-2 text-[10px] font-semibold text-muted-foreground">
                  সংযুক্ত হয়েছেন: {formatDate(connection.updated_at || connection.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("bn-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function FriendSkeletons() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-[22px] border border-border bg-card p-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-2.5 w-24" />
            </div>
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyFriends({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-primary/30 bg-primary/5 px-5 py-12 text-center">
      <Users className="mx-auto h-8 w-8 text-primary/60" />
      <p className="mt-3 text-sm font-bold text-foreground">{text}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        সকল কৃষক পেজ থেকে আরও কৃষকের সঙ্গে সংযোগ তৈরি করুন।
      </p>
    </div>
  );
}
