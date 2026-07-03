import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { chatWithAI, suggestFollowUps } from "@/lib/chat.functions";
import { useUser } from "@/contexts/user-context";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-bondhu/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "কৃষি বন্ধু — AI সহকারী" }] }),
});

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const chat = useServerFn(chatWithAI);
  const suggest = useServerFn(suggestFollowUps);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "আসসালামু আলাইকুম! আমি কৃষি বন্ধু — আপনার কৃষি বিষয়ক যেকোনো প্রশ্ন করুন।" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const sendText = async (text: string) => {
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSuggestions([]);
    setLoading(true);
    try {
      const userContext = user
        ? {
            name: user.name,
            district: user.district ?? undefined,
            upazila: user.upazila ?? undefined,
            crops: user.crops,
          }
        : undefined;
      const res = await chat({ data: { messages: next.slice(-10), userContext } });
      const updated: Msg[] = [...next, { role: "assistant", content: res.reply }];
      setMessages(updated);
      // Fire-and-forget suggestion fetch
      suggest({ data: { messages: updated.slice(-6) } })
        .then((s) => setSuggestions(s.suggestions ?? []))
        .catch(() => setSuggestions([]));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ত্রুটি ঘটেছে";
      toast.error(msg);
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendText(input.trim());

  return (
    <main className="min-h-[100dvh] flex flex-col bg-[#F0FFF4] w-full md:max-w-[640px] md:mx-auto md:border-x md:border-gray-100">
      <header className="px-3 sm:px-4 py-2.5 sm:py-3 bg-white border-b flex items-center gap-2 sm:gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate({ to: "/ai-bondhu" })}
          aria-label="ফিরে যান"
          className="h-9 w-9 shrink-0 rounded-full flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="font-bold text-sm sm:text-base truncate">কৃষি বন্ধু</h1>
          <p className="text-[10px] sm:text-[11px] text-gray-500 truncate">Gemini AI কৃষি সহকারী</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-2.5 sm:space-y-3 pb-56 md:pb-40">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3.5 sm:px-4 py-2 sm:py-2.5 text-[13.5px] sm:text-sm leading-relaxed whitespace-pre-wrap break-words ${
                m.role === "user" ? "bg-[#2D6A4F] text-white" : "bg-white border border-gray-100 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div
        className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-[640px] bg-white border-t border-gray-200 z-20"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {suggestions.length > 0 && !loading && (
          <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendText(s)}
                className="shrink-0 text-[11px] sm:text-xs px-3 py-1.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] border border-[#2D6A4F]/20 hover:bg-[#2D6A4F]/20 active:scale-95 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="p-2.5 sm:p-3 flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="আপনার প্রশ্ন লিখুন..."
            enterKeyHint="send"
            className="flex-1 min-w-0 h-11 px-4 rounded-full bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            aria-label="পাঠান"
            className="h-11 w-11 shrink-0 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
