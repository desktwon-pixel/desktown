import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  id: string;
  sender: { name: string; avatar?: string | null };
  content: string;
  timestamp: string;
  isOwn?: boolean;
}

export function ChatMessage({ id, sender, content, timestamp, isOwn }: ChatMessageProps) {
  return (
    <div
      className={cn("flex gap-2 max-w-[80%]", isOwn && "ml-auto flex-row-reverse")}
      data-testid={`message-${id}`}
    >
      {!isOwn && <UserAvatar name={sender.name} avatar={sender.avatar} size="sm" />}
      <div>
        <div
          className={cn(
            "px-3 py-2 rounded-lg",
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <p className="text-sm">{content}</p>
        </div>
        <p className={cn("text-xs text-muted-foreground mt-1", isOwn && "text-right")}>
          {timestamp}
        </p>
      </div>
    </div>
  );
}
