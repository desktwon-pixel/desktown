import { UserAvatar } from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatThreadItemProps {
  id: string;
  name: string;
  lastMessage: string;
  participants: Array<{ name: string; avatar?: string | null }>;
  unread: number;
  timestamp: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function ChatThreadItem({
  id,
  name,
  lastMessage,
  participants,
  unread,
  timestamp,
  isActive,
  onClick,
}: ChatThreadItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left rounded-md hover-elevate",
        isActive && "bg-accent"
      )}
      data-testid={`button-chat-thread-${id}`}
    >
      <div className="relative">
        <UserAvatar name={participants[0]?.name || name} size="md" />
        {participants.length > 1 && (
          <span className="absolute -bottom-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-muted text-xs font-medium">
            +{participants.length - 1}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={cn("font-medium truncate", unread > 0 && "text-foreground")}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{timestamp}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className={cn(
            "text-sm truncate",
            unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
            {lastMessage}
          </p>
          {unread > 0 && (
            <Badge className="h-5 min-w-5 px-1.5 text-xs">
              {unread}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}
