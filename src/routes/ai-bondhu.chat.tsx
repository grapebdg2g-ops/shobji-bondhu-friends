import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { chatWithAI } from "@/lib/chat.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/ai-bondhu/chat")({
  component: ChatPage,
  head: () => ({ meta: [{ title: "বলো বন্ধু — কৃষিবন্ধু" }] }),
});

type Msg = { role: "user" | "assistant"; content: string };

function ChatPage() {
  const navigate = useNavigate();
  const chat = useServerFn(chatWithAI);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "আসসালামু আলাইকুম! আমি বলো বন্ধু — আপনার কৃষি বিষয়ক যেকোনো প্রশ্ন করুন।" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await chat({ data: { messages: next.slice(-10) } });
      setMessages((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "ত্রুটি ঘটেছে";
      toast.error(msg);
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F0FFF4] md:max-w-[560px] md:mx-auto">
      <header className="px-4 py-3 bg-white border-b flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate({ to: "/ai-bondhu" })} className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-bold">বলো বন্ধু</h1>
          <p className="text-[11px] text-gray-500">AI কৃষি সহকারী</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "bg-[#2D6A4F] text-white" : "bg-white border border-gray-100 text-gray-800"}`}>
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

      <div className="fixed bottom-0 left-0 right-0 md:max-w-[560px] md:mx-auto bg-white border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="আপনার প্রশ্ন লিখুন..."
          className="flex-1 h-11 px-4 rounded-full bg-gray-100 text-sm outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
        />
        <button onClick={send} disabled={loading || !input.trim()} className="h-11 w-11 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center disabled:opacity-50">
          <Send className="h-5 w-5" />
        </button>
      </div>
    </main>
  );
}
