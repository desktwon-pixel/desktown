import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MapPin, Briefcase, DollarSign, Pencil } from "lucide-react";

interface JobPostingCardProps {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  salary: string;
  postedDays: number;
  isPublished: boolean;
  isEditable?: boolean;
  onTogglePublish?: (id: string, published: boolean) => void;
  onEdit?: (id: string) => void;
}

export function JobPostingCard({
  id,
  title,
  department,
  location,
  type,
  salary,
  postedDays,
  isPublished,
  isEditable = false,
  onTogglePublish,
  onEdit,
}: JobPostingCardProps) {
  return (
    <Card data-testid={`card-job-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">{title}</h3>
              <Badge variant="secondary">{department}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                {type}
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {salary}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Posted {postedDays} {postedDays === 1 ? "day" : "days"} ago
            </p>
          </div>
          {isEditable && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {isPublished ? "Published" : "Draft"}
                </span>
                <Switch
                  checked={isPublished}
                  onCheckedChange={(checked) => onTogglePublish?.(id, checked)}
                  data-testid={`switch-publish-${id}`}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit?.(id)}
                data-testid={`button-edit-job-${id}`}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
