import type { Metadata } from "next";

import { ChatPanel } from "@/features/chat/chat-panel";

export const metadata: Metadata = {
  title: "AI Chat",
  description: "A private conversation that stays on this device.",
};

export default function ChatPage() {
  return <ChatPanel />;
}
