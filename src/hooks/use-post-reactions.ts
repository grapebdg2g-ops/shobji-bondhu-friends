import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user-context";
import { type ReactionType } from "@/lib/reactions";

export type PostReaction = {
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
};

type ReactionState = {
  counts: Record<ReactionType, number>;
  mine: ReactionType | null;
};

const emptyCounts = (): Record<ReactionType, number> => ({
  like: 0,
  love: 0,
  care: 0,
  haha: 0,
  wow: 0,
  sad: 0,
  angry: 0,
});

export function usePostReactions(postId: string) {
  const { user: profileUser } = useUser();
  const queryClient = useQueryClient();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const queryKey = useMemo(() => ["post-reactions", postId] as const, [postId]);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthUserId(data.session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthUserId(session?.user.id ?? null);
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const currentUserId = authUserId ?? profileUser?.id ?? null;
  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_reactions")
        .select("post_id, user_id, reaction_type")
        .eq("post_id", postId);
      if (error) throw new Error(error.message);
      return (data as PostReaction[]) ?? [];
    },
    staleTime: 30_000,
  });

  const state = useMemo<ReactionState>(() => {
    const counts = emptyCounts();
    let mine: ReactionType | null = null;
    for (const row of rows) {
      if (row.reaction_type in counts) counts[row.reaction_type] += 1;
      if (row.user_id === currentUserId) mine = row.reaction_type;
    }
    return { counts, mine };
  }, [currentUserId, rows]);

  const setReaction = useCallback(async (reaction: ReactionType | null) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData.user?.id ?? currentUserId;
    if (!userId) return false;

    const previous = queryClient.getQueryData<PostReaction[]>(queryKey) ?? [];
    const optimistic = previous.filter((row) => row.user_id !== userId);
    if (reaction) optimistic.push({ post_id: postId, user_id: userId, reaction_type: reaction });
    queryClient.setQueryData(queryKey, optimistic);

    const result = reaction
      ? await supabase.from("post_reactions").upsert(
        { post_id: postId, user_id: userId, reaction_type: reaction },
        { onConflict: "post_id,user_id" },
      )
      : await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", userId);

    if (result.error) {
      queryClient.setQueryData(queryKey, previous);
      return false;
    }
    return true;
  }, [currentUserId, postId, queryClient, queryKey]);

  return { ...state, isLoading, setReaction };
}
