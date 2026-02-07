import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Service } from "@shared/schema";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { 
  Search, 
  Send, 
  MessageCircle, 
  Loader2,
  Users,
  Plus,
  User as UserIcon,
  MoreVertical,
  Phone,
  Video,
  Check,
  CheckCheck,
  ArrowLeft,
  Mic,
  Image as ImageIcon,
  X,
  Trash2,
  Package,
  Link2,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { ChatThread, Message, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, translations } from "@/lib/i18n";

interface EnhancedThread extends ChatThread {
  lastMessage?: Message;
  unreadCount?: number;
  participants?: User[];
}

export default function Messages() {
  const { language } = useLanguage();
  const t = translations[language];
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const { data: threads = [], isLoading: threadsLoading } = useQuery<EnhancedThread[]>({
    queryKey: ["/api/threads"],
    refetchInterval: 5000,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isOfficeRenter = currentUser?.role === 'office_renter';
  
  const { data: myServices = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
    enabled: isOfficeRenter,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/threads", activeThreadId, "messages"],
    enabled: !!activeThreadId,
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType, mediaUrl }: { content: string; messageType?: string; mediaUrl?: string }) => {
      return await apiRequest("POST", `/api/threads/${activeThreadId}/messages`, { 
        content, 
        messageType: messageType || "text",
        mediaUrl 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", activeThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      setNewMessage("");
    },
  });

  const uploadMedia = async (file: Blob, fileType: string): Promise<string> => {
    console.log("Starting media upload, fileType:", fileType);
    const response = await apiRequest("POST", "/api/upload/media", { fileType });
    const data = await response.json();
    console.log("Got upload URL response:", data);
    const { uploadURL, objectPath } = data;
    
    if (!uploadURL || !objectPath) {
      console.error("Missing uploadURL or objectPath in response");
      throw new Error("Invalid upload response");
    }
    
    console.log("Uploading to:", uploadURL);
    const uploadResponse = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });
    
    console.log("Upload response status:", uploadResponse.status);
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload failed:", errorText);
      throw new Error("Failed to upload file");
    }
    
    console.log("Upload successful, objectPath:", objectPath);
    return objectPath;
  };

  const createDirectChatMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await apiRequest("POST", "/api/threads/direct", { targetUserId });
      return await response.json();
    },
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      setActiveThreadId(data.id);
      setShowNewChat(false);
      toast({ title: "Chat created successfully" });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, participantIds }: { name: string; participantIds: string[] }) => {
      const response = await apiRequest("POST", "/api/threads", { name, participantIds, type: "group" });
      return await response.json();
    },
    onSuccess: (data: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      setActiveThreadId(data.id);
      setShowNewGroup(false);
      setSelectedUsers([]);
      setGroupName("");
      toast({ title: "Group created successfully" });
    },
  });

  const deleteThreadMutation = useMutation({
    mutationFn: async (threadId: number) => {
      return await apiRequest("DELETE", `/api/threads/${threadId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      if (activeThreadId) setActiveThreadId(null);
      toast({ title: "Chat deleted successfully" });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest("DELETE", `/api/threads/${activeThreadId}/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", activeThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      toast({ title: "Message deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete message", variant: "destructive" });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim() && activeThreadId) {
      sendMessageMutation.mutate({ content: newMessage });
    }
  };

  const handleVoiceRecordingComplete = async (audioBlob: Blob) => {
    if (!activeThreadId) return;
    
    setIsUploadingMedia(true);
    try {
      const fileType = audioBlob.type.includes('webm') ? 'webm' : 'ogg';
      const mediaUrl = await uploadMedia(audioBlob, fileType);
      await sendMessageMutation.mutateAsync({ 
        content: "Voice message", 
        messageType: "voice",
        mediaUrl 
      });
      setShowVoiceRecorder(false);
      toast({ title: "Voice message sent" });
    } catch (error) {
      console.error("Error sending voice message:", error);
      toast({ title: "Failed to send voice message", variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeThreadId) return;

    setIsUploadingMedia(true);
    try {
      const fileType = file.name.split('.').pop() || 'jpg';
      const mediaUrl = await uploadMedia(file, fileType);
      await sendMessageMutation.mutateAsync({ 
        content: "[Image]", 
        messageType: "image",
        mediaUrl 
      });
      toast({ title: "Image sent" });
    } catch (error) {
      console.error("Error sending image:", error);
      toast({ title: "Failed to send image", variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeThreadId) return;

    setIsUploadingMedia(true);
    try {
      const fileType = file.name.split('.').pop() || 'mp4';
      const mediaUrl = await uploadMedia(file, fileType);
      await sendMessageMutation.mutateAsync({ 
        content: "[Video]", 
        messageType: "video",
        mediaUrl 
      });
      toast({ title: "Video sent" });
    } catch (error) {
      console.error("Error sending video:", error);
      toast({ title: "Failed to send video", variant: "destructive" });
    } finally {
      setIsUploadingMedia(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleShareService = async (service: Service) => {
    if (!activeThreadId || !service.shareToken) return;
    
    const serviceUrl = `${window.location.origin}/s/${service.shareToken}`;
    const priceInSAR = service.price / 100;
    const messageContent = `📦 ${service.name}\n💰 ${priceInSAR.toFixed(2)} SAR\n🔗 ${serviceUrl}`;
    
    try {
      await sendMessageMutation.mutateAsync({ 
        content: messageContent,
        messageType: "service_link",
      });
      setShowServicePicker(false);
      toast({ title: "Service link shared" });
    } catch {
      toast({ title: "Failed to share service link", variant: "destructive" });
    }
  };

  const getUserById = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  const getOtherParticipant = (thread: EnhancedThread) => {
    if (thread.type !== "direct" || !thread.participants) return null;
    return thread.participants.find(p => p.id !== currentUser?.id);
  };

  const getThreadDisplayName = (thread: EnhancedThread) => {
    if (thread.type === "direct") {
      const otherUser = getOtherParticipant(thread);
      if (otherUser) {
        return `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() || otherUser.email || 'User';
      }
    }
    return thread.name;
  };

  const getThreadAvatar = (thread: EnhancedThread) => {
    if (thread.type === "direct") {
      const otherUser = getOtherParticipant(thread);
      return otherUser?.profileImageUrl || null;
    }
    return thread.avatarUrl || null;
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  const filteredThreads = threads.filter((thread) =>
    getThreadDisplayName(thread).toLowerCase().includes(search.toLowerCase())
  );

  const otherUsers = users.filter(u => u.id !== currentUser?.id);

  const handleCreateGroup = () => {
    if (groupName.trim() && selectedUsers.length > 0) {
      createGroupMutation.mutate({ name: groupName, participantIds: selectedUsers });
    }
  };

  const formatMessageTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: 'short' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <div className={cn(
        "w-full md:w-96 border-r border-white/5 flex flex-col bg-sidebar",
        activeThreadId && "hidden md:flex"
      )}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <h2 className="font-semibold">{t.messages?.title || "Messages"}</h2>
            </div>
            <div className="flex gap-2">
              <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-9 w-9" data-testid="button-new-chat">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.messages?.newChat || "New Chat"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">{t.messages?.selectUser || "Select a user to start a conversation"}</p>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {otherUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => createDirectChatMutation.mutate(user.id)}
                            disabled={createDirectChatMutation.isPending}
                            className="w-full p-3 rounded-xl hover:bg-white/5 text-left transition-colors flex items-center gap-3"
                            data-testid={`button-start-chat-${user.id}`}
                          >
                            <UserAvatar
                              name={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User'}
                              avatar={user.profileImageUrl}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showNewGroup} onOpenChange={setShowNewGroup}>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-9 w-9" data-testid="button-new-group">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t.messages?.createGroup || "Create Group"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">{t.messages?.groupName || "Group Name"}</Label>
                      <Input
                        id="groupName"
                        placeholder={t.messages?.enterGroupName || "Enter group name..."}
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        data-testid="input-group-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t.messages?.selectMembers || "Select Members"}</Label>
                      <ScrollArea className="h-48 border rounded-lg p-2">
                        {otherUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5">
                            <Checkbox
                              id={`user-${user.id}`}
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedUsers([...selectedUsers, user.id]);
                                } else {
                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                }
                              }}
                              data-testid={`checkbox-user-${user.id}`}
                            />
                            <UserAvatar
                              name={`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User'}
                              avatar={user.profileImageUrl}
                              size="sm"
                            />
                            <label htmlFor={`user-${user.id}`} className="flex-1 cursor-pointer">
                              <p className="font-medium text-sm">
                                {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                              </p>
                            </label>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                    <Button
                      onClick={handleCreateGroup}
                      disabled={!groupName.trim() || selectedUsers.length === 0 || createGroupMutation.isPending}
                      className="w-full"
                      data-testid="button-create-group"
                    >
                      {createGroupMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {t.messages?.createGroupBtn || "Create Group"} ({selectedUsers.length} {t.messages?.members || "members"})
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.messages?.searchConversations || "Search conversations..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 focus:border-cyan-500/50"
              data-testid="input-search-messages"
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {threadsLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-white/5" />
              ))
            ) : filteredThreads.length > 0 ? (
              filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left transition-all duration-200",
                    activeThreadId === thread.id
                      ? "bg-white/10 border border-cyan-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                  data-testid={`button-thread-${thread.id}`}
                >
                  <div className="flex items-center gap-3">
                    {thread.type === "group" ? (
                      <div className={cn(
                        "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                        activeThreadId === thread.id
                          ? "bg-gradient-to-br from-cyan-500 to-teal-500"
                          : "bg-white/10"
                      )}>
                        <Users className={cn(
                          "h-5 w-5",
                          activeThreadId === thread.id ? "text-white" : "text-muted-foreground"
                        )} />
                      </div>
                    ) : (
                      <UserAvatar
                        name={getThreadDisplayName(thread)}
                        avatar={getThreadAvatar(thread)}
                        size="md"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn(
                          "font-medium truncate",
                          activeThreadId === thread.id && "text-cyan-400"
                        )}>{getThreadDisplayName(thread)}</p>
                        {thread.lastMessage && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatMessageTime(thread.lastMessage.createdAt!)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-sm text-muted-foreground truncate">
                          {thread.lastMessage ? (
                            <>
                              {thread.lastMessage.senderId === currentUser?.id && (
                                <span className="text-cyan-400 mr-1">
                                  <CheckCheck className="h-3 w-3 inline" />
                                </span>
                              )}
                              {thread.lastMessage.content}
                            </>
                          ) : (
                            <span className="italic">{t.messages?.noMessagesYet || "No messages yet"}</span>
                          )}
                        </p>
                        {thread.unreadCount && thread.unreadCount > 0 ? (
                          <Badge variant="default" className="bg-cyan-500 text-white text-xs min-w-[20px] h-5 justify-center">
                            {thread.unreadCount}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">{search ? (t.messages?.noConversationsFound || "No conversations found") : (t.messages?.noConversations || "No conversations yet")}</p>
                <p className="text-xs mt-2">{t.messages?.startConversation || "Click the + button to start a new chat"}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className={cn(
        "flex-1 flex flex-col bg-background",
        !activeThreadId && "hidden md:flex"
      )}>
        {activeThread ? (
          <>
            <div className="h-16 border-b border-white/5 px-4 flex items-center gap-3 bg-card/50 backdrop-blur-sm">
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden"
                onClick={() => setActiveThreadId(null)}
                data-testid="button-back-to-list"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {activeThread.type === "group" ? (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              ) : (
                <UserAvatar
                  name={getThreadDisplayName(activeThread)}
                  avatar={getThreadAvatar(activeThread)}
                  size="sm"
                />
              )}
              <div className="flex-1">
                <p className="font-semibold">{getThreadDisplayName(activeThread)}</p>
                <p className="text-xs text-muted-foreground">
                  {activeThread.type === "group" 
                    ? `${activeThread.participants?.length || 0} members`
                    : "Online"
                  }
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-9 w-9" data-testid="button-video-call">
                  <Video className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" data-testid="button-voice-call">
                  <Phone className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-9 w-9" data-testid="button-thread-menu">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteThreadMutation.mutate(activeThread.id)}
                      data-testid="button-delete-thread"
                    >
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl mx-auto">
                {messagesLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-3/4 bg-white/5" />
                  ))
                ) : messages.length > 0 ? (
                  messages.map((message, index) => {
                    const sender = getUserById(message.senderId);
                    const isOwn = message.senderId === currentUser?.id;
                    const showAvatar = !isOwn && (
                      index === 0 || 
                      messages[index - 1]?.senderId !== message.senderId
                    );
                    const isLastInGroup = index === messages.length - 1 || 
                      messages[index + 1]?.senderId !== message.senderId;
                    
                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 group",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                        data-testid={`message-${message.id}`}
                      >
                        {!isOwn && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <UserAvatar
                                name={sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email || 'User' : 'User'}
                                avatar={sender?.profileImageUrl}
                                size="sm"
                              />
                            )}
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[70%]",
                          isOwn && "items-end"
                        )}>
                          {!isOwn && showAvatar && activeThread.type === "group" && (
                            <p className="text-xs text-cyan-400 mb-1 px-2">
                              {sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email : 'User'}
                            </p>
                          )}
                          <div className={cn(
                            "px-4 py-2 rounded-2xl relative",
                            isOwn 
                              ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white" 
                              : "bg-white/10 dark:bg-white/5",
                            isOwn 
                              ? (isLastInGroup ? "rounded-br-md" : "")
                              : (isLastInGroup ? "rounded-bl-md" : ""),
                            message.messageType === "image" && "p-1"
                          )}>
                            {message.messageType === "voice" && message.mediaUrl ? (
                              <audio 
                                src={message.mediaUrl} 
                                controls 
                                className="max-w-[200px]"
                                data-testid={`audio-message-${message.id}`}
                              />
                            ) : message.messageType === "image" && message.mediaUrl ? (
                              <img 
                                src={message.mediaUrl} 
                                alt="Shared image"
                                className="max-w-[250px] rounded-xl cursor-pointer"
                                onClick={() => window.open(message.mediaUrl!, '_blank')}
                                data-testid={`image-message-${message.id}`}
                              />
                            ) : message.messageType === "video" && message.mediaUrl ? (
                              <video 
                                src={message.mediaUrl} 
                                controls 
                                className="max-w-[250px] rounded-xl"
                                data-testid={`video-message-${message.id}`}
                              />
                            ) : (
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                            )}
                            <div className={cn(
                              "flex items-center gap-1 mt-1",
                              isOwn ? "justify-end" : ""
                            )}>
                              <span className={cn(
                                "text-[10px]",
                                isOwn ? "text-white/70" : "text-muted-foreground"
                              )}>
                                {new Date(message.createdAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOwn && (
                                <CheckCheck className={cn(
                                  "h-3 w-3",
                                  "text-white/70"
                                )} />
                              )}
                            </div>
                          </div>
                          {isOwn && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center"
                              onClick={() => deleteMessageMutation.mutate(message.id)}
                              disabled={deleteMessageMutation.isPending}
                              data-testid={`button-delete-message-${message.id}`}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-8 w-8 text-cyan-400/50" />
                    </div>
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs mt-1">Say hello to start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/5 bg-card/50 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                {showVoiceRecorder ? (
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onCancel={() => setShowVoiceRecorder(false)}
                    isUploading={isUploadingMedia}
                  />
                ) : (
                  <div className="flex gap-2 items-center">
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      data-testid="input-image-upload"
                    />
                    <Button 
                      size="icon"
                      variant="ghost"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingMedia}
                      className="h-9 w-9 shrink-0"
                      data-testid="button-upload-image"
                    >
                      {isUploadingMedia ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ImageIcon className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoUpload}
                      accept="video/*"
                      className="hidden"
                      data-testid="input-video-upload"
                    />
                    <Button 
                      size="icon"
                      variant="ghost"
                      onClick={() => videoInputRef.current?.click()}
                      disabled={isUploadingMedia}
                      className="h-9 w-9 shrink-0"
                      data-testid="button-upload-video"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    {isOfficeRenter && myServices.length > 0 && (
                      <Popover open={showServicePicker} onOpenChange={setShowServicePicker}>
                        <PopoverTrigger asChild>
                          <Button 
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0"
                            data-testid="button-share-service"
                            title="Share Service Link"
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0" align="start" side="top">
                          <div className="p-3 border-b border-white/5">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Share Service Link
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              Select a service to share with this customer
                            </p>
                          </div>
                          <ScrollArea className="max-h-64">
                            <div className="p-2 space-y-1">
                              {myServices.filter(s => s.isActive && s.shareToken).map((service) => (
                                <Button
                                  key={service.id}
                                  variant="ghost"
                                  className="w-full justify-start h-auto py-2 px-3"
                                  onClick={() => handleShareService(service)}
                                  data-testid={`button-share-service-${service.id}`}
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center shrink-0">
                                      <Package className="h-5 w-5 text-amber-400" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                      <p className="text-sm font-medium truncate">{service.name}</p>
                                      <p className="text-xs text-amber-400">
                                        {(service.price / 100).toFixed(2)} SAR
                                      </p>
                                    </div>
                                    <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                                  </div>
                                </Button>
                              ))}
                              {myServices.filter(s => s.isActive && s.shareToken).length === 0 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                  No active services available
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    )}
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                      className="flex-1 bg-white/5 border-white/10 focus:border-cyan-500/50 rounded-full px-5"
                      data-testid="input-new-message"
                    />
                    {newMessage.trim() ? (
                      <Button 
                        size="icon"
                        onClick={handleSend} 
                        disabled={sendMessageMutation.isPending}
                        className="rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shrink-0"
                        data-testid="button-send-message"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button 
                        size="icon"
                        variant="ghost"
                        onClick={() => setShowVoiceRecorder(true)}
                        className="h-9 w-9 shrink-0"
                        data-testid="button-voice-recorder"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-12 w-12 text-cyan-400/50" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to Messages</h3>
              <p className="text-sm max-w-xs mx-auto">
                Send and receive messages with your team. Start a new conversation or select an existing chat.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
