import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LazyImage } from "@/components/krishi/lazy-image";
import { Skeleton } from "@/components/ui/skeleton";

type FriendProfile = {
  id: string;
  name: string;
  district: string | null;
  upazila: string | null;
  avatar_url: string | null;
};

type ConnectionRowLite = {
  id: string;
  requester_id: string;
  addressee_id: string;
  created_at: string;
  updated_at: string;
};

const PREVIEW_LIMIT = 5;

export function FriendsPreview({ userId }: { userId: string }) {
  const query = useQuery({
    queryKey: ["friends-preview", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connections")
        .select("id,requester_id,addressee_id,created_at,updated_at")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = (data as ConnectionRowLite[]) ?? [];
      const ids = Array.from(
        new Set(
          rows.map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id)),
        ),
      );
      if (!ids.length) return { total: 0, profiles: [] as FriendProfile[] };
      const res = await supabase
        .from("profiles")
        .select("id,name,district,upazila,avatar_url")
        .in("id", ids);
      if (res.error) throw res.error;
      const byId = new Map(((res.data as FriendProfile[]) ?? []).map((p) => [p.id, p]));
      const ordered = ids.flatMap((id) => {
        const p = byId.get(id);
        return p ? [p] : [];
      });
      return { total: ordered.length, profiles: ordered.slice(0, PREVIEW_LIMIT) };
    },
  });

  return (
    <section className="mx-auto mt-3 max-w-3xl border-y border-[#DADDE1] bg-white px-4 py-4 sm:rounded-xl sm:border sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#1C1E21]">বন্ধু তালিকা</h2>
          <p className="mt-0.5 text-xs text-[#65676B]">{query.data?.total ?? 0} জন সংযুক্ত কৃষক</p>
        </div>
        <Link
          to="/friends"
          className="flex h-9 shrink-0 items-center gap-1 rounded-lg bg-[#E4E6EB] px-3 text-xs font-extrabold text-[#1C1E21] transition hover:bg-[#D8DADF]"
        >
          সব দেখুন <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-4">
        {query.isLoading
          ? Array.from({ length: PREVIEW_LIMIT }).map((_, i) => (
              <div key={i} className="flex min-w-0 flex-col items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full sm:h-14 sm:w-14" />
                <Skeleton className="h-2.5 w-12" />
              </div>
            ))
          : query.data?.profiles.map((friend) => (
              <Link
                key={friend.id}
                to="/u/$userId"
                params={{ userId: friend.id }}
                className="group flex min-w-0 flex-col items-center text-center"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-[#E7F3FF] bg-[#E7F3FF] text-lg font-black text-[#1877F2] shadow-sm transition group-hover:border-[#1877F2] sm:h-14 sm:w-14 sm:text-xl">
                  {friend.avatar_url ? (
                    <LazyImage
                      src={friend.avatar_url}
                      alt={friend.name}
                      wrapperClassName="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {friend.name?.charAt(0) || "ক"}
                    </div>
                  )}
                </div>
                <p className="mt-1.5 w-full truncate text-[10px] font-bold text-[#1C1E21] sm:text-xs">
                  {friend.name || "কৃষক"}
                </p>
              </Link>
            ))}
      </div>

      {!query.isLoading && !query.data?.total ? (
        <div className="mt-2 rounded-xl bg-[#F0F2F5] px-4 py-8 text-center">
          <Users className="mx-auto h-8 w-8 text-[#BCC0C4]" />
          <p className="mt-2 text-sm font-bold text-[#65676B]">এখনো কোনো বন্ধু নেই</p>
        </div>
      ) : null}

      {(query.data?.total ?? 0) > PREVIEW_LIMIT ? (
        <Link
          to="/friends"
          className="mt-3 flex h-10 w-full items-center justify-center rounded-lg bg-[#F0F2F5] text-sm font-extrabold text-[#1C1E21] transition hover:bg-[#E4E6EB]"
        >
          আরও দেখুন ({query.data!.total - PREVIEW_LIMIT} জন)
        </Link>
      ) : null}
    </section>
  );
}
