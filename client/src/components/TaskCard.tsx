import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./UserAvatar";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  id: string;
  title: string;
  assignee: { name: string; avatar?: string | null };
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed";
  dueDate: string;
  onToggle?: (id: string) => void;
}

const priorityStyles = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export function TaskCard({ id, title, assignee, priority, status, dueDate, onToggle }: TaskCardProps) {
  const isCompleted = status === "completed";

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-md border bg-card hover-elevate",
        isCompleted && "opacity-60"
      )}
      data-testid={`card-task-${id}`}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle?.(id)}
        data-testid={`checkbox-task-${id}`}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", isCompleted && "line-through text-muted-foreground")}>
          {title}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{dueDate}</span>
          </div>
          <Badge variant="secondary" className={cn("text-xs", priorityStyles[priority])}>
            {priority}
          </Badge>
        </div>
      </div>
      <UserAvatar name={assignee.name} avatar={assignee.avatar} size="sm" />
    </div>
  );
}
