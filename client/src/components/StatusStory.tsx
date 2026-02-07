import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/utils";

interface StatusStoryProps {
  user: { name: string; avatar?: string | null };
  isViewed?: boolean;
  isOwn?: boolean;
  onClick?: () => void;
}

export function StatusStory({ user, isViewed = false, isOwn = false, onClick }: StatusStoryProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2 hover-elevate rounded-md"
      data-testid={`button-story-${user.name.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div
        className={cn(
          "p-0.5 rounded-full",
          isViewed ? "bg-muted" : "bg-gradient-to-tr from-primary to-blue-400"
        )}
      >
        <div className="p-0.5 rounded-full bg-background">
          <UserAvatar name={user.name} avatar={user.avatar} size="lg" />
        </div>
      </div>
      <span className="text-xs text-center truncate w-16">
        {isOwn ? "Your Story" : user.name.split(" ")[0]}
      </span>
    </button>
  );
}

interface StatusStoriesRowProps {
  stories: Array<{
    id: string;
    user: { name: string; avatar?: string | null };
    isViewed?: boolean;
  }>;
  currentUser?: { name: string; avatar?: string | null };
  onStoryClick?: (id: string) => void;
  onAddStory?: () => void;
}

export function StatusStoriesRow({ stories, currentUser, onStoryClick, onAddStory }: StatusStoriesRowProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {currentUser && (
        <StatusStory user={currentUser} isOwn onClick={onAddStory} />
      )}
      {stories.map((story) => (
        <StatusStory
          key={story.id}
          user={story.user}
          isViewed={story.isViewed}
          onClick={() => onStoryClick?.(story.id)}
        />
      ))}
    </div>
  );
}
