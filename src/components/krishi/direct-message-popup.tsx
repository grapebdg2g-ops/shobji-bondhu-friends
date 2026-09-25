import { useEffect, useState } from "react";
import { Check, CheckCheck, Loader2, MessageCircle, Send, UserRound } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { BottomSheet } from "@/components/krishi/bottom-sheet";
import { LazyImage } from "@/components/krishi/lazy-image";
import { useDirectConversation } from "@/hooks/use-direct-messages";
import { useUser } from "@/contexts/user-context";

export type DirectMessageRecipient = {
  id: string;
  name: string;
  avatar_url: string | null;
  district?: string | null;
};

export function CompactFriendItem({ friend }: { friend: DirectMessageRecipient }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="group relative min-w-0 text-center">
        <Link
          to="/u/$userId"
          params={{ userId: friend.id }}
          className="flex min-w-0 flex-col items-center"
        >
          <div className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-border bg-muted text-lg font-black text-primary shadow-sm transition group-hover:border-primary sm:h-14 sm:w-14 sm:text-xl">
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
          <p className="mt-1.5 w-full truncate text-[10px] font-bold text-foreground sm:text-xs">
            {friend.name || "কৃষক"}
          </p>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`${friend.name || "কৃষক"} কে মেসেজ করুন`}
          className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition hover:scale-110"
        >
          <MessageCircle className="h-2.5 w-2.5" />
        </button>
      </div>
      <DirectMessagePopup
        recipient={friend}
        open={open}
        onClose={() => setOpen(false)}
        canMessage
      />
    </>
  );
}

export function DirectMessagePopup({
  recipient,
  open,
  onClose,
  canMessage,
}: {
  recipient: DirectMessageRecipient;
  open: boolean;
  onClose: () => void;
  canMessage: boolean;
}) {
  if (!open) return null;
  return (
    <DirectMessagePopupContent recipient={recipient} onClose={onClose} canMessage={canMessage} />
  );
}

function DirectMessagePopupContent({
  recipient,
  onClose,
  canMessage,
}: {
  recipient: DirectMessageRecipient;
  onClose: () => void;
  canMessage: boolean;
}) {
  const { user } = useUser();
  const conversation = useDirectConversation(recipient.id);
  const { setTyping } = conversation;
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!draft.trim()) {
      setTyping(false);
      return;
    }
    const timer = window.setTimeout(() => setTyping(true), 220);
    return () => window.clearTimeout(timer);
  }, [draft, setTyping]);

  const send = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!canMessage || !text || conversation.sending) return;
    try {
      await conversation.sendMessage(text);
      setDraft("");
      setTyping(false);
    } catch {
      // The conversation hook exposes the error state; keep the composer open.
    }
  };

  const recentMessages = conversation.messages.slice(-5);
  const focusComposer = (element: HTMLInputElement) => {
    window.requestAnimationFrame(() => {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  };

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="দ্রুত মেসেজ"
      className="mx-auto max-h-[calc(100dvh-0.5rem)] max-w-xl px-3 pb-2 sm:px-4"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-muted p-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-muted text-lg font-black text-primary">
          {recipient.avatar_url ? (
            <LazyImage
              src={recipient.avatar_url}
              alt={recipient.name}
              wrapperClassName="h-full w-full"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {recipient.name.charAt(0) || "ক"}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-foreground">{recipient.name || "কৃষক"}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {conversation.peerTyping
              ? "লিখছেন..."
              : conversation.peerOnline
                ? "অনলাইনে আছেন"
                : recipient.district || "সংযুক্ত কৃষক"}
          </p>
        </div>
        <Link
          to="/u/$userId"
          params={{ userId: recipient.id }}
          onClick={onClose}
          aria-label="প্রোফাইল দেখুন"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-card text-primary"
        >
          <UserRound className="h-4 w-4" />
        </Link>
      </div>

      {canMessage ? (
        <>
          <div className="mt-3 max-h-[30dvh] min-h-16 space-y-2 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-3 sm:max-h-52">
            {conversation.loading ? (
              <div className="flex items-center justify-center py-5 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="py-5 text-center text-xs text-muted-foreground">
                <MessageCircle className="mx-auto mb-2 h-5 w-5 text-primary" />
                প্রথম মেসেজটি আপনিই পাঠান
              </div>
            ) : (
              recentMessages.map((message) => {
                const mine = message.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs ${mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground shadow-sm"}`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <span className="mt-1 flex items-center justify-end gap-1 text-[9px] opacity-70">
                        {new Date(message.created_at).toLocaleTimeString("bn-BD", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {mine &&
                          (message.read_at ? (
                            <CheckCheck className="h-3 w-3" />
                          ) : (
                            <Check className="h-3 w-3" />
                          ))}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {conversation.error && (
            <p className="mt-2 text-center text-[11px] font-semibold text-red-600">
              মেসেজ সেবা সংযোগ করা যায়নি। আবার চেষ্টা করুন।
            </p>
          )}
          <form onSubmit={send} className="mt-3 flex items-center gap-2">
            <input
              autoFocus
              enterKeyHint="send"
              onFocus={(event) => focusComposer(event.currentTarget)}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              placeholder="মেসেজ লিখুন..."
              className="h-11 min-w-0 flex-1 rounded-full bg-muted px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={!draft.trim() || conversation.sending}
              aria-label="মেসেজ পাঠান"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              {conversation.sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
          <Link
            to="/messages/$userId"
            params={{ userId: recipient.id }}
            onClick={onClose}
            className="mt-3 flex items-center justify-center text-xs font-bold text-primary"
          >
            পুরো চ্যাট খুলুন
          </Link>
        </>
      ) : (
        <div className="mt-3 rounded-2xl bg-muted px-4 py-5 text-center text-xs font-semibold leading-relaxed text-muted-foreground">
          এই কৃষকের সঙ্গে মেসেজ করতে আগে সংযোগ গ্রহণ করতে হবে।
        </div>
      )}
    </BottomSheet>
  );
}
