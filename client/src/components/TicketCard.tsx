import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface TicketCardProps {
  id: string;
  title: string;
  reporter: { name: string; avatar?: string | null };
  assignee?: { name: string; avatar?: string | null } | null;
  priority: "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved" | "closed";
  onClick?: () => void;
}

const priorityStyles = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const statusStyles = {
  open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  in_progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export function TicketCard({ id, title, reporter, assignee, priority, status, onClick }: TicketCardProps) {
  return (
    <Card
      className="hover-elevate cursor-pointer"
      onClick={onClick}
      data-testid={`card-ticket-${id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-muted-foreground">{id}</span>
              <Badge variant="secondary" className={cn("text-xs", statusStyles[status])}>
                {status.replace("_", " ")}
              </Badge>
            </div>
            <p className="font-medium truncate">{title}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className={cn("text-xs", priorityStyles[priority])}>
                {priority}
              </Badge>
              <span className="text-xs text-muted-foreground">by {reporter.name}</span>
            </div>
          </div>
          {assignee ? (
            <UserAvatar name={assignee.name} avatar={assignee.avatar} size="sm" />
          ) : (
            <span className="text-xs text-muted-foreground italic">Unassigned</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
