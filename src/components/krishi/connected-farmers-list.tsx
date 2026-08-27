import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { type FarmerProfile } from "@/components/krishi/farmer-card";
import { CompactFriendItem } from "@/components/krishi/direct-message-popup";
import { Skeleton } from "@/components/ui/skeleton";

const PREVIEW_LIMIT = 5;

export function ConnectedFarmersList({ profileId }: { profileId: string; currentUserId?: string }) {
  const query = useQuery({
    queryKey: ["public-connected-farmers", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc(
        "get_public_connected_farmers" as never,
        { target_user_id: profileId } as never,
      );
      if (error) throw error;
      return (data as FarmerProfile[]) ?? [];
    },
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Users className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-extrabold text-foreground">সংযুক্ত কৃষক</h3>
          <p className="text-[11px] text-muted-foreground">বন্ধু তালিকা</p>
        </div>
        {query.data && (
          <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-extrabold text-primary">
            {query.data.length} জন
          </span>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {query.isLoading ? (
          Array.from({ length: PREVIEW_LIMIT }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-1">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))
        ) : query.error ? (
          <p className="rounded-xl bg-muted px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
            বন্ধু তালিকা এখন দেখা যাচ্ছে না
          </p>
        ) : query.data?.length ? (
          <div className="grid grid-cols-5 gap-2 sm:gap-4">
            {query.data.slice(0, PREVIEW_LIMIT).map((farmer) => (
              <CompactFriendItem key={farmer.id} friend={farmer} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-primary/5 px-3 py-4 text-center text-xs font-semibold text-muted-foreground">
            এখনো কোনো সংযুক্ত কৃষক নেই
          </p>
        )}
      </div>
    </section>
  );
}
