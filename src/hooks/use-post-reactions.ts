import { useCallback, useMemo } from "react";
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
  const { user } = useUser();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ["post-reactions", postId] as const, [postId]);
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
      if (row.user_id === user?.id) mine = row.reaction_type;
    }
    return { counts, mine };
  }, [rows, user?.id]);

  const setReaction = useCallback(async (reaction: ReactionType | null) => {
    if (!user) return false;
    const previous = queryClient.getQueryData<PostReaction[]>(queryKey) ?? [];
    const optimistic = previous.filter((row) => row.user_id !== user.id);
    if (reaction) optimistic.push({ post_id: postId, user_id: user.id, reaction_type: reaction });
    queryClient.setQueryData(queryKey, optimistic);

    const result = reaction
      ? await supabase.from("post_reactions").upsert(
        { post_id: postId, user_id: user.id, reaction_type: reaction },
        { onConflict: "post_id,user_id" },
      )
      : await supabase.from("post_reactions").delete().eq("post_id", postId).eq("user_id", user.id);

    if (result.error) {
      queryClient.setQueryData(queryKey, previous);
      return false;
    }
    return true;
  }, [postId, queryClient, queryKey, user]);

  return { ...state, isLoading, setReaction };
}
