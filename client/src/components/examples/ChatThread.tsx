import { useState } from "react";
import { ChatThreadItem } from "../ChatThread";

const mockThreads = [
  { id: "1", name: "Engineering Team", lastMessage: "Great work on the release!", participants: [{ name: "Sarah Chen" }, { name: "David Kim" }], unread: 2, timestamp: "10 min ago" },
  { id: "2", name: "Product Discussion", lastMessage: "Let's schedule a sync", participants: [{ name: "James Wilson" }, { name: "Maria Garcia" }], unread: 0, timestamp: "1 hour ago" },
  { id: "3", name: "All Hands", lastMessage: "Reminder: Town hall tomorrow", participants: [{ name: "Emma Thompson" }, { name: "Sarah Chen" }, { name: "James Wilson" }], unread: 5, timestamp: "3 hours ago" },
];

export default function ChatThreadExample() {
  const [activeId, setActiveId] = useState("1");

  return (
    <div className="w-80 space-y-1 p-2 bg-sidebar rounded-md">
      {mockThreads.map(thread => (
        <ChatThreadItem
          key={thread.id}
          {...thread}
          isActive={activeId === thread.id}
          onClick={() => setActiveId(thread.id)}
        />
      ))}
    </div>
  );
}
