import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  ArrowLeft,
  Star,
  MapPin,
  Clock,
  Mail,
  Phone,
  Send,
  MessageCircle,
  Heart,
  Package,
  Video,
  Eye,
  Play,
  Megaphone,
  User,
} from "lucide-react";
import logoUrl from "@/assets/office-logo.png";
import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage, translations } from "@/lib/i18n";
import type {
  Office,
  OfficeService,
  ServiceRating,
  ServiceComment,
  OfficeMedia,
  OfficePost,
  OfficeMessage,
  VideoCall,
} from "@shared/schema";
import { PhoneOff, VideoOff } from "lucide-react";

function generateSessionId() {
  const stored = localStorage.getItem('office_chat_session');
  if (stored) return stored;
  const newId = 'visitor_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('office_chat_session', newId);
  return newId;
}

function StarRating({
  rating,
  onRate,
  interactive = false,
}: {
  rating: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
          data-testid={`star-${star}`}
        >
          <Star
            className={`h-5 w-5 ${
              (hover || rating) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ServiceCard({
  service,
  officeId,
}: {
  service: OfficeService;
  officeId: number;
}) {
  const { language } = useLanguage();
  const t = translations[language].officeDetail;
  const isRTL = language === 'ar';
  const [showRating, setShowRating] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [visitorName, setVisitorName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentVisitorName, setCommentVisitorName] = useState('');

  const { data: ratingsData } = useQuery<{
    ratings: ServiceRating[];
    average: number;
    count: number;
  }>({
    queryKey: ['/api/public/services', service.id, 'ratings'],
  });

  const { data: comments = [] } = useQuery<ServiceComment[]>({
    queryKey: ['/api/public/services', service.id, 'comments'],
  });

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/public/services/${service.id}/ratings`, {
        rating: newRating,
        visitorName: visitorName || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/services', service.id, 'ratings'] });
      setShowRating(false);
      setNewRating(0);
      setVisitorName('');
    },
  });

  const submitCommentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/public/services/${service.id}/comments`, {
        content: commentContent,
        visitorName: commentVisitorName || null,
        rating: newRating || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/services', service.id, 'comments'] });
      setShowCommentForm(false);
      setCommentContent('');
      setCommentVisitorName('');
    },
  });

  return (
    <Card className="hover-elevate" data-testid={`card-service-${service.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{service.title}</h3>
                {service.category && (
                  <Badge variant="secondary" className="mt-1">
                    {service.category}
                  </Badge>
                )}
              </div>
              {service.price && (
                <div className={isRTL ? "text-left" : "text-right"}>
                  <span className="font-bold text-lg">
                    {new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', { style: 'currency', currency: 'SAR' }).format(Number(service.price))}
                  </span>
                  {service.priceType && (
                    <span className="text-sm text-muted-foreground block">
                      /{service.priceType}
                    </span>
                  )}
                </div>
              )}
            </div>
            {service.description && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {service.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <StarRating rating={ratingsData?.average || 0} />
                <span className="text-sm text-muted-foreground">
                  ({ratingsData?.count || 0})
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowRating(!showRating)}
                data-testid={`button-rate-service-${service.id}`}
              >
                {t.rate}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCommentForm(!showCommentForm)}
                data-testid={`button-comment-service-${service.id}`}
              >
                <MessageCircle className={isRTL ? "h-4 w-4 ml-1" : "h-4 w-4 mr-1"} />
                {comments.length}
              </Button>
            </div>
          </div>
        </div>

        {showRating && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center gap-4">
              <span className="text-sm">{t.yourRating}</span>
              <StarRating rating={newRating} onRate={setNewRating} interactive />
            </div>
            <Input
              placeholder={t.yourNameOptional}
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              data-testid="input-rating-name"
            />
            <Button
              onClick={() => submitRatingMutation.mutate()}
              disabled={newRating === 0 || submitRatingMutation.isPending}
              data-testid="button-submit-rating"
            >
              {t.submitRating}
            </Button>
          </div>
        )}

        {showCommentForm && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
            <Textarea
              placeholder={t.writeComment}
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              rows={3}
              data-testid="textarea-comment"
            />
            <Input
              placeholder={t.yourNameOptional}
              value={commentVisitorName}
              onChange={(e) => setCommentVisitorName(e.target.value)}
              data-testid="input-comment-name"
            />
            <Button
              onClick={() => submitCommentMutation.mutate()}
              disabled={!commentContent.trim() || submitCommentMutation.isPending}
              data-testid="button-submit-comment"
            >
              {t.postComment}
            </Button>
          </div>
        )}

        {comments.length > 0 && (
          <div className="mt-4 space-y-3 border-t pt-4" dir={isRTL ? 'rtl' : 'ltr'}>
            <h4 className="font-medium text-sm">{t.comments}</h4>
            {comments.slice(0, 3).map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {comment.visitorName?.[0]?.toUpperCase() || (language === 'ar' ? 'ز' : 'G')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {comment.visitorName || t.guest}
                    </span>
                    {comment.rating && (
                      <StarRating rating={comment.rating} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChatPanel({
  officeId,
  officeName,
}: {
  officeId: number;
  officeName: string;
}) {
  const { language } = useLanguage();
  const t = translations[language].officeDetail;
  const isRTL = language === 'ar';
  const [sessionId] = useState(generateSessionId);
  const [message, setMessage] = useState('');
  const [visitorName, setVisitorName] = useState(() => 
    localStorage.getItem('office_chat_name') || ''
  );
  const [showNameInput, setShowNameInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useQuery<OfficeMessage[]>({
    queryKey: ['/api/public/offices', officeId, 'messages'],
    queryFn: async () => {
      const res = await fetch(`/api/public/offices/${officeId}/messages?sessionId=${sessionId}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/public/offices/${officeId}/messages`, {
        sessionId,
        content: message,
        senderName: visitorName || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/offices', officeId, 'messages'] });
      setMessage('');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSaveName = () => {
    localStorage.setItem('office_chat_name', visitorName);
    setShowNameInput(false);
  };

  return (
    <Card className="h-[400px] flex flex-col" data-testid="panel-chat" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t.chatWithReceptionist}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNameInput(!showNameInput)}
            data-testid="button-set-name"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
        {showNameInput && (
          <div className="flex items-center gap-2 mt-2">
            <Input
              placeholder={t.yourName}
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="text-sm"
              data-testid="input-chat-name"
            />
            <Button size="sm" onClick={handleSaveName} data-testid="button-save-name">
              {t.save}
            </Button>
          </div>
        )}
      </CardHeader>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className={`h-10 w-1/2 ${isRTL ? 'mr-auto' : 'ml-auto'}`} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t.startConversation} {officeName}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderType === 'visitor' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 ${
                  msg.senderType === 'visitor'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
                data-testid={`message-${msg.id}`}
              >
                {msg.senderType === 'receptionist' && (
                  <span className="text-xs font-medium block mb-1">{t.receptionist}</span>
                )}
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex-shrink-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t.typeMessage}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (message.trim()) sendMessageMutation.mutate();
              }
            }}
            data-testid="input-chat-message"
          />
          <Button
            size="icon"
            onClick={() => message.trim() && sendMessageMutation.mutate()}
            disabled={!message.trim() || sendMessageMutation.isPending}
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function VideoChatPanel({
  officeId,
  officeName,
}: {
  officeId: number;
  officeName: string;
}) {
  const { language } = useLanguage();
  const t = translations[language].officeDetail;
  const isRTL = language === 'ar';
  const [sessionId] = useState(generateSessionId);
  const [visitorName, setVisitorName] = useState(() => 
    localStorage.getItem('office_chat_name') || ''
  );
  const [currentCall, setCurrentCall] = useState<VideoCall | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'requesting' | 'pending' | 'active' | 'ended' | 'declined'>('idle');

  const requestCallMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/public/offices/${officeId}/video-calls`, {
        sessionId,
        visitorName: visitorName || null,
      });
      const data = await response.json();
      return data as VideoCall;
    },
    onSuccess: (call: VideoCall) => {
      setCurrentCall(call);
      setCallStatus('pending');
    },
    onError: () => {
      setCallStatus('idle');
    },
  });

  const endCallMutation = useMutation({
    mutationFn: async () => {
      if (!currentCall) return;
      await apiRequest('POST', `/api/public/video-calls/${currentCall.roomId}/end`, {
        sessionId,
      });
    },
    onSuccess: () => {
      setCurrentCall(null);
      setCallStatus('ended');
      setTimeout(() => setCallStatus('idle'), 3000);
    },
  });

  const { data: callStatusData } = useQuery<VideoCall>({
    queryKey: ['/api/public/video-calls', currentCall?.roomId],
    enabled: !!currentCall?.roomId && (callStatus === 'pending' || callStatus === 'active'),
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (callStatusData) {
      if (callStatusData.status === 'active') {
        setCallStatus('active');
      } else if (callStatusData.status === 'declined') {
        setCallStatus('declined');
        setTimeout(() => {
          setCallStatus('idle');
          setCurrentCall(null);
        }, 3000);
      } else if (callStatusData.status === 'ended') {
        setCallStatus('ended');
        setTimeout(() => {
          setCallStatus('idle');
          setCurrentCall(null);
        }, 3000);
      }
    }
  }, [callStatusData]);

  const handleStartCall = () => {
    setCallStatus('requesting');
    requestCallMutation.mutate();
  };

  const handleEndCall = () => {
    endCallMutation.mutate();
  };

  const handleSaveName = () => {
    localStorage.setItem('office_chat_name', visitorName);
    setShowNameInput(false);
  };

  return (
    <Card className="h-[400px] flex flex-col" data-testid="panel-video-chat" dir={isRTL ? 'rtl' : 'ltr'}>
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t.videoCall}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNameInput(!showNameInput)}
            data-testid="button-set-video-name"
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
        {showNameInput && (
          <div className="flex items-center gap-2 mt-2">
            <Input
              placeholder={t.yourName}
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              className="text-sm"
              data-testid="input-video-name"
            />
            <Button size="sm" onClick={handleSaveName} data-testid="button-save-video-name">
              {t.save}
            </Button>
          </div>
        )}
      </CardHeader>
      <div className="flex-1 flex items-center justify-center p-6">
        {callStatus === 'idle' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Video className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{t.startVideoCall}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.connectWith} {officeName}
              </p>
            </div>
            <Button
              onClick={handleStartCall}
              disabled={requestCallMutation.isPending}
              className="gap-2"
              data-testid="button-start-video-call"
            >
              <Video className="h-4 w-4" />
              {requestCallMutation.isPending ? t.connecting : t.startVideoCall}
            </Button>
          </div>
        )}

        {callStatus === 'requesting' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Video className="h-10 w-10 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">{t.initiatingCall}</p>
          </div>
        )}

        {callStatus === 'pending' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Video className="h-10 w-10 text-yellow-500 animate-pulse" />
            </div>
            <div>
              <h3 className="font-medium">{t.waitingForReceptionist}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.pleaseWait}
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={handleEndCall}
              className="gap-2"
              data-testid="button-cancel-video-call"
            >
              <PhoneOff className="h-4 w-4" />
              {t.cancelCall}
            </Button>
          </div>
        )}

        {callStatus === 'active' && (
          <div className="text-center space-y-4 w-full">
            <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center relative">
              <div className="text-center">
                <Video className="h-16 w-16 mx-auto text-green-500 animate-pulse" />
                <p className="text-sm text-muted-foreground mt-2">{t.callInProgress}</p>
                <p className="text-xs text-muted-foreground">{t.room}: {currentCall?.roomId}</p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleEndCall}
              className="gap-2"
              data-testid="button-end-video-call"
            >
              <PhoneOff className="h-4 w-4" />
              {t.endCall}
            </Button>
          </div>
        )}

        {callStatus === 'declined' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <VideoOff className="h-10 w-10 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium">{t.callDeclined}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.receptionistUnavailable}
              </p>
            </div>
          </div>
        )}

        {callStatus === 'ended' && (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <PhoneOff className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">{t.callEnded}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t.thankYouConnecting}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function OfficeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLanguage();
  const t = translations[language].officeDetail;
  const isRTL = language === 'ar';

  const { data: office, isLoading: officeLoading, error } = useQuery<Office>({
    queryKey: ['/api/public/offices', slug],
    enabled: !!slug,
  });

  const { data: services = [], isLoading: servicesLoading } = useQuery<OfficeService[]>({
    queryKey: ['/api/public/offices', office?.id, 'services'],
    enabled: !!office?.id,
  });

  const { data: media = [] } = useQuery<OfficeMedia[]>({
    queryKey: ['/api/public/offices', office?.id, 'media'],
    enabled: !!office?.id,
  });

  const { data: posts = [] } = useQuery<OfficePost[]>({
    queryKey: ['/api/public/offices', office?.id, 'posts'],
    enabled: !!office?.id,
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      await apiRequest('POST', `/api/public/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/public/offices', office?.id, 'posts'] });
    },
  });

  const handleLogin = () => {
    localStorage.setItem("cloudoffice_redirect", "/");
    window.location.href = "/api/login";
  };

  if (officeLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !office) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t.officeNotFound}</h1>
          <p className="text-muted-foreground mb-4">
            {t.officeNotFoundDesc}
          </p>
          <Link href="/storefront">
            <Button data-testid="button-back-to-storefront">
              <ArrowLeft className={isRTL ? "h-4 w-4 ml-2 rotate-180" : "h-4 w-4 mr-2"} />
              {t.backToMarketplace}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const videos = media.filter((m) => m.type === 'video');
  const announcements = media.filter((m) => m.type === 'announcement');

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/storefront">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className={isRTL ? "h-5 w-5 rotate-180" : "h-5 w-5"} />
              </Button>
            </Link>
            <img src={logoUrl} alt="DeskTown" className="h-10 w-10" />
            <span className="text-xl font-semibold">DeskTown</span>
          </div>
          <Button variant="default" size="sm" onClick={handleLogin} data-testid="button-login">
            {t.login}
          </Button>
        </div>
      </header>

      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-primary/5">
        {office.coverUrl ? (
          <img
            src={office.coverUrl}
            alt={office.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="h-24 w-24 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto flex items-end gap-4">
            <Avatar className="h-24 w-24 border-4 border-background">
              {office.logoUrl ? (
                <AvatarImage src={office.logoUrl} alt={office.name} />
              ) : null}
              <AvatarFallback className="text-2xl">
                {office.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="mb-2">
              <h1 className="text-3xl font-bold">{office.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm">
                {office.category && (
                  <Badge variant="secondary">{office.category}</Badge>
                )}
                {office.location && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {office.location}
                  </span>
                )}
                {office.workingHours && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {office.workingHours}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {office.description && (
              <section>
                <h2 className="text-xl font-semibold mb-3">{t.about}</h2>
                <p className="text-muted-foreground">{office.description}</p>
              </section>
            )}

            <Card className={isRTL ? "bg-gradient-to-l from-primary/5 to-primary/10 border-primary/20" : "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20"}>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  {t.contactInformation}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {office.contactEmail && (
                    <a
                      href={`mailto:${office.contactEmail}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                      data-testid="link-email"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.email}</p>
                        <p className="font-medium">{office.contactEmail}</p>
                      </div>
                    </a>
                  )}
                  {office.contactPhone && (
                    <a
                      href={`tel:${office.contactPhone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                      data-testid="link-phone"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.phone}</p>
                        <p className="font-medium">{office.contactPhone}</p>
                      </div>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="services">
              <TabsList data-testid="tabs-office-content">
                <TabsTrigger value="services" data-testid="tab-services">
                  <Package className={isRTL ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
                  {t.services} ({services.length})
                </TabsTrigger>
                <TabsTrigger value="media" data-testid="tab-media">
                  <Video className={isRTL ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
                  {t.media} ({media.length})
                </TabsTrigger>
                <TabsTrigger value="posts" data-testid="tab-posts">
                  <MessageCircle className={isRTL ? "h-4 w-4 ml-2" : "h-4 w-4 mr-2"} />
                  {t.posts} ({posts.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="mt-6">
                {servicesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <Skeleton className="h-24" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t.noServices}</h3>
                    <p className="text-muted-foreground">
                      {t.noServicesDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        officeId={office.id}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="media" className="mt-6">
                {media.length === 0 ? (
                  <div className="text-center py-12">
                    <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t.noMedia}</h3>
                    <p className="text-muted-foreground">
                      {t.noMediaDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {videos.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          {t.videos}
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {videos.map((video) => (
                            <Card
                              key={video.id}
                              className="overflow-hidden"
                              data-testid={`card-video-${video.id}`}
                            >
                              <div className="relative">
                                {video.thumbnailUrl ? (
                                  <img
                                    src={video.thumbnailUrl}
                                    alt={video.title || 'Video'}
                                    className="w-full h-40 object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                                    <Video className="h-12 w-12 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                  <Play className="h-12 w-12 text-white" />
                                </div>
                              </div>
                              <CardContent className="p-3">
                                <h4 className="font-medium truncate">
                                  {video.title || 'Untitled'}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Eye className="h-4 w-4" />
                                  {video.views} {t.views}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {announcements.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3 flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          {t.announcements}
                        </h3>
                        <div className="space-y-3">
                          {announcements.map((ann) => (
                            <Card key={ann.id} data-testid={`card-announcement-${ann.id}`}>
                              <CardContent className="p-4">
                                <h4 className="font-medium">{ann.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {ann.content}
                                </p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts" className="mt-6">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t.noPosts}</h3>
                    <p className="text-muted-foreground">
                      {t.noPostsDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <Card key={post.id} data-testid={`card-post-${post.id}`}>
                        <CardContent className="p-4">
                          <p className="text-sm mb-3">{post.content}</p>
                          {post.mediaUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden">
                              {post.mediaType === 'video' ? (
                                <video
                                  src={post.mediaUrl}
                                  className="w-full h-48 object-cover"
                                  controls
                                />
                              ) : (
                                <img
                                  src={post.mediaUrl}
                                  alt=""
                                  className="w-full h-48 object-cover"
                                />
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => likePostMutation.mutate(post.id)}
                              data-testid={`button-like-post-${post.id}`}
                            >
                              <Heart className={isRTL ? "h-4 w-4 ml-1" : "h-4 w-4 mr-1"} />
                              {post.likes || 0}
                            </Button>
                            <span className="text-muted-foreground">
                              {new Date(post.createdAt!).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:sticky lg:top-24 lg:h-fit space-y-4">
            <ChatPanel officeId={office.id} officeName={office.name} />
            <VideoChatPanel officeId={office.id} officeName={office.name} />
          </div>
        </div>
      </div>
    </div>
  );
}
