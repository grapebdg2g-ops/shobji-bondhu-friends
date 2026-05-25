import { useEffect, useState } from "react";
import { Send, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user-context";

type Comment = {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "এখনই";
  if (m < 60) return `${m} মি আগে`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ঘ আগে`;
  return `${Math.floor(h / 24)} দিন আগে`;
}

export function CommentsSection({
  postId,
  onCommentAdded,
}: {
  postId: string;
  onCommentAdded: () => void;
}) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("post_comments")
        .select("id, user_name, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: false })
        .limit(50);
      setComments((data as Comment[]) ?? []);
      setLoading(false);
    })();
  }, [postId]);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    if (!user) { toast.error("মন্তব্য করতে লগইন করুন"); return; }
    if (trimmed.length > 200) { toast.error("মন্তব্য ২০০ অক্ষরের মধ্যে রাখুন"); return; }
    setSending(true);
    const optimistic: Comment = {
      id: `tmp-${Date.now()}`,
      user_name: user.name || "আমি",
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setComments((c) => [optimistic, ...c]);
    setText("");
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: user.id, user_name: user.name || "আমি", content: trimmed })
      .select("id, user_name, content, created_at")
      .single();
    if (error || !data) {
      setComments((c) => c.filter((x) => x.id !== optimistic.id));
      toast.error("মন্তব্য পাঠানো যায়নি");
      setSending(false);
      return;
    }
    setComments((c) => c.map((x) => (x.id === optimistic.id ? (data as Comment) : x)));
    await supabase.rpc("increment_comments", { post_id: postId });
    onCommentAdded();
    setSending(false);
  };

  const visible = showAll ? comments : comments.slice(0, 3);

  return (
    <div className="border-t border-border pt-3 mt-3 space-y-3">
      {loading ? (
        <p className="text-xs text-muted-foreground">লোড হচ্ছে...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">কোনো মন্তব্য নেই — প্রথম মন্তব্য করুন</p>
      ) : (
        <>
          {visible.map((c) => (
            <div key={c.id} className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                {c.user_name.charAt(0) || "ক"}
              </div>
              <div className="flex-1 bg-muted/60 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground truncate">{c.user_name}</p>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
              </div>
            </div>
          ))}
          {!showAll && comments.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-xs font-semibold text-primary flex items-center gap-1"
            >
              আরো দেখুন <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </>
      )}

      <div className="flex items-center gap-2 pt-1">
        <div className="h-8 w-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {(user?.name || "আ").charAt(0)}
        </div>
        <input
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="মন্তব্য লিখুন..."
          className="flex-1 h-9 px-3 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || sending}
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95"
          aria-label="পাঠান"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
