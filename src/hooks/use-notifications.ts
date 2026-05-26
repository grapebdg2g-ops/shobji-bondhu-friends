import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  ref_id: string | null;
  ref_type: string | null;
  created_at: string;
};

const notificationsKey = (userId: string | null) => ["notifications", userId] as const;

async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  return (data as Notification[]) ?? [];
}

export function useNotifications(userId: string | null) {
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: notificationsKey(userId),
    queryFn: () => fetchNotifications(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });

  // Realtime: prepend new notifications into the cache
  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`notifs-${userId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          qc.setQueryData<Notification[]>(notificationsKey(userId), (prev) => [
            payload.new as Notification,
            ...(prev ?? []),
          ]);
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, qc]);

  const unreadCount = items.filter((n) => !n.is_read).length;

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    qc.setQueryData<Notification[]>(notificationsKey(userId), (prev) =>
      (prev ?? []).map((n) => ({ ...n, is_read: true })),
    );
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  }, [userId, qc]);

  const remove = useCallback(async (id: string) => {
    qc.setQueryData<Notification[]>(notificationsKey(userId), (prev) =>
      (prev ?? []).filter((n) => n.id !== id),
    );
    await supabase.from("notifications").delete().eq("id", id);
  }, [userId, qc]);

  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: notificationsKey(userId) });
  }, [qc, userId]);

  return { items, loading: isLoading, unreadCount, markAllRead, remove, refresh };
}
