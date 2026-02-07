import { cn } from "@/lib/utils";
import { Bell, Calendar, Video, X, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface NotificationItemProps {
  id: number;
  type: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  data?: any;
  onClick?: () => void;
}

export function NotificationItem({ id, type, title, message, time, isRead, data, onClick }: NotificationItemProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleJoin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data?.meetingId) {
      setLocation(`/video-room/${data.meetingId}`);
      if (onClick) onClick();
    }
  };

  const markReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    }
  });

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation();
    markReadMutation.mutate();
    toast({
      title: "تم رفض الدعوة",
      description: "تم تجاهل دعوة الاجتماع."
    });
  };

  const getIcon = () => {
    switch (type) {
      case "meeting_invite":
        return <Video className="h-4 w-4 text-violet-400" />;
      case "chat":
        return <MessageSquare className="h-4 w-4 text-green-400" />;
      case "task":
        return <Calendar className="h-4 w-4 text-blue-400" />;
      default:
        return <Bell className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <div
      className={cn(
        "w-full text-left p-3 rounded-md hover-elevate border transition-colors cursor-pointer",
        !isRead ? "bg-primary/5 border-primary/20" : "bg-background border-border/50"
      )}
      onClick={onClick}
      data-testid={`notification-${id}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0 space-y-1">
          <p className={cn("text-sm font-medium leading-none", !isRead && "text-foreground")}>
            {title}
          </p>
          {message && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{message}</p>
          )}

          {type === "meeting_invite" && !isRead && (
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                className="h-7 px-3 text-[10px] gap-1"
                onClick={handleJoin}
                data-testid="button-join-meeting"
              >
                <Video className="h-3 w-3" />
                انضمام الآن
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 px-3 text-[10px] gap-1"
                onClick={handleReject}
                data-testid="button-reject-meeting"
              >
                <X className="h-3 w-3" />
                رفض
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground pt-1">{time}</p>
        </div>
        {!isRead && (
          <span className="mt-1.5 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
        )}
      </div>
    </div>
  );
}
