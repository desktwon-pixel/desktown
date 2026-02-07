import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ClipboardList, 
  ArrowLeft, 
  Mail, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  RefreshCw,
  MessageCircle,
  Send,
  Inbox,
  SendHorizontal,
  Users,
  Plus,
  Loader2,
  Paperclip,
  Image,
  Video,
  FileText,
  FileImage,
  X,
  Play,
  FolderOpen,
  Download,
  Trash2,
  Upload,
  File,
  Home,
  Building2,
  Briefcase,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import logoUrl from "@/assets/office-logo.png";
import type { Task, ChatThread, Message, User as UserType, InternalEmail } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface EnhancedThread extends ChatThread {
  lastMessage?: Message;
  unreadCount?: number;
  participants?: UserType[];
}

interface EmailWithUsers extends InternalEmail {
  sender?: UserType | null;
  recipient?: UserType | null;
}

interface TeamMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  profileImageUrl: string | null;
  role: string | null;
}

interface EmployeeSession {
  token: string;
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  expiresAt: string;
}

interface EmployeeDocument {
  id: number;
  employeeId: string;
  originalName: string;
  mimeType: string | null;
  fileSize: number | null;
  description: string | null;
  createdAt: string;
}

export default function EmployeePortal() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const dateLocale = language === 'ar' ? ar : enUS;
  const [email, setEmail] = useState("");
  const [session, setSession] = useState<EmployeeSession | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mainTab, setMainTab] = useState("tasks");
  const [taskFilter, setTaskFilter] = useState("all");
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [mailView, setMailView] = useState<"inbox" | "sent" | "compose">("inbox");
  const [composeData, setComposeData] = useState({ recipientId: "", subject: "", body: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docDescription, setDocDescription] = useState("");

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'x-employee-token': session?.token || '',
  });

  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery<Task[]>({
    queryKey: ['/api/employee/tasks', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch('/api/employee/tasks', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
    enabled: !!session,
  });

  const { data: threads = [], isLoading: threadsLoading, refetch: refetchThreads } = useQuery<EnhancedThread[]>({
    queryKey: ['/api/employee/threads', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch('/api/employee/threads', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch threads');
      }
      return response.json();
    },
    enabled: !!session,
    refetchInterval: 5000,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['/api/employee/threads', activeThreadId, 'messages', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch(`/api/employee/threads/${activeThreadId}/messages`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
    enabled: !!session && !!activeThreadId,
    refetchInterval: 3000,
  });

  const { data: inboxEmails = [], isLoading: inboxLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ['/api/employee/emails/inbox', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch('/api/employee/emails/inbox', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch inbox');
      }
      return response.json();
    },
    enabled: !!session,
  });

  const { data: sentEmails = [], isLoading: sentLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ['/api/employee/emails/sent', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch('/api/employee/emails/sent', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch sent emails');
      }
      return response.json();
    },
    enabled: !!session,
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ['/api/employee/team', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch('/api/employee/team', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch team');
      }
      return response.json();
    },
    enabled: !!session,
  });

  const { data: documents = [], isLoading: documentsLoading, refetch: refetchDocuments } = useQuery<EmployeeDocument[]>({
    queryKey: ['/api/employee/documents', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch('/api/employee/documents', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    },
    enabled: !!session,
  });

  interface MeetingInvite {
    id: number;
    title: string;
    description: string | null;
    organizerId: string;
    startTime: string;
    endTime: string;
    location: string | null;
    isRecurring: boolean;
    createdAt: string;
    updatedAt: string;
  }

  const { data: meetingInvites = [], refetch: refetchMeetings } = useQuery<MeetingInvite[]>({
    queryKey: ['/api/employee/meetings', session?.token ?? ''],
    queryFn: async () => {
      const response = await fetch('/api/employee/meetings', {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to fetch meetings');
      }
      return response.json();
    },
    enabled: !!session,
    refetchInterval: 10000,
  });

  const acceptMeetingMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const response = await fetch(`/api/employee/meetings/${meetingId}/accept`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to accept meeting');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchMeetings();
      toast({
        title: language === 'ar' ? 'تم قبول الدعوة' : 'Invitation accepted',
        description: language === 'ar' ? 'تم قبول دعوة الاجتماع بنجاح' : 'Meeting invitation accepted successfully',
      });
    },
  });

  const declineMeetingMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      const response = await fetch(`/api/employee/meetings/${meetingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Failed to decline meeting');
      }
    },
    onSuccess: () => {
      refetchMeetings();
      toast({
        title: language === 'ar' ? 'تم حذف الدعوة' : 'Invitation removed',
        description: language === 'ar' ? 'تم حذف دعوة الاجتماع' : 'Meeting invitation removed',
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: number) => {
      const response = await fetch(`/api/employee/documents/${docId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to delete document');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/documents', session?.token] });
      toast({
        title: language === 'ar' ? 'تم حذف المستند' : 'Document deleted',
        description: language === 'ar' ? 'تم حذف المستند بنجاح' : 'The document has been deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session) return;

    setIsUploadingDoc(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];
      if (!allowedTypes.includes(ext)) {
        throw new Error(language === 'ar' 
          ? 'نوع الملف غير مسموح. المسموح: صور، PDF، Word، Excel، نص، CSV' 
          : 'File type not allowed. Allowed: images, PDF, Word, Excel, text, CSV');
      }

      // Get upload URL
      const uploadRes = await fetch('/api/employee/documents/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fileType: ext, fileSize: file.size }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.message || 'Failed to get upload URL');
      }
      const { uploadURL, objectPath } = await uploadRes.json();

      // Upload file to object storage
      await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Create document record
      const createRes = await fetch('/api/employee/documents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          objectPath,
          originalName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          description: docDescription || null,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.message || err.error || 'Failed to save document');
      }

      queryClient.invalidateQueries({ queryKey: ['/api/employee/documents', session?.token] });
      setDocDescription("");
      toast({
        title: language === 'ar' ? 'تم رفع المستند' : 'Document uploaded',
        description: language === 'ar' ? 'تم رفع المستند بنجاح' : 'Your document has been uploaded successfully',
      });
    } catch (error) {
      console.error('Document upload error:', error);
      toast({
        title: language === 'ar' ? 'خطأ في الرفع' : 'Upload error',
        description: error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingDoc(false);
      if (docFileInputRef.current) {
        docFileInputRef.current.value = '';
      }
    }
  };

  const handleDocumentDownload = async (doc: EmployeeDocument) => {
    try {
      const response = await fetch(`/api/employee/documents/${doc.id}/download`, {
        headers: { 'x-employee-token': session?.token || '' },
      });
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      const { downloadUrl, filename } = await response.json();
      
      // Open signed URL in new tab or trigger download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تنزيل المستند' : 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string | null, name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || mimeType?.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    }
    if (mimeType?.includes('pdf') || ext === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['doc', 'docx'].includes(ext) || mimeType?.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-600" />;
    }
    if (['xls', 'xlsx'].includes(ext) || mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
      return <FileText className="h-5 w-5 text-green-600" />;
    }
    return <File className="h-5 w-5 text-muted-foreground" />;
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; messageType?: string; mediaUrl?: string }) => {
      const response = await fetch(`/api/employee/threads/${activeThreadId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/threads', activeThreadId, 'messages', session?.token] });
      queryClient.invalidateQueries({ queryKey: ['/api/employee/threads', session?.token] });
      setNewMessage("");
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThreadId || !session) return;

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
      const isVideo = ['mp4', 'mov', 'webm'].includes(ext);
      const messageType = isImage ? 'image' : isVideo ? 'video' : 'file';

      // Get upload URL and objectPath from server
      const uploadRes = await fetch('/api/employee/upload/media', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ fileType: ext, fileSize: file.size }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.message || 'Failed to get upload URL');
      }
      const { uploadURL, objectPath } = await uploadRes.json();

      // Upload file directly to object storage
      await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Set ACL using objectPath (not the signed URL)
      const aclRes = await fetch('/api/employee/media', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ objectPath }),
      });

      if (!aclRes.ok) {
        const err = await aclRes.json();
        throw new Error(err.error || 'Failed to set media permissions');
      }
      const { objectPath: finalPath } = await aclRes.json();

      const contentLabel = isImage 
        ? (language === 'ar' ? 'صورة' : 'Image') 
        : isVideo 
          ? (language === 'ar' ? 'فيديو' : 'Video')
          : file.name;

      await sendMessageMutation.mutateAsync({
        content: contentLabel,
        messageType,
        mediaUrl: finalPath,
      });

      toast({
        title: language === 'ar' ? 'تم الرفع' : 'Uploaded',
        description: language === 'ar' ? 'تم إرسال الملف بنجاح' : 'File sent successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: error.message || (language === 'ar' ? 'فشل رفع الملف' : 'Failed to upload file'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createDirectChatMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await fetch('/api/employee/threads/direct', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ targetUserId }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to create chat');
      }
      return response.json();
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/threads', session?.token] });
      setActiveThreadId(thread.id);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: typeof composeData) => {
      const response = await fetch('/api/employee/emails', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        if (response.status === 401) {
          setSession(null);
          throw new Error('Session expired');
        }
        throw new Error('Failed to send email');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employee/emails/sent', session?.token] });
      setMailView("sent");
      setComposeData({ recipientId: "", subject: "", body: "" });
      toast({
        title: language === 'ar' ? 'تم الإرسال' : 'Sent',
        description: language === 'ar' ? 'تم إرسال البريد بنجاح' : 'Email sent successfully',
      });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/employee/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: language === 'ar' ? 'خطأ' : 'Error',
          description: error.message || (language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed'),
          variant: 'destructive',
        });
        return;
      }

      const data: EmployeeSession = await response.json();
      setSession(data);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل تسجيل الدخول' : 'Login failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (session) {
      try {
        await fetch('/api/employee/logout', {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    setSession(null);
    setEmail("");
    setActiveThreadId(null);
    queryClient.clear();
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && activeThreadId) {
      sendMessageMutation.mutate({ content: newMessage.trim() });
    }
  };

  const handleSendEmail = () => {
    if (composeData.recipientId && composeData.subject) {
      sendEmailMutation.mutate(composeData);
    }
  };

  const getStatusBadge = (status: string) => {
    const iconMargin = language === 'ar' ? 'ml-1' : 'mr-1';
    switch (status) {
      case "completed":
        return <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30"><CheckCircle2 className={`h-3 w-3 ${iconMargin}`} /> {language === 'ar' ? 'مكتمل' : 'Completed'}</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30"><Clock className={`h-3 w-3 ${iconMargin}`} /> {language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</Badge>;
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30"><AlertCircle className={`h-3 w-3 ${iconMargin}`} /> {language === 'ar' ? 'معلق' : 'Pending'}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">{language === 'ar' ? 'أولوية عالية' : 'High Priority'}</Badge>;
      case "medium":
        return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">{language === 'ar' ? 'متوسط' : 'Medium'}</Badge>;
      case "low":
        return <Badge variant="secondary">{language === 'ar' ? 'منخفض' : 'Low'}</Badge>;
      default:
        return null;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === "all") return true;
    return task.status === taskFilter;
  });

  const taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === "pending").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    completed: tasks.filter(t => t.status === "completed").length,
  };

  const getThreadName = (thread: EnhancedThread) => {
    if (thread.type === "group") return thread.name;
    const otherParticipants = thread.participants?.filter(p => p.id !== session?.user.id);
    if (otherParticipants && otherParticipants.length > 0) {
      const p = otherParticipants[0];
      return `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.email || (language === 'ar' ? 'مستخدم' : 'User');
    }
    return thread.name || (language === 'ar' ? 'محادثة' : 'Chat');
  };

  const getUserName = (user: UserType | TeamMember | null | undefined) => {
    if (!user) return language === 'ar' ? 'غير معروف' : 'Unknown';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || (language === 'ar' ? 'مستخدم' : 'User');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <img src={logoUrl} alt="DeskTown" className="h-8 w-8 object-contain" />
                <span className="font-semibold text-lg">{language === 'ar' ? 'بوابة الموظف' : 'Employee Portal'}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="h-8 w-8 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl">{language === 'ar' ? 'بوابة الموظف' : 'Employee Portal'}</CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أدخل بريدك الإلكتروني للوصول إلى مهامك ورسائلك' : 'Enter your email to access your tasks and messages'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Work Email'}</Label>
                  <div className="relative">
                    <Mail className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder={language === 'ar' ? 'بريدك@الشركة.com' : 'your.email@company.com'}
                      className={language === 'ar' ? 'pr-9' : 'pl-9'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      data-testid="input-employee-email"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoggingIn} data-testid="button-login">
                  {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {language === 'ar' ? 'دخول' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>

        <footer className="border-t bg-muted/50 py-6 pb-24">
          <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} DeskTown. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
          </div>
        </footer>

        {/* Bottom Navigation Bar */}
        <nav 
          className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-white/10"
          aria-label={language === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
          data-testid="nav-bottom-bar-login"
        >
          <div className="max-w-lg mx-auto px-4 py-2">
            <div className="flex items-center justify-around">
              <Link 
                href="/"
                className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
                data-testid="nav-bottom-home"
              >
                <Home className="h-5 w-5" />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
              </Link>
              <Link 
                href="/storefront"
                className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
                data-testid="nav-bottom-offices"
              >
                <Building2 className="h-5 w-5" />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'المكاتب' : 'Offices'}</span>
              </Link>
              <Link 
                href="/careers"
                className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
                data-testid="nav-bottom-careers"
              >
                <Briefcase className="h-5 w-5" />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'الوظائف' : 'Jobs'}</span>
              </Link>
              <Link 
                href="/employee-portal"
                className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
                data-testid="nav-bottom-employee"
              >
                <User className="h-5 w-5" />
                <span className="text-[10px] font-medium">{language === 'ar' ? 'الموظف' : 'Employee'}</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>
    );
  }

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="DeskTown" className="h-8 w-8 object-contain" />
              <span className="font-semibold text-lg">{language === 'ar' ? 'بوابة الموظف' : 'Employee Portal'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{session.user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
              {language === 'ar' ? 'تسجيل خروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 max-w-6xl">
        {/* Meeting Invitations Section */}
        {meetingInvites.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Video className="h-5 w-5 text-emerald-500" />
                </div>
                {language === 'ar' ? 'جميع الاجتماعات' : 'All Meetings'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meetingInvites.map((meeting) => {
                const meetingDate = new Date(meeting.startTime);
                const timeStr = meetingDate.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <Card key={meeting.id} className="border shadow-sm" data-testid={`card-meeting-${meeting.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base truncate">{meeting.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{timeStr}</span>
                            </div>
                            {meeting.location && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                <span>{meeting.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            className="gap-2 bg-cyan-500 hover:bg-cyan-600"
                            size="sm"
                            data-testid={`button-join-meeting-${meeting.id}`}
                            onClick={() => {
                              const roomId = `meeting-${meeting.id}`;
                              const userName = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email || 'Guest';
                              window.location.href = `/video-room/${roomId}?name=${encodeURIComponent(userName)}`;
                            }}
                          >
                            <Video className="h-4 w-4" />
                            {language === 'ar' ? 'انضمام' : 'Join'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="gap-2"
                            data-testid={`button-delete-meeting-${meeting.id}`}
                            onClick={() => declineMeetingMutation.mutate(meeting.id)}
                            disabled={declineMeetingMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="tasks" className="gap-2" data-testid="tab-main-tasks">
              <ClipboardList className="h-4 w-4" />
              {language === 'ar' ? 'المهام' : 'Tasks'}
              {taskStats.pending > 0 && <Badge variant="secondary" className="ml-1">{taskStats.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2" data-testid="tab-main-chat">
              <MessageCircle className="h-4 w-4" />
              {language === 'ar' ? 'المحادثات' : 'Chat'}
              {threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0) > 0 && (
                <Badge variant="secondary" className="ml-1">{threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0)}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="mail" className="gap-2" data-testid="tab-main-mail">
              <Mail className="h-4 w-4" />
              {language === 'ar' ? 'البريد' : 'Mail'}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2" data-testid="tab-main-documents">
              <FolderOpen className="h-4 w-4" />
              {language === 'ar' ? 'المستندات' : 'Documents'}
              {documents.length > 0 && <Badge variant="secondary" className="ml-1">{documents.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Card className="hover-elevate">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{taskStats.total}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-500">{taskStats.pending}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'معلق' : 'Pending'}</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-blue-500">{taskStats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</p>
                </CardContent>
              </Card>
              <Card className="hover-elevate">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-500">{taskStats.completed}</p>
                  <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مكتمل' : 'Completed'}</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              <Tabs value={taskFilter} onValueChange={setTaskFilter}>
                <TabsList>
                  <TabsTrigger value="all">{language === 'ar' ? 'الكل' : 'All'}</TabsTrigger>
                  <TabsTrigger value="pending">{language === 'ar' ? 'معلق' : 'Pending'}</TabsTrigger>
                  <TabsTrigger value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</TabsTrigger>
                  <TabsTrigger value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button variant="outline" size="sm" onClick={() => refetchTasks()}>
                <RefreshCw className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                {language === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
            </div>

            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="p-8 text-center">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground">
                  {tasks.length === 0 
                    ? (language === 'ar' ? 'لا توجد مهام مسندة إليك بعد' : 'No tasks assigned to you yet')
                    : (language === 'ar' ? 'لا توجد مهام تطابق هذا الفلتر' : 'No tasks match this filter')
                  }
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <Card key={task.id} className="hover-elevate" data-testid={`task-card-${task.id}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold">{task.title}</h3>
                            {task.priority && getPriorityBadge(task.priority)}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            {task.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {language === 'ar' ? 'الموعد' : 'Due'}: {new Date(task.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(task.status || 'pending')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[500px]">
              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{language === 'ar' ? 'المحادثات' : 'Conversations'}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => refetchThreads()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {threadsLoading ? (
                      <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="animate-pulse flex gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted"></div>
                            <div className="flex-1">
                              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                              <div className="h-3 bg-muted rounded w-3/4"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : threads.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {threads.map((thread) => (
                          <div
                            key={thread.id}
                            className={`p-3 cursor-pointer hover:bg-muted/50 ${activeThreadId === thread.id ? 'bg-muted' : ''}`}
                            onClick={() => setActiveThreadId(thread.id)}
                            data-testid={`thread-${thread.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{getThreadName(thread).substring(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm truncate">{getThreadName(thread)}</p>
                                  {(thread.unreadCount || 0) > 0 && (
                                    <Badge className="ml-2">{thread.unreadCount}</Badge>
                                  )}
                                </div>
                                {thread.lastMessage && (
                                  <p className="text-xs text-muted-foreground truncate">{thread.lastMessage.content}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="p-3 border-t">
                    <p className="text-xs text-muted-foreground mb-2">{language === 'ar' ? 'محادثة جديدة مع:' : 'New chat with:'}</p>
                    <Select onValueChange={(userId) => createDirectChatMutation.mutate(userId)}>
                      <SelectTrigger className="w-full" data-testid="select-new-chat">
                        <SelectValue placeholder={language === 'ar' ? 'اختر شخص' : 'Select person'} />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {getUserName(member)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 flex flex-col">
                {activeThreadId && activeThread ? (
                  <>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{getThreadName(activeThread).substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{getThreadName(activeThread)}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {activeThread.type === 'group' ? (
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {language === 'ar' ? 'مجموعة' : 'Group'}</span>
                            ) : (
                              language === 'ar' ? 'محادثة خاصة' : 'Private chat'
                            )}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                      <ScrollArea className="h-[300px] p-4">
                        {messagesLoading ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p className="text-sm">{language === 'ar' ? 'لا توجد رسائل' : 'No messages yet'}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {messages.map((msg) => {
                              const isOwnMessage = msg.senderId === session.user.id;
                              const isImage = msg.messageType === 'image';
                              const isVideo = msg.messageType === 'video';
                              const isFile = msg.messageType === 'file';
                              const hasMedia = msg.mediaUrl && (isImage || isVideo || isFile);
                              return (
                                <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${isOwnMessage ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {hasMedia ? (
                                      <div>
                                        {isImage && (
                                          <img 
                                            src={msg.mediaUrl!} 
                                            alt={msg.content || 'Image'} 
                                            className="max-w-full rounded-lg max-h-64 object-cover cursor-pointer"
                                            onClick={() => window.open(msg.mediaUrl!, '_blank')}
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.style.display = 'none';
                                              const fallback = target.nextElementSibling as HTMLElement;
                                              if (fallback) fallback.style.display = 'flex';
                                            }}
                                          />
                                        )}
                                        {isImage && (
                                          <div className="hidden items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                            <FileImage className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-sm">{language === 'ar' ? 'صورة غير متوفرة' : 'Image unavailable'}</span>
                                          </div>
                                        )}
                                        {isVideo && (
                                          <video 
                                            src={msg.mediaUrl!} 
                                            controls 
                                            className="max-w-full rounded-lg max-h-64"
                                          />
                                        )}
                                        {isFile && (
                                          <a 
                                            href={msg.mediaUrl!} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted"
                                          >
                                            <FileText className="h-5 w-5" />
                                            <span className="text-sm">{msg.content}</span>
                                          </a>
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-sm">{msg.content}</p>
                                    )}
                                    <p className="text-xs opacity-70 mt-1">
                                      {msg.createdAt && formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: dateLocale })}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                    <div className="p-3 border-t flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                        className="hidden"
                        data-testid="input-file-upload"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        data-testid="button-attach-file"
                      >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                      </Button>
                      <Input
                        placeholder={language === 'ar' ? 'اكتب رسالة...' : 'Type a message...'}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                        data-testid="input-chat-message"
                      />
                      <Button onClick={handleSendMessage} disabled={sendMessageMutation.isPending || !newMessage.trim()} data-testid="button-send-message">
                        {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>{language === 'ar' ? 'اختر محادثة للبدء' : 'Select a conversation to start'}</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="mail" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="md:col-span-1">
                <CardContent className="p-3 space-y-2">
                  <Button 
                    variant={mailView === "compose" ? "default" : "outline"} 
                    className="w-full justify-start gap-2" 
                    onClick={() => setMailView("compose")}
                    data-testid="button-compose-email"
                  >
                    <Plus className="h-4 w-4" />
                    {language === 'ar' ? 'إنشاء رسالة' : 'Compose'}
                  </Button>
                  <Button 
                    variant={mailView === "inbox" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2" 
                    onClick={() => setMailView("inbox")}
                  >
                    <Inbox className="h-4 w-4" />
                    {language === 'ar' ? 'صندوق الوارد' : 'Inbox'}
                    {inboxEmails.length > 0 && <Badge variant="secondary" className="ml-auto">{inboxEmails.length}</Badge>}
                  </Button>
                  <Button 
                    variant={mailView === "sent" ? "secondary" : "ghost"} 
                    className="w-full justify-start gap-2" 
                    onClick={() => setMailView("sent")}
                  >
                    <SendHorizontal className="h-4 w-4" />
                    {language === 'ar' ? 'المرسلة' : 'Sent'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardContent className="p-4">
                  {mailView === "compose" ? (
                    <div className="space-y-4">
                      <h3 className="font-semibold">{language === 'ar' ? 'رسالة جديدة' : 'New Email'}</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>{language === 'ar' ? 'إلى' : 'To'}</Label>
                          <Select value={composeData.recipientId} onValueChange={(v) => setComposeData(d => ({ ...d, recipientId: v }))}>
                            <SelectTrigger data-testid="select-email-recipient">
                              <SelectValue placeholder={language === 'ar' ? 'اختر المستلم' : 'Select recipient'} />
                            </SelectTrigger>
                            <SelectContent>
                              {teamMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {getUserName(member)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{language === 'ar' ? 'الموضوع' : 'Subject'}</Label>
                          <Input
                            value={composeData.subject}
                            onChange={(e) => setComposeData(d => ({ ...d, subject: e.target.value }))}
                            placeholder={language === 'ar' ? 'أدخل الموضوع' : 'Enter subject'}
                            data-testid="input-email-subject"
                          />
                        </div>
                        <div>
                          <Label>{language === 'ar' ? 'الرسالة' : 'Message'}</Label>
                          <Textarea
                            value={composeData.body}
                            onChange={(e) => setComposeData(d => ({ ...d, body: e.target.value }))}
                            placeholder={language === 'ar' ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                            rows={8}
                            data-testid="input-email-body"
                          />
                        </div>
                        <Button onClick={handleSendEmail} disabled={sendEmailMutation.isPending || !composeData.recipientId || !composeData.subject} data-testid="button-send-email">
                          {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                          {language === 'ar' ? 'إرسال' : 'Send'}
                        </Button>
                      </div>
                    </div>
                  ) : mailView === "inbox" ? (
                    <div>
                      <h3 className="font-semibold mb-4">{language === 'ar' ? 'صندوق الوارد' : 'Inbox'}</h3>
                      {inboxLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
                          ))}
                        </div>
                      ) : inboxEmails.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Inbox className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>{language === 'ar' ? 'لا توجد رسائل' : 'No emails'}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {inboxEmails.map((email) => (
                            <Card key={email.id} className="hover-elevate" data-testid={`email-inbox-${email.id}`}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{email.subject}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {language === 'ar' ? 'من:' : 'From:'} {getUserName(email.sender)}
                                    </p>
                                    {email.body && <p className="text-xs text-muted-foreground mt-1 truncate">{email.body}</p>}
                                  </div>
                                  <p className="text-xs text-muted-foreground flex-shrink-0">
                                    {email.createdAt && formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: dateLocale })}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <h3 className="font-semibold mb-4">{language === 'ar' ? 'المرسلة' : 'Sent'}</h3>
                      {sentLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
                          ))}
                        </div>
                      ) : sentEmails.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <SendHorizontal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>{language === 'ar' ? 'لا توجد رسائل مرسلة' : 'No sent emails'}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sentEmails.map((email) => (
                            <Card key={email.id} className="hover-elevate" data-testid={`email-sent-${email.id}`}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{email.subject}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {language === 'ar' ? 'إلى:' : 'To:'} {getUserName(email.recipient)}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground flex-shrink-0">
                                    {email.createdAt && formatDistanceToNow(new Date(email.createdAt), { addSuffix: true, locale: dateLocale })}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{language === 'ar' ? 'مستنداتي' : 'My Documents'}</CardTitle>
                    <CardDescription>
                      {language === 'ar' 
                        ? 'قم برفع وإدارة مستنداتك الشخصية بشكل آمن'
                        : 'Upload and manage your personal documents securely'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => refetchDocuments()}>
                      <RefreshCw className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      {language === 'ar' ? 'تحديث' : 'Refresh'}
                    </Button>
                    <input
                      ref={docFileInputRef}
                      type="file"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                      onChange={handleDocumentUpload}
                      data-testid="input-document-file"
                    />
                    <Button 
                      onClick={() => docFileInputRef.current?.click()} 
                      disabled={isUploadingDoc}
                      data-testid="button-upload-document"
                    >
                      {isUploadingDoc ? (
                        <Loader2 className={`h-4 w-4 animate-spin ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      ) : (
                        <Upload className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
                      )}
                      {language === 'ar' ? 'رفع مستند' : 'Upload Document'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse h-16 bg-muted rounded"></div>
                    ))}
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2">
                      {language === 'ar' ? 'لا توجد مستندات بعد' : 'No documents yet'}
                    </p>
                    <p className="text-sm">
                      {language === 'ar' 
                        ? 'ارفع مستنداتك الشخصية للوصول إليها بأمان'
                        : 'Upload your personal documents for secure access'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="hover-elevate" data-testid={`document-card-${doc.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {getFileIcon(doc.mimeType, doc.originalName)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate" title={doc.originalName}>
                                  {doc.originalName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{formatFileSize(doc.fileSize)}</span>
                                  <span>•</span>
                                  <span>
                                    {doc.createdAt && formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true, locale: dateLocale })}
                                  </span>
                                </div>
                                {doc.description && (
                                  <p className="text-xs text-muted-foreground mt-1 truncate">{doc.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDocumentDownload(doc)}
                                title={language === 'ar' ? 'تنزيل' : 'Download'}
                                data-testid={`button-download-doc-${doc.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                disabled={deleteDocumentMutation.isPending}
                                title={language === 'ar' ? 'حذف' : 'Delete'}
                                data-testid={`button-delete-doc-${doc.id}`}
                              >
                                {deleteDocumentMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{language === 'ar' ? 'أنواع الملفات المدعومة' : 'Supported File Types'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'TXT', 'CSV', 'JPG', 'PNG', 'GIF'].map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {language === 'ar' ? 'الحد الأقصى لحجم الملف: 50 ميجابايت' : 'Maximum file size: 50MB'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t bg-muted/50 py-6 pb-24 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} DeskTown. {language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
        </div>
      </footer>

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-white/10"
        aria-label={language === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
        data-testid="nav-bottom-bar"
      >
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            <Link 
              href="/"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-home"
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <Link 
              href="/storefront"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-offices"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'المكاتب' : 'Offices'}</span>
            </Link>
            <Link 
              href="/careers"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-careers"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'الوظائف' : 'Jobs'}</span>
            </Link>
            <Link 
              href="/employee-portal"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-employee"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'الموظف' : 'Employee'}</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
