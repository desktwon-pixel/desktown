import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Send, 
  MessageCircle, 
  Users, 
  Mic, 
  MicOff, 
  Paperclip, 
  Video as VideoIcon,
  Image as ImageIcon,
  Calendar,
  Play,
  Pause,
  X,
  FileAudio,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { ChatThread, Message, User } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useLanguage, translations } from "@/lib/i18n";
import { Link } from "wouter";

interface GlobalChatResponse extends ChatThread {
  messages: Message[];
  participants: User[];
  lastMessage?: Message;
  unreadCount?: number;
}

interface GroupChatPanelProps {
  fullHeight?: boolean;
}

export function GroupChatPanel({ fullHeight = false }: GroupChatPanelProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const { user: currentUser } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: globalChat, isLoading } = useQuery<GlobalChatResponse>({
    queryKey: ["/api/threads/global"],
    refetchInterval: 3000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, messageType, mediaUrl }: { content: string; messageType: string; mediaUrl?: string }) => {
      if (!globalChat?.id) return;
      return await apiRequest("POST", `/api/threads/${globalChat.id}/messages`, { 
        content, 
        messageType,
        mediaUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads/global"] });
      setNewMessage("");
      setAudioBlob(null);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [globalChat?.messages]);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const handleSend = () => {
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate({ content: newMessage.trim(), messageType: "text" });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/mp4',
      'audio/aac',
      'audio/mpeg',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using audio format:', type);
        return type;
      }
    }
    return 'audio/webm';
  };

  const getFileExtension = (mimeType: string) => {
    if (mimeType.includes('mp4')) return 'm4a';
    if (mimeType.includes('aac')) return 'aac';
    if (mimeType.includes('mpeg')) return 'mp3';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('wav')) return 'wav';
    return 'webm';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const options = { mimeType };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAudioBlob(null);
    setRecordingTime(0);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
  };

  const sendVoiceNote = async () => {
    if (audioBlob && globalChat?.id) {
      try {
        const mimeType = audioBlob.type || 'audio/webm';
        const fileExt = getFileExtension(mimeType);
        
        const uploadRes = await fetch('/api/upload/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileType: fileExt }),
        });
        const { uploadURL, objectPath } = await uploadRes.json();
        
        if (uploadURL && objectPath) {
          await fetch(uploadURL, {
            method: 'PUT',
            body: audioBlob,
            headers: { 'Content-Type': mimeType },
          });
          
          sendMessageMutation.mutate({ 
            content: language === 'ar' ? 'رسالة صوتية' : 'Voice note', 
            messageType: "audio",
            mediaUrl: objectPath
          });
        }
      } catch (error) {
        console.error('Error uploading voice note:', error);
      }
      setAudioBlob(null);
    }
  };

  const handleFileSelect = async (type: 'image' | 'video' | 'audio') => {
    const accept = type === 'image' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !globalChat?.id) return;

    const ext = file.name.split('.').pop() || 'bin';
    
    try {
      const uploadRes = await fetch('/api/upload/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: ext }),
      });
      const { uploadURL, objectPath } = await uploadRes.json();
      
      if (uploadURL && objectPath) {
        await fetch(uploadURL, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        
        const messageType = file.type.startsWith('image/') ? 'image' : 
                           file.type.startsWith('video/') ? 'video' : 'audio';
        
        sendMessageMutation.mutate({ 
          content: file.name, 
          messageType,
          mediaUrl: objectPath
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const normalizeMediaUrl = (url: string): string => {
    return url.replace(/^\/objects\/\/objects\//, '/objects/');
  };

  const isSafari = () => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium');
  };

  const handleDownload = async (url: string, filename: string, e?: React.MouseEvent | React.TouchEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      // For iOS, try opening in new tab first as downloads are restricted
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        window.open(url, '_blank');
        return;
      }
      
      const response = await fetch(url, { credentials: 'include' });
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
    } catch (error) {
      console.error('Download error:', error);
      window.open(url, '_blank');
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.messageType === 'audio' && message.mediaUrl) {
      const audioUrl = normalizeMediaUrl(message.mediaUrl);
      const ext = audioUrl.split('.').pop()?.toLowerCase() || 'webm';
      const getMimeType = (extension: string) => {
        switch (extension) {
          case 'mp4': case 'm4a': return 'audio/mp4';
          case 'aac': return 'audio/aac';
          case 'mp3': return 'audio/mpeg';
          case 'ogg': return 'audio/ogg';
          case 'wav': return 'audio/wav';
          default: return 'audio/webm';
        }
      };
      const mimeType = getMimeType(ext);
      const isWebm = ext === 'webm';
      const showDownloadFallback = isWebm && isSafari();
      
      const audioFilename = `voice_${message.id}.${ext}`;
      if (showDownloadFallback) {
        return (
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4" />
            <button 
              onClick={() => handleDownload(audioUrl, audioFilename)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              {language === 'ar' ? 'تحميل الرسالة الصوتية' : 'Download voice note'}
            </button>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-2">
          <FileAudio className="h-4 w-4" />
          <audio 
            controls 
            className="h-8 max-w-[200px]"
            preload="metadata"
          >
            <source src={audioUrl} type={mimeType} />
          </audio>
          <button 
            type="button"
            onClick={() => handleDownload(audioUrl, audioFilename)}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary/10 hover:bg-primary/20 text-primary"
            data-testid={`download-audio-${message.id}`}
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      );
    }
    if (message.messageType === 'video' && message.mediaUrl) {
      const videoUrl = normalizeMediaUrl(message.mediaUrl);
      const videoExt = videoUrl.split('.').pop()?.toLowerCase() || 'mp4';
      const videoFilename = `video_${message.id}.${videoExt}`;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      return (
        <div className="relative inline-block">
          <video controls className="max-w-full rounded max-h-32" playsInline>
            <source src={videoUrl} />
          </video>
          {isIOS ? (
            <a 
              href={videoUrl}
              download={videoFilename}
              className="absolute top-1 left-1 p-1 rounded-full bg-black/50 text-white active:bg-black/70 cursor-pointer touch-manipulation z-10"
              data-testid={`download-video-${message.id}`}
            >
              <Download className="h-3 w-3" />
            </a>
          ) : (
            <button 
              type="button"
              onClick={(e) => handleDownload(videoUrl, videoFilename, e)}
              className="absolute top-1 left-1 p-1 rounded-full bg-black/50 text-white active:bg-black/70 cursor-pointer touch-manipulation z-10"
              data-testid={`download-video-${message.id}`}
            >
              <Download className="h-3 w-3" />
            </button>
          )}
        </div>
      );
    }
    if (message.messageType === 'image' && message.mediaUrl) {
      const imageUrl = normalizeMediaUrl(message.mediaUrl);
      const imageExt = imageUrl.split('.').pop()?.toLowerCase() || 'jpg';
      const imageFilename = `image_${message.id}.${imageExt}`;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      return (
        <div className="relative inline-block">
          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
            <img 
              src={imageUrl} 
              alt={message.content || 'Image'} 
              className="max-w-full rounded max-h-32 object-cover cursor-pointer"
            />
          </a>
          {isIOS ? (
            <a 
              href={imageUrl}
              download={imageFilename}
              className="absolute top-1 left-1 p-1.5 rounded-full bg-black/60 text-white active:bg-black/80 cursor-pointer touch-manipulation z-10"
              data-testid={`download-image-${message.id}`}
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          ) : (
            <button 
              type="button"
              onClick={(e) => handleDownload(imageUrl, imageFilename, e)}
              className="absolute top-1 left-1 p-1.5 rounded-full bg-black/60 text-white active:bg-black/80 cursor-pointer touch-manipulation z-10"
              data-testid={`download-image-${message.id}`}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      );
    }
    return <p className="text-sm break-words select-text">{message.content}</p>;
  };

  if (isLoading) {
    return (
      <div data-testid="group-chat-loading">
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className={cn("w-full rounded-lg", fullHeight ? "h-[80vh]" : "h-32")} />
      </div>
    );
  }

  const messages = globalChat?.messages || [];
  const participants = globalChat?.participants || [];

  return (
    <div data-testid="section-group-chat">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
      />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-foreground">
            {t.followUp?.groupChat || "Group Chat"}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="h-3 w-3" />
            {participants.length} {language === 'ar' ? 'عضو' : 'members'}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/meetings">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                data-testid="button-schedule-meeting"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            {language === 'ar' ? 'جدولة اجتماع' : 'Schedule Meeting'}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="bg-slate-50 dark:bg-muted rounded-lg overflow-hidden">
        <ScrollArea className={cn("p-3", fullHeight ? "h-[80vh]" : "h-48")}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs">{t.followUp?.noMessages || "No messages yet. Start the conversation!"}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const sender = participants.find(p => p.id === message.senderId);
                const isOwn = message.senderId === currentUser?.id;
                const senderName = sender 
                  ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email 
                  : 'Unknown';

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-2",
                      isOwn ? "flex-row-reverse" : "flex-row"
                    )}
                    data-testid={`message-${message.id}`}
                  >
                    {!isOwn && (
                      <UserAvatar 
                        name={sender ? `${sender.firstName || ''} ${sender.lastName || ''}`.trim() || sender.email || 'User' : 'User'}
                        avatar={sender?.profileImageUrl}
                        size="sm" 
                        className="flex-shrink-0 w-6 h-6" 
                      />
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2 overflow-visible",
                        isOwn 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-white dark:bg-card border"
                      )}
                    >
                      {!isOwn && (
                        <p className="text-xs font-medium text-muted-foreground mb-0.5">
                          {senderName}
                        </p>
                      )}
                      {renderMessageContent(message)}
                      <p className={cn(
                        "text-[10px] mt-1",
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {message.createdAt && formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t bg-white dark:bg-card">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-red-600 dark:text-red-400">
                  {language === 'ar' ? 'جاري التسجيل...' : 'Recording...'} {formatTime(recordingTime)}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={cancelRecording}
                className="h-9 w-9 text-muted-foreground"
                data-testid="button-cancel-recording"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={stopRecording}
                className="h-9 w-9 bg-red-500 hover:bg-red-600"
                data-testid="button-stop-recording"
              >
                <MicOff className="h-4 w-4" />
              </Button>
            </div>
          ) : audioBlob ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
                <FileAudio className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600 dark:text-green-400">
                  {language === 'ar' ? 'رسالة صوتية جاهزة' : 'Voice note ready'}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={cancelRecording}
                className="h-9 w-9 text-muted-foreground"
                data-testid="button-discard-voice"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                onClick={sendVoiceNote}
                className="h-9 w-9"
                disabled={sendMessageMutation.isPending}
                data-testid="button-send-voice"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="relative">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="h-9 w-9"
                      data-testid="button-attach"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {language === 'ar' ? 'إرفاق ملف' : 'Attach file'}
                  </TooltipContent>
                </Tooltip>
                
                {showAttachMenu && (
                  <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-card rounded-lg shadow-lg border p-1 flex flex-col gap-1 z-10">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileSelect('image')}
                      className="justify-start gap-2 h-8 text-xs"
                      data-testid="button-attach-image"
                    >
                      <ImageIcon className="h-3 w-3" />
                      {language === 'ar' ? 'صورة' : 'Image'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileSelect('video')}
                      className="justify-start gap-2 h-8 text-xs"
                      data-testid="button-attach-video"
                    >
                      <VideoIcon className="h-3 w-3" />
                      {language === 'ar' ? 'فيديو' : 'Video'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileSelect('audio')}
                      className="justify-start gap-2 h-8 text-xs"
                      data-testid="button-attach-audio"
                    >
                      <FileAudio className="h-3 w-3" />
                      {language === 'ar' ? 'صوت' : 'Audio'}
                    </Button>
                  </div>
                )}
              </div>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={startRecording}
                    className="h-9 w-9"
                    data-testid="button-voice-note"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {language === 'ar' ? 'رسالة صوتية' : 'Voice note'}
                </TooltipContent>
              </Tooltip>
              
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t.followUp?.typeMessage || "Type a message..."}
                className="flex-1 text-sm h-9"
                disabled={sendMessageMutation.isPending}
                data-testid="input-group-message"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="h-9 w-9"
                data-testid="button-send-group-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
