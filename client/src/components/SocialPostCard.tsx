import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./UserAvatar";
import { Heart, MessageCircle, Share2, Send, ChevronDown, ChevronUp, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Post, User, PostComment } from "@shared/schema";

interface SocialPostCardProps {
  post: Post;
  author: User | null | undefined;
  currentUserId?: string;
}

export function SocialPostCard({ post, author, currentUserId }: SocialPostCardProps) {
  const { toast } = useToast();
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [likesCount, setLikesCount] = useState(0);

  const { data: comments = [], isLoading: commentsLoading } = useQuery<PostComment[]>({
    queryKey: ["/api/posts", post.id, "comments"],
    enabled: showComments,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (liked) {
        return apiRequest("DELETE", `/api/posts/${post.id}/like`);
      } else {
        return apiRequest("POST", `/api/posts/${post.id}/like`);
      }
    },
    onMutate: () => {
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
    },
    onError: () => {
      setLiked(!liked);
      setLikesCount(prev => liked ? prev + 1 : prev - 1);
      toast({ title: "Error", description: "Failed to update like.", variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      setNewComment("");
      toast({ title: "Comment added", description: "Your comment was posted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add comment.", variant: "destructive" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/posts/${post.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Deleted", description: "Post has been removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete post.", variant: "destructive" });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      return apiRequest("DELETE", `/api/posts/${post.id}/comments/${commentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", post.id, "comments"] });
      toast({ title: "Deleted", description: "Comment removed." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete comment.", variant: "destructive" });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment);
    }
  };

  const getUserById = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  const authorName = author 
    ? `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email || 'Unknown'
    : 'Unknown';

  const formatTimestamp = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Card data-testid={`card-post-${post.id}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <UserAvatar name={authorName} avatar={author?.profileImageUrl} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium" data-testid={`text-author-${post.id}`}>{authorName}</span>
                {author?.department && (
                  <span className="text-xs text-muted-foreground">{author.department}</span>
                )}
                <span className="text-xs text-muted-foreground">{formatTimestamp(post.createdAt)}</span>
              </div>
              {currentUserId === post.authorId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-post-menu-${post.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deletePostMutation.mutate()}
                      disabled={deletePostMutation.isPending}
                      data-testid={`button-delete-post-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {post.content && (
              <p className="mt-2 text-sm leading-relaxed" data-testid={`text-content-${post.id}`}>{post.content}</p>
            )}
            
            {post.mediaUrl && (
              <div className="mt-3 rounded-lg overflow-hidden bg-muted">
                {post.mediaType === "video" ? (
                  <video 
                    src={post.mediaUrl} 
                    controls 
                    className="max-h-96 w-full object-contain"
                    data-testid={`video-media-${post.id}`}
                  />
                ) : (
                  <img 
                    src={post.mediaUrl} 
                    alt="Post media" 
                    className="max-h-96 w-full object-contain"
                    data-testid={`img-media-${post.id}`}
                  />
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1 mt-3">
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1", liked && "text-red-500")}
                onClick={handleLike}
                disabled={likeMutation.isPending}
                data-testid={`button-like-${post.id}`}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current")} />
                <span className="text-xs">{likesCount}</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1" 
                onClick={() => setShowComments(!showComments)}
                data-testid={`button-toggle-comments-${post.id}`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{comments.length || 0}</span>
                {showComments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
              <Button variant="ghost" size="sm" data-testid={`button-share-${post.id}`}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            
            {showComments && (
              <div className="mt-4 space-y-3 border-t pt-3">
                {currentUserId && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleComment();
                        }
                      }}
                      className="flex-1"
                      data-testid={`input-comment-${post.id}`}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleComment}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      data-testid={`button-submit-comment-${post.id}`}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {commentsLoading ? (
                  <div className="text-sm text-muted-foreground">Loading comments...</div>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => {
                      const commentAuthor = getUserById(comment.authorId);
                      const commentAuthorName = commentAuthor 
                        ? `${commentAuthor.firstName || ''} ${commentAuthor.lastName || ''}`.trim() || commentAuthor.email || 'Unknown'
                        : 'Unknown';
                      return (
                        <div key={comment.id} className="flex gap-2 group" data-testid={`comment-${comment.id}`}>
                          <UserAvatar 
                            name={commentAuthorName} 
                            avatar={commentAuthor?.profileImageUrl} 
                            size="sm" 
                          />
                          <div className="flex-1 bg-muted rounded-lg p-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{commentAuthorName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(comment.createdAt)}
                                </span>
                              </div>
                              {currentUserId === comment.authorId && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => deleteCommentMutation.mutate(comment.id)}
                                  disabled={deleteCommentMutation.isPending}
                                  data-testid={`button-delete-comment-${comment.id}`}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm mt-1">{comment.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
