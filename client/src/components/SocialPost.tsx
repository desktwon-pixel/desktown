import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SocialPostProps {
  id: string;
  author: { name: string; avatar?: string | null; department?: string };
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  compact?: boolean;
}

export function SocialPost({ id, author, content, likes: initialLikes, comments, timestamp, compact }: SocialPostProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <Card data-testid={`card-post-${id}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <UserAvatar name={author.name} avatar={author.avatar} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{author.name}</span>
              {author.department && (
                <span className="text-xs text-muted-foreground">{author.department}</span>
              )}
              <span className="text-xs text-muted-foreground">{timestamp}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{content}</p>
            <div className="flex items-center gap-1 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1", liked && "text-red-500")}
                onClick={handleLike}
                data-testid={`button-like-${id}`}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                <span className="text-xs">{likes}</span>
              </Button>
              <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-comment-${id}`}>
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{comments}</span>
              </Button>
              <Button variant="ghost" size="sm" data-testid={`button-share-${id}`}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
