import { createFileRoute } from "@tanstack/react-router";
import { AiChatView } from "@/components/krishi/ai-chat-view";

export const Route = createFileRoute("/ai-bondhu/chat/$sessionId")({
  component: RouteComp,
  head: () => ({ meta: [{ title: "কৃষি বন্ধু — সংরক্ষিত চ্যাট" }] }),
});

function RouteComp() {
  const { sessionId } = Route.useParams();
  return <AiChatView sessionId={sessionId} />;
}
