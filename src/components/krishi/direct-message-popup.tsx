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

  return (
    <BottomSheet
      open
      onClose={onClose}
      title="দ্রুত মেসেজ"
      className="mx-auto max-w-xl px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-[#F0F2F5] p-3">
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#E7F3FF] text-lg font-black text-[#1877F2]">
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
          <p className="truncate text-sm font-black text-[#1C1E21]">{recipient.name || "কৃষক"}</p>
          <p className="truncate text-[11px] text-[#65676B]">
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#1877F2]"
        >
          <UserRound className="h-4 w-4" />
        </Link>
      </div>

      {canMessage ? (
        <>
          <div className="mt-3 max-h-52 min-h-16 space-y-2 overflow-y-auto rounded-2xl border border-[#E4E6EB] bg-[#F8FAFC] p-3">
            {conversation.loading ? (
              <div className="flex items-center justify-center py-5 text-[#1877F2]">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : recentMessages.length === 0 ? (
              <div className="py-5 text-center text-xs text-[#65676B]">
                <MessageCircle className="mx-auto mb-2 h-5 w-5 text-[#1877F2]" />
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
                      className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs ${mine ? "rounded-br-md bg-[#1877F2] text-white" : "rounded-bl-md bg-white text-[#1C1E21] shadow-sm"}`}
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
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={2000}
              placeholder="মেসেজ লিখুন..."
              className="h-11 min-w-0 flex-1 rounded-full bg-[#F0F2F5] px-4 text-sm text-[#1C1E21] outline-none focus:ring-2 focus:ring-[#1877F2]/30"
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
          <Link
            to="/messages/$userId"
            params={{ userId: recipient.id }}
            onClick={onClose}
            className="mt-3 flex items-center justify-center text-xs font-bold text-[#1877F2]"
          >
            পুরো চ্যাট খুলুন
          </Link>
        </>
      ) : (
        <div className="mt-3 rounded-2xl bg-[#FFF7E6] px-4 py-5 text-center text-xs font-semibold leading-relaxed text-[#8A5A00]">
          এই কৃষকের সঙ্গে মেসেজ করতে আগে সংযোগ গ্রহণ করতে হবে।
        </div>
      )}
    </BottomSheet>
  );
}
