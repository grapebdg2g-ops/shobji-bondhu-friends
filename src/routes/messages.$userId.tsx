import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  MessageCircle,
  Send,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LazyImage } from "@/components/krishi/lazy-image";
import { useConnectionState } from "@/hooks/use-connections";
import { useDirectConversation } from "@/hooks/use-direct-messages";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";

export const Route = createFileRoute("/messages/$userId")({
  component: DirectMessagePage,
  head: () => ({ meta: [{ title: "চ্যাট — কৃষক বন্ধু" }] }),
});

type ChatProfile = {
  id: string;
  name: string;
  avatar_url: string | null;
  district: string | null;
  upazila: string | null;
};

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("bn-BD", { hour: "numeric", minute: "2-digit" });
}

function DirectMessagePage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { userId } = Route.useParams();
  const { state: connectionState, loading: connectionLoading } = useConnectionState(userId);
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["message-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, avatar_url, district, upazila")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as ChatProfile | null;
    },
    enabled: Boolean(userId),
  });
  const conversation = useDirectConversation(userId);
  const { setTyping } = conversation;
  const [draft, setDraft] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);

  const canMessage = connectionState === "accepted";
  const busy = profileLoading || connectionLoading || conversation.loading;
  const lastMessageId = conversation.messages[conversation.messages.length - 1]?.id;

  useEffect(() => {
    if (!draft.trim()) {
      setTyping(false);
      return;
    }
    const timer = window.setTimeout(() => setTyping(true), 220);
    return () => window.clearTimeout(timer);
  }, [draft, setTyping]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const frame = requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [lastMessageId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canMessage) {
      toast.info("মেসেজ পাঠাতে আগে সংযোগ গ্রহণ করুন");
      return;
    }
    const text = draft.trim();
    if (!text) return;
    try {
      await conversation.sendMessage(text);
      setDraft("");
      setTyping(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "মেসেজ পাঠানো যায়নি");
    }
  };

  if (!profile && !profileLoading) {
    return (
      <main className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-[#F0FFF4] px-6 pb-6 text-center">
        <div>
          <MessageCircle className="mx-auto h-10 w-10 text-[#1877F2]" />
          <h1 className="mt-3 font-black">কৃষক খুঁজে পাওয়া যায়নি</h1>
          <Link
            to="/messages"
            className="mt-4 inline-flex rounded-full bg-[#1877F2] px-4 py-2 text-sm font-bold text-white"
          >
            মেসেজে ফিরুন
          </Link>
        </div>
      </main>
    );
  }

  const displayName = profile?.name || "কৃষক";
  return (
    <main className="flex min-h-[calc(100dvh-4rem)] flex-col bg-[#F0FFF4]">
      <header className="flex items-center gap-3 border-b border-[#E4E6EB] bg-white px-3 py-2.5 shadow-sm sm:px-5">
        <button
          type="button"
          onClick={() => navigate({ to: "/messages" })}
          aria-label="মেসেজ তালিকায় ফিরুন"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-[#F0F2F5]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Link
          to="/u/$userId"
          params={{ userId }}
          className="flex min-w-0 flex-1 items-center gap-3"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#E7F3FF] text-lg font-black text-[#1877F2]">
            {profile?.avatar_url ? (
              <LazyImage
                src={profile.avatar_url}
                alt={displayName}
                wrapperClassName="h-full w-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {displayName.charAt(0)}
              </div>
            )}
            {conversation.peerOnline && (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#31A24C]" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-black text-[#1C1E21]">{displayName}</h1>
            <p className="truncate text-[11px] text-[#65676B]">
              {conversation.peerTyping
                ? "লিখছেন..."
                : conversation.peerOnline
                  ? "অনলাইনে আছেন"
                  : profile?.district || "কৃষক"}
            </p>
          </div>
        </Link>
        <Link
          to="/u/$userId"
          params={{ userId }}
          aria-label="প্রোফাইল দেখুন"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]"
        >
          <UserRound className="h-5 w-5" />
        </Link>
      </header>

      <div
        ref={viewportRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-8 sm:px-5"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-2">
          <div className="mb-3 text-center text-[11px] text-[#65676B]">
            আপনি ও {displayName} এখন সরাসরি মেসেজ করতে পারবেন
          </div>
          {busy ? (
            <div className="py-10 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#1877F2]" />
            </div>
          ) : conversation.messages.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#65676B]">
              প্রথম মেসেজটি আপনিই পাঠান
            </div>
          ) : (
            conversation.messages.map((message) => {
              const mine = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm ${mine ? "rounded-br-md bg-[#1877F2] text-white" : "rounded-bl-md border border-[#E4E6EB] bg-white text-[#1C1E21]"}`}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.body}
                    </p>
                    <div
                      className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/75" : "text-[#65676B]"}`}
                    >
                      <span>{formatTime(message.created_at)}</span>
                      {mine &&
                        (message.read_at ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {conversation.peerTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md border border-[#E4E6EB] bg-white px-4 py-2 text-xs text-[#65676B]">
                লিখছেন...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#E4E6EB] bg-white px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:px-5">
        {canMessage ? (
          <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl items-center gap-2">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              placeholder="মেসেজ লিখুন..."
              className="h-11 min-w-0 flex-1 rounded-full bg-[#F0F2F5] px-4 text-sm outline-none focus:ring-2 focus:ring-[#1877F2]/30"
            />
            <button
              type="submit"
              disabled={!draft.trim() || conversation.sending}
              aria-label="মেসেজ পাঠান"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-white disabled:opacity-50"
            >
              {conversation.sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        ) : (
          <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-xl bg-[#F0F2F5] px-4 py-3 text-center text-xs font-semibold text-[#65676B]">
            {connectionLoading
              ? "সংযোগ যাচাই হচ্ছে..."
              : "মেসেজ করতে আগে এই কৃষকের সঙ্গে সংযোগ গ্রহণ করুন"}
          </div>
        )}
      </div>
    </main>
  );
}
