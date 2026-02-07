import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "./UserAvatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, 
  MessageCircle, 
  UserPlus, 
  UserCheck, 
  Eye, 
  Send,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface StatusAuthor {
  id: string;
  name: string;
  avatar: string | null;
}

interface StatusOffice {
  id: number;
  name: string;
  logo: string | null;
}

interface StatusData {
  id: number;
  authorId: string;
  officeId: number | null;
  mediaUrl: string;
  mediaType: string | null;
  caption: string | null;
  expiresAt: string;
  viewCount: number | null;
  createdAt: string | null;
  author: StatusAuthor | null;
  office: StatusOffice | null;
  replyCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  isFollowingOffice?: boolean;
}

interface StatusReply {
  id: number;
  statusId: number;
  senderId: string;
  message: string;
  isRead: boolean | null;
  createdAt: string | null;
  sender: StatusAuthor | null;
}

interface StatusViewerProps {
  statuses: StatusData[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export function StatusViewer({ 
  statuses, 
  initialIndex = 0, 
  open, 
  onClose,
  currentUserId 
}: StatusViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showReplies, setShowReplies] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const STORY_DURATION = 10000;
  
  const currentStatus = statuses[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const { data: statusDetail, refetch: refetchStatusDetail } = useQuery<StatusData>({
    queryKey: ['/api/statuses', currentStatus?.id],
    enabled: open && !!currentStatus?.id
  });

  useEffect(() => {
    if (open && currentStatus?.id) {
      refetchStatusDetail();
    }
  }, [open, currentStatus?.id]);

  const activeStatus = statusDetail ?? currentStatus;

  useEffect(() => {
    if (!open || isPaused || showReplies) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      return;
    }

    setProgress(0);
    const startTime = Date.now();
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, open, isPaused, showReplies]);

  const { data: replies = [], refetch: refetchReplies } = useQuery<StatusReply[]>({
    queryKey: ['/api/statuses', activeStatus?.id, 'replies'],
    enabled: open && !!activeStatus && showReplies
  });

  const { data: followStatus, refetch: refetchFollowStatus } = useQuery({
    queryKey: ['/api/offices', activeStatus?.office?.id, 'follow'],
    enabled: open && !!activeStatus?.office?.id
  });

  const followMutation = useMutation({
    mutationFn: async (officeId: number) => {
      return apiRequest('POST', `/api/offices/${officeId}/follow`);
    },
    onSuccess: () => {
      if (activeStatus?.office?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/offices', activeStatus.office.id, 'follow'] 
        });
        queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/statuses', activeStatus.id] });
      }
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: async (officeId: number) => {
      return apiRequest('DELETE', `/api/offices/${officeId}/follow`);
    },
    onSuccess: () => {
      if (activeStatus?.office?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/offices', activeStatus.office.id, 'follow'] 
        });
        queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
        queryClient.invalidateQueries({ queryKey: ['/api/statuses', activeStatus.id] });
      }
    }
  });

  const replyMutation = useMutation({
    mutationFn: async ({ statusId, message }: { statusId: number; message: string }) => {
      return apiRequest('POST', `/api/statuses/${statusId}/replies`, { message });
    },
    onSuccess: () => {
      setReplyMessage("");
      refetchReplies();
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      if (activeStatus?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/statuses', activeStatus.id] });
      }
    }
  });

  const likeMutation = useMutation({
    mutationFn: async (statusId: number) => {
      return apiRequest('POST', `/api/statuses/${statusId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      if (activeStatus?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/statuses', activeStatus.id] });
      }
    }
  });

  const unlikeMutation = useMutation({
    mutationFn: async (statusId: number) => {
      return apiRequest('DELETE', `/api/statuses/${statusId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statuses'] });
      if (activeStatus?.id) {
        queryClient.invalidateQueries({ queryKey: ['/api/statuses', activeStatus.id] });
      }
    }
  });

  const handleLikeToggle = () => {
    if (!activeStatus) return;
    if (activeStatus.isLiked) {
      unlikeMutation.mutate(activeStatus.id);
    } else {
      likeMutation.mutate(activeStatus.id);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handleFollowToggle = () => {
    if (!activeStatus?.office?.id) return;
    
    const isFollowingOffice = (followStatus as any)?.isFollowing ?? activeStatus.isFollowingOffice;
    
    if (isFollowingOffice) {
      unfollowMutation.mutate(activeStatus.office.id);
    } else {
      followMutation.mutate(activeStatus.office.id);
    }
  };

  const handleSendReply = () => {
    if (!replyMessage.trim() || !activeStatus) return;
    replyMutation.mutate({ 
      statusId: activeStatus.id, 
      message: replyMessage.trim() 
    });
  };

  const isFollowing = (followStatus as any)?.isFollowing ?? activeStatus?.isFollowingOffice;
  const isOwnStatus = activeStatus?.authorId === currentUserId;

  if (!activeStatus) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full h-[90vh] max-h-[800px] p-0 bg-black border-none overflow-hidden">
        <DialogTitle className="sr-only">View Status</DialogTitle>
        
        <div className="relative w-full h-full flex flex-col">
          <div className="absolute top-2 left-2 right-2 z-20 flex gap-1">
            {statuses.map((_, idx) => (
              <div 
                key={idx}
                className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
              >
                <div 
                  className={cn(
                    "h-full bg-white transition-all duration-100",
                    idx < currentIndex ? "w-full" : idx === currentIndex ? "" : "w-0"
                  )}
                  style={{ 
                    width: idx === currentIndex ? `${progress}%` : undefined 
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-6 left-2 right-2 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserAvatar 
                name={activeStatus.author?.name || "Unknown"} 
                avatar={activeStatus.author?.avatar}
                size="md"
              />
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">
                  {activeStatus.author?.name || "Unknown"}
                </span>
                <span className="text-white/60 text-xs">
                  {activeStatus.createdAt && formatDistanceToNow(new Date(activeStatus.createdAt), { 
                    addSuffix: true,
                    locale: ar 
                  })}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {activeStatus.office && !isOwnStatus && (
                <Button
                  size="sm"
                  variant={isFollowing ? "secondary" : "default"}
                  className={cn(
                    "h-7 text-xs gap-1",
                    isFollowing 
                      ? "bg-white/20 hover:bg-white/30 text-white" 
                      : "bg-primary hover:bg-primary/90"
                  )}
                  onClick={handleFollowToggle}
                  disabled={followMutation.isPending || unfollowMutation.isPending}
                  data-testid="button-follow-office"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      متابَع
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      متابعة
                    </>
                  )}
                </Button>
              )}
              
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsPaused(!isPaused)}
                data-testid="button-pause-play"
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={onClose}
                data-testid="button-close-status"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div 
            className="flex-1 w-full bg-black relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              if (x < rect.width / 3) {
                handlePrevious();
              } else if (x > (rect.width * 2) / 3) {
                handleNext();
              }
            }}
          >
            {activeStatus.mediaType === "video" ? (
              <video
                src={activeStatus.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={activeStatus.mediaUrl}
                alt=""
                className="w-full h-full object-contain"
              />
            )}
            
            {activeStatus.caption && (
              <div className="absolute bottom-24 left-4 right-4 text-center">
                <p className="text-white text-lg font-medium drop-shadow-lg bg-black/30 rounded-lg px-4 py-2">
                  {activeStatus.caption}
                </p>
              </div>
            )}

            {currentIndex > 0 && (
              <button
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white"
                onClick={handlePrevious}
                data-testid="button-previous-status"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            {currentIndex < statuses.length - 1 && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-white/50 hover:text-white"
                onClick={handleNext}
                data-testid="button-next-status"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 p-3 bg-gradient-to-t from-black/80 to-transparent">
            {isOwnStatus ? (
              <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{activeStatus.viewCount || 0} مشاهدة</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  <span>{activeStatus.likeCount || 0} إعجاب</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{activeStatus.replyCount || 0} رد</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 shrink-0 transition-colors",
                    activeStatus.isLiked 
                      ? "text-red-500 hover:bg-red-500/20" 
                      : "text-white hover:bg-white/20"
                  )}
                  onClick={handleLikeToggle}
                  disabled={likeMutation.isPending || unlikeMutation.isPending}
                  data-testid="button-like-status"
                >
                  <Heart className={cn("w-5 h-5", activeStatus.isLiked && "fill-current")} />
                </Button>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 text-white hover:bg-white/20 shrink-0",
                    showReplies && "bg-white/20"
                  )}
                  onClick={() => setShowReplies(!showReplies)}
                  data-testid="button-toggle-replies"
                >
                  <MessageCircle className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
                  <Input
                    type="text"
                    placeholder="رد على الحالة..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0 h-8"
                    data-testid="input-reply-message"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || replyMutation.isPending}
                    data-testid="button-send-reply"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {showReplies && (
            <div className="absolute bottom-16 left-0 right-0 z-30 bg-black/95 rounded-t-2xl max-h-[50%] animate-in slide-in-from-bottom">
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">الردود ({replies.length})</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white/60 hover:text-white"
                    onClick={() => setShowReplies(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="h-[200px] p-4">
                {replies.length === 0 ? (
                  <p className="text-white/50 text-center text-sm py-4">
                    لا توجد ردود بعد
                  </p>
                ) : (
                  <div className="space-y-3">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex items-start gap-2">
                        <UserAvatar 
                          name={reply.sender?.name || "Unknown"} 
                          avatar={reply.sender?.avatar}
                          size="sm"
                        />
                        <div className="flex-1 bg-white/10 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-sm font-medium">
                              {reply.sender?.name || "Unknown"}
                            </span>
                            <span className="text-white/40 text-xs">
                              {reply.createdAt && formatDistanceToNow(new Date(reply.createdAt), { 
                                addSuffix: true,
                                locale: ar 
                              })}
                            </span>
                          </div>
                          <p className="text-white/80 text-sm mt-1">{reply.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StatusStoriesRow({ 
  currentUser,
  onAddStory
}: { 
  currentUser?: { id: string; name: string; avatar?: string | null };
  onAddStory?: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  
  const { data: statuses = [], isLoading } = useQuery<StatusData[]>({
    queryKey: ['/api/statuses']
  });

  const groupedStatuses = statuses.reduce<{ [authorId: string]: StatusData[] }>((acc, status) => {
    const key = status.authorId;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(status);
    return acc;
  }, {});

  const authors = Object.keys(groupedStatuses).map(authorId => {
    const authorStatuses = groupedStatuses[authorId];
    const latestStatus = authorStatuses[0];
    return {
      id: authorId,
      name: latestStatus.author?.name || "Unknown",
      avatar: latestStatus.author?.avatar,
      statuses: authorStatuses,
      hasUnviewed: true 
    };
  });

  const handleAuthorClick = (authorId: string) => {
    const authorStatuses = groupedStatuses[authorId];
    if (authorStatuses && authorStatuses.length > 0) {
      const flattenedStatuses = authors.flatMap(a => a.statuses);
      const startIndex = flattenedStatuses.findIndex(s => s.authorId === authorId);
      setSelectedIndex(startIndex);
    }
  };

  const allStatuses = authors.flatMap(a => a.statuses);

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1 p-2 animate-pulse">
            <div className="w-14 h-14 rounded-full bg-muted" />
            <div className="w-12 h-3 rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  const currentUserStatuses = currentUser ? groupedStatuses[currentUser.id] : [];
  const hasOwnStatuses = currentUserStatuses && currentUserStatuses.length > 0;

  const handleOwnStatusClick = () => {
    if (hasOwnStatuses) {
      const flattenedStatuses = authors.flatMap(a => a.statuses);
      const startIndex = flattenedStatuses.findIndex(s => s.authorId === currentUser?.id);
      setSelectedIndex(startIndex >= 0 ? startIndex : 0);
    }
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {currentUser && (
          <>
            <button
              onClick={hasOwnStatuses ? handleOwnStatusClick : onAddStory}
              className="flex flex-col items-center gap-1 p-2 hover-elevate rounded-md"
              data-testid="button-my-story"
            >
              <div className="relative">
                <div className={cn(
                  "p-0.5 rounded-full",
                  hasOwnStatuses 
                    ? "bg-gradient-to-tr from-primary to-blue-400" 
                    : "bg-muted"
                )}>
                  <div className="p-0.5 rounded-full bg-background">
                    <UserAvatar name={currentUser.name} avatar={currentUser.avatar} size="lg" />
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <span className="text-xs font-bold text-primary-foreground">+</span>
                </div>
              </div>
              <span className="text-xs text-center truncate w-16">
                حالتك
              </span>
            </button>
          </>
        )}
        
        {authors.filter(a => a.id !== currentUser?.id).map((author) => (
          <button
            key={author.id}
            onClick={() => handleAuthorClick(author.id)}
            className="flex flex-col items-center gap-1 p-2 hover-elevate rounded-md"
            data-testid={`button-story-${author.id}`}
          >
            <div className={cn(
              "p-0.5 rounded-full",
              author.hasUnviewed 
                ? "bg-gradient-to-tr from-primary to-blue-400" 
                : "bg-muted"
            )}>
              <div className="p-0.5 rounded-full bg-background">
                <UserAvatar name={author.name} avatar={author.avatar} size="lg" />
              </div>
            </div>
            <span className="text-xs text-center truncate w-16">
              {author.name.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>

      <StatusViewer
        statuses={allStatuses}
        initialIndex={selectedIndex ?? 0}
        open={selectedIndex !== null}
        onClose={() => setSelectedIndex(null)}
        currentUserId={currentUser?.id}
      />
    </>
  );
}
