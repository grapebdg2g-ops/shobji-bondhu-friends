import { createFileRoute } from "@tanstack/react-router";
import { AiChatView } from "@/components/krishi/ai-chat-view";

export const Route = createFileRoute("/ai-bondhu/chat/")({
  component: () => <AiChatView />,
  head: () => ({ meta: [{ title: "কৃষি বন্ধু — AI সহকারী" }] }),
});
