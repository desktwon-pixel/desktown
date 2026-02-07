import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { Video, Clock, MapPin, Trash2 } from "lucide-react";

interface MeetingCardProps {
  id: string;
  title: string;
  time: string;
  date: string;
  participants: Array<{ name: string; avatar?: string | null }>;
  room: string;
  onJoin?: () => void;
  onDelete?: () => void;
}

export function MeetingCard({ id, title, time, date, participants, room, onJoin, onDelete }: MeetingCardProps) {
  return (
    <Card data-testid={`card-meeting-${id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-medium">{title}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {room}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex -space-x-2">
                {participants.slice(0, 3).map((p, i) => (
                  <UserAvatar
                    key={i}
                    name={p.name}
                    avatar={p.avatar}
                    size="sm"
                    className="ring-2 ring-background"
                  />
                ))}
              </div>
              {participants.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{participants.length - 3} more
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={onJoin} data-testid={`button-join-meeting-${id}`}>
              <Video className="h-4 w-4 mr-1" />
              Join
            </Button>
            {onDelete && (
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={onDelete} 
                data-testid={`button-delete-meeting-${id}`}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
