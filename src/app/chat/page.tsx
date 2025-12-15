import { ChatInterface } from '@/components/chat-interface';

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.14))] flex-col sm:h-screen">
      <ChatInterface />
    </div>
  );
}
