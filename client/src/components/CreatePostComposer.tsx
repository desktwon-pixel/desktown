import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "./UserAvatar";
import { Image, Smile, Send } from "lucide-react";

interface CreatePostComposerProps {
  user: { name: string; avatar?: string | null };
  onPost?: (content: string) => void;
}

export function CreatePostComposer({ user, onPost }: CreatePostComposerProps) {
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (content.trim()) {
      onPost?.(content);
      setContent("");
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <UserAvatar name={user.name} avatar={user.avatar} size="md" />
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none border-0 text-base focus-visible:ring-0 min-h-[60px]"
              data-testid="textarea-post"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" data-testid="button-attach-image">
                  <Image className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" data-testid="button-add-emoji">
                  <Smile className="h-5 w-5 text-muted-foreground" />
                </Button>
              </div>
              <Button
                size="sm"
                disabled={!content.trim()}
                onClick={handleSubmit}
                data-testid="button-submit-post"
              >
                <Send className="h-4 w-4 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
