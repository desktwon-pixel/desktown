import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/UserAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import {
  MessageSquare,
  Mail,
  CheckSquare,
  Calendar,
  Users,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Inbox,
  Send,
  Video,
  Briefcase,
  Rss,
  Building2,
  Circle,
  Calculator,
  FileText,
  TrendingUp,
  Receipt,
  CreditCard,
  Award,
  UserCheck,
  ClipboardList,
  GraduationCap,
  Shield,
  FileSearch,
  FolderOpen,
  BookOpen,
  Gavel,
  Target,
  BarChart3,
  Share2,
  Palette,
  Package,
  ListChecks,
  Gauge,
  Truck,
  Wrench,
  PieChart,
  Bell,
  Settings,
  Megaphone,
  Scale,
  HeartHandshake,
  DollarSign,
  Hammer,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, translations } from "@/lib/i18n";
import type { Task, User, Meeting, ChatThread, Message } from "@shared/schema";
import { format, formatDistanceToNow, isToday, isPast } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Tool {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: typeof Calculator;
  color: string;
}

const departmentTools: Record<string, Tool[]> = {
  calculator: [
    { id: "budget", name: "Budget Planner", nameAr: "مخطط الميزانية", description: "Plan and track departmental budgets", descriptionAr: "تخطيط وتتبع ميزانيات القسم", icon: Calculator, color: "text-blue-500" },
    { id: "expenses", name: "Expense Tracker", nameAr: "متتبع المصروفات", description: "Log and categorize expenses", descriptionAr: "تسجيل وتصنيف المصروفات", icon: Receipt, color: "text-green-500" },
    { id: "invoices", name: "Invoice Manager", nameAr: "مدير الفواتير", description: "Create and manage invoices", descriptionAr: "إنشاء وإدارة الفواتير", icon: FileText, color: "text-purple-500" },
    { id: "reports", name: "Financial Reports", nameAr: "التقارير المالية", description: "Generate financial summaries", descriptionAr: "إنشاء ملخصات مالية", icon: TrendingUp, color: "text-orange-500" },
    { id: "payroll", name: "Payroll Calculator", nameAr: "حاسبة الرواتب", description: "Calculate employee payments", descriptionAr: "حساب مدفوعات الموظفين", icon: CreditCard, color: "text-pink-500" },
    { id: "forecast", name: "Cash Flow Forecast", nameAr: "توقع التدفق النقدي", description: "Project future cash flows", descriptionAr: "توقع التدفقات النقدية المستقبلية", icon: PieChart, color: "text-cyan-500" },
  ],
  hearthandshake: [
    { id: "leave", name: "Leave Tracker", nameAr: "متتبع الإجازات", description: "Manage employee leave requests", descriptionAr: "إدارة طلبات إجازات الموظفين", icon: Clock, color: "text-blue-500" },
    { id: "performance", name: "Performance Reviews", nameAr: "تقييم الأداء", description: "Track employee evaluations", descriptionAr: "تتبع تقييمات الموظفين", icon: Award, color: "text-yellow-500" },
    { id: "directory", name: "Employee Directory", nameAr: "دليل الموظفين", description: "Searchable employee database", descriptionAr: "قاعدة بيانات الموظفين", icon: Users, color: "text-green-500" },
    { id: "recruitment", name: "Recruitment Pipeline", nameAr: "خط التوظيف", description: "Track hiring progress", descriptionAr: "تتبع تقدم التوظيف", icon: UserCheck, color: "text-purple-500" },
    { id: "training", name: "Training Manager", nameAr: "مدير التدريب", description: "Organize training programs", descriptionAr: "تنظيم برامج التدريب", icon: GraduationCap, color: "text-orange-500" },
    { id: "onboarding", name: "Onboarding Checklist", nameAr: "قائمة التهيئة", description: "New hire onboarding tasks", descriptionAr: "مهام تهيئة الموظفين الجدد", icon: ClipboardList, color: "text-pink-500" },
  ],
  scale: [
    { id: "contracts", name: "Contract Templates", nameAr: "نماذج العقود", description: "Legal document templates", descriptionAr: "نماذج المستندات القانونية", icon: FileText, color: "text-blue-500" },
    { id: "compliance", name: "Compliance Checklist", nameAr: "قائمة الامتثال", description: "Regulatory requirements tracker", descriptionAr: "متتبع المتطلبات التنظيمية", icon: Shield, color: "text-green-500" },
    { id: "cases", name: "Case Tracker", nameAr: "متتبع القضايا", description: "Manage legal cases and matters", descriptionAr: "إدارة القضايا القانونية", icon: FileSearch, color: "text-purple-500" },
    { id: "documents", name: "Document Repository", nameAr: "مستودع المستندات", description: "Secure legal document storage", descriptionAr: "تخزين آمن للمستندات القانونية", icon: FolderOpen, color: "text-orange-500" },
    { id: "policies", name: "Policy Manager", nameAr: "مدير السياسات", description: "Company policy management", descriptionAr: "إدارة سياسات الشركة", icon: BookOpen, color: "text-cyan-500" },
    { id: "disputes", name: "Dispute Resolution", nameAr: "حل النزاعات", description: "Track and resolve disputes", descriptionAr: "تتبع وحل النزاعات", icon: Gavel, color: "text-red-500" },
  ],
  megaphone: [
    { id: "campaigns", name: "Campaign Tracker", nameAr: "متتبع الحملات", description: "Monitor marketing campaigns", descriptionAr: "مراقبة الحملات التسويقية", icon: Target, color: "text-blue-500" },
    { id: "content", name: "Content Calendar", nameAr: "تقويم المحتوى", description: "Plan content schedule", descriptionAr: "جدولة المحتوى", icon: Calendar, color: "text-green-500" },
    { id: "analytics", name: "Analytics Dashboard", nameAr: "لوحة التحليلات", description: "Track marketing metrics", descriptionAr: "تتبع مقاييس التسويق", icon: BarChart3, color: "text-purple-500" },
    { id: "social", name: "Social Media Manager", nameAr: "مدير وسائل التواصل", description: "Manage social accounts", descriptionAr: "إدارة حسابات التواصل الاجتماعي", icon: Share2, color: "text-pink-500" },
    { id: "brand", name: "Brand Assets", nameAr: "أصول العلامة التجارية", description: "Brand guidelines and assets", descriptionAr: "إرشادات وأصول العلامة التجارية", icon: Palette, color: "text-orange-500" },
    { id: "leads", name: "Lead Generation", nameAr: "توليد العملاء المحتملين", description: "Track marketing leads", descriptionAr: "تتبع العملاء المحتملين", icon: TrendingUp, color: "text-cyan-500" },
  ],
  settings: [
    { id: "projects", name: "Project Tracker", nameAr: "متتبع المشاريع", description: "Monitor project progress", descriptionAr: "مراقبة تقدم المشاريع", icon: ListChecks, color: "text-blue-500" },
    { id: "inventory", name: "Inventory Manager", nameAr: "مدير المخزون", description: "Track stock and supplies", descriptionAr: "تتبع المخزون والإمدادات", icon: Package, color: "text-green-500" },
    { id: "processes", name: "Process Documentation", nameAr: "توثيق العمليات", description: "Document workflows", descriptionAr: "توثيق سير العمل", icon: BookOpen, color: "text-purple-500" },
    { id: "quality", name: "Quality Metrics", nameAr: "مقاييس الجودة", description: "Track quality standards", descriptionAr: "تتبع معايير الجودة", icon: Gauge, color: "text-orange-500" },
    { id: "vendors", name: "Vendor Management", nameAr: "إدارة الموردين", description: "Manage supplier relationships", descriptionAr: "إدارة علاقات الموردين", icon: Truck, color: "text-cyan-500" },
    { id: "maintenance", name: "Maintenance Scheduler", nameAr: "جدولة الصيانة", description: "Schedule equipment maintenance", descriptionAr: "جدولة صيانة المعدات", icon: Wrench, color: "text-red-500" },
  ],
  dollarSign: [
    { id: "pipeline", name: "Sales Pipeline", nameAr: "خط أنابيب المبيعات", description: "Track deals and opportunities", descriptionAr: "تتبع الصفقات والفرص", icon: TrendingUp, color: "text-blue-500" },
    { id: "leads", name: "Lead Tracker", nameAr: "متتبع العملاء المحتملين", description: "Manage sales leads", descriptionAr: "إدارة العملاء المحتملين", icon: Target, color: "text-green-500" },
    { id: "quotes", name: "Quote Generator", nameAr: "منشئ العروض", description: "Create sales proposals", descriptionAr: "إنشاء عروض المبيعات", icon: FileText, color: "text-purple-500" },
    { id: "clients", name: "Client Database", nameAr: "قاعدة بيانات العملاء", description: "Customer relationship manager", descriptionAr: "إدارة علاقات العملاء", icon: Users, color: "text-orange-500" },
    { id: "commission", name: "Commission Calculator", nameAr: "حاسبة العمولات", description: "Calculate sales commissions", descriptionAr: "حساب عمولات المبيعات", icon: Calculator, color: "text-pink-500" },
    { id: "forecasts", name: "Sales Forecasts", nameAr: "توقعات المبيعات", description: "Project future sales", descriptionAr: "توقع المبيعات المستقبلية", icon: PieChart, color: "text-cyan-500" },
  ],
  users: [
    { id: "calendar", name: "Team Calendar", nameAr: "تقويم الفريق", description: "Shared team schedule", descriptionAr: "جدول الفريق المشترك", icon: Calendar, color: "text-blue-500" },
    { id: "resources", name: "Resource Allocation", nameAr: "توزيع الموارد", description: "Assign team resources", descriptionAr: "تعيين موارد الفريق", icon: Users, color: "text-green-500" },
    { id: "meetings", name: "Meeting Scheduler", nameAr: "جدولة الاجتماعات", description: "Plan team meetings", descriptionAr: "تخطيط اجتماعات الفريق", icon: Clock, color: "text-purple-500" },
    { id: "board", name: "Collaboration Board", nameAr: "لوحة التعاون", description: "Team task board", descriptionAr: "لوحة مهام الفريق", icon: ListChecks, color: "text-orange-500" },
    { id: "analytics", name: "Team Analytics", nameAr: "تحليلات الفريق", description: "Team performance metrics", descriptionAr: "مقاييس أداء الفريق", icon: BarChart3, color: "text-pink-500" },
    { id: "chat", name: "Team Chat", nameAr: "محادثة الفريق", description: "Internal messaging", descriptionAr: "الرسائل الداخلية", icon: MessageSquare, color: "text-cyan-500" },
  ],
  briefcase: [
    { id: "tasks", name: "Task Board", nameAr: "لوحة المهام", description: "Manage team tasks", descriptionAr: "إدارة مهام الفريق", icon: ListChecks, color: "text-blue-500" },
    { id: "notes", name: "Team Notes", nameAr: "ملاحظات الفريق", description: "Shared documentation", descriptionAr: "التوثيق المشترك", icon: FileText, color: "text-green-500" },
    { id: "files", name: "File Manager", nameAr: "مدير الملفات", description: "Organize team files", descriptionAr: "تنظيم ملفات الفريق", icon: FolderOpen, color: "text-purple-500" },
    { id: "calendar", name: "Department Calendar", nameAr: "تقويم القسم", description: "Schedule and events", descriptionAr: "الجدول والفعاليات", icon: Calendar, color: "text-orange-500" },
    { id: "announcements", name: "Announcements", nameAr: "الإعلانات", description: "Team updates and news", descriptionAr: "تحديثات وأخبار الفريق", icon: Bell, color: "text-pink-500" },
    { id: "directory", name: "Contact Directory", nameAr: "دليل جهات الاتصال", description: "Quick contact lookup", descriptionAr: "البحث السريع عن جهات الاتصال", icon: Users, color: "text-cyan-500" },
  ],
};

const departmentNameToIcon: Record<string, string> = {
  "Finance": "calculator",
  "المالية": "calculator",
  "HR": "hearthandshake",
  "Human Resources": "hearthandshake",
  "الموارد البشرية": "hearthandshake",
  "Legal": "scale",
  "القانونية": "scale",
  "Marketing": "megaphone",
  "التسويق": "megaphone",
  "Operations": "settings",
  "العمليات": "settings",
  "Sales": "dollarSign",
  "المبيعات": "dollarSign",
  "Team": "users",
  "الفريق": "users",
  "General": "briefcase",
  "عام": "briefcase",
  "IT": "settings",
  "تقنية المعلومات": "settings",
  "Engineering": "settings",
  "الهندسة": "settings",
};

interface EnhancedThread extends ChatThread {
  lastMessage?: Message;
  unreadCount?: number;
  participants?: User[];
}

interface EmailWithUsers {
  id: number;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender?: User;
}

export default function MyWorkspace() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const dateLocale = language === 'ar' ? ar : enUS;

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/me/tasks"],
  });

  const { data: threads = [], isLoading: threadsLoading } = useQuery<EnhancedThread[]>({
    queryKey: ["/api/threads"],
  });

  const { data: emails = [], isLoading: emailsLoading } = useQuery<EmailWithUsers[]>({
    queryKey: ["/api/emails/inbox"],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const displayName = user 
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "User"
    : "User";

  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");
  const overdueTasks = tasks.filter(t => 
    t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed"
  );

  const unreadMessages = threads.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0);
  const unreadEmails = emails.filter(e => !e.isRead).length;
  const upcomingMeetings = meetings.filter(m => new Date(m.startTime) > new Date());

  const quickLinks = [
    { title: language === 'ar' ? 'المهام' : 'Tasks', icon: CheckSquare, href: '/tasks', color: 'from-blue-500 to-cyan-500' },
    { title: language === 'ar' ? 'الرسائل' : 'Messages', icon: MessageSquare, href: '/messages', color: 'from-green-500 to-emerald-500', badge: unreadMessages },
    { title: language === 'ar' ? 'البريد' : 'Mail', icon: Mail, href: '/mail', color: 'from-purple-500 to-violet-500', badge: unreadEmails },
    { title: language === 'ar' ? 'الاجتماعات' : 'Meetings', icon: Video, href: '/meetings', color: 'from-orange-500 to-amber-500', badge: upcomingMeetings.length },
    { title: language === 'ar' ? 'الفريق' : 'Team', icon: Users, href: '/team', color: 'from-pink-500 to-rose-500' },
    { title: language === 'ar' ? 'الأقسام' : 'Departments', icon: Building2, href: '/departments', color: 'from-teal-500 to-cyan-500' },
    { title: language === 'ar' ? 'آخر الأخبار' : 'Feed', icon: Rss, href: '/feed', color: 'from-indigo-500 to-purple-500' },
    { title: language === 'ar' ? 'الملف التعريفي' : 'Profile', icon: Briefcase, href: '/my-profile', color: 'from-slate-500 to-gray-500' },
  ];

  const userDepartment = user?.department || "General";
  const departmentIcon = departmentNameToIcon[userDepartment] || "briefcase";
  const userTools = departmentTools[departmentIcon] || departmentTools.briefcase;

  const [replyingToThread, setReplyingToThread] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async ({ threadId, content }: { threadId: number; content: string }) => {
      await apiRequest("POST", `/api/threads/${threadId}/messages`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads"] });
      setReplyText("");
      setReplyingToThread(null);
    },
  });

  const getParticipantName = (thread: EnhancedThread) => {
    if ((thread as any).isGroup) return thread.name || (language === 'ar' ? 'مجموعة' : 'Group');
    const other = thread.participants?.find(p => p.id !== user?.id);
    if (other) return `${other.firstName || ''} ${other.lastName || ''}`.trim() || other.email || (language === 'ar' ? 'مستخدم' : 'User');
    return language === 'ar' ? 'محادثة' : 'Chat';
  };

  const handleQuickReply = (threadId: number) => {
    if (!replyText.trim()) return;
    sendMessageMutation.mutate({ threadId, content: replyText.trim() });
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
          <p className="text-muted-foreground">{language === 'ar' ? 'يرجى تسجيل الدخول لعرض مساحة العمل' : 'Please log in to view your workspace'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          <AvatarImage src={user.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-welcome-name">
            {language === 'ar' ? `مرحباً، ${displayName}` : `Welcome, ${displayName}`}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'مساحة العمل الخاصة بك' : 'Your personal workspace'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: language === 'ar' ? 'المهام النشطة' : 'Active Tasks', value: inProgressTasks.length + pendingTasks.length, icon: CheckSquare, color: 'text-blue-500' },
          { label: language === 'ar' ? 'رسائل غير مقروءة' : 'Unread Messages', value: unreadMessages, icon: MessageSquare, color: 'text-green-500' },
          { label: language === 'ar' ? 'بريد غير مقروء' : 'Unread Emails', value: unreadEmails, icon: Mail, color: 'text-purple-500' },
          { label: language === 'ar' ? 'اجتماعات قادمة' : 'Upcoming Meetings', value: upcomingMeetings.length, icon: Calendar, color: 'text-orange-500' },
        ].map((stat, i) => (
          <Card key={i} className="glass border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Video Call Section */}
      {(() => {
        const manager = allUsers.find(u => u.role === 'manager');
        const managerRoomId = manager ? `office-${manager.id.slice(0, 8)}` : 'team-room';
        const managerName = manager ? `${manager.firstName || ''} ${manager.lastName || ''}`.trim() : (language === 'ar' ? 'المدير' : 'Manager');
        
        return (
          <Card className="glass border-white/5 border-l-4 border-l-violet-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                    <Video className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {language === 'ar' ? `قاعة اجتماعات ${managerName}` : `${managerName}'s Meeting Room`}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ar' ? 'انضم للاتصال المرئي مع الفريق والمدير' : 'Join video call with team and manager'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/video-room/${managerRoomId}`}>
                    <Button className="gap-2" data-testid="button-join-manager-room">
                      <Video className="h-4 w-4" />
                      {language === 'ar' ? 'انضمام الآن' : 'Join Now'}
                    </Button>
                  </Link>
                  <Link href="/meetings">
                    <Button variant="outline" className="gap-2" data-testid="button-view-meetings">
                      <Calendar className="h-4 w-4" />
                      {language === 'ar' ? 'الاجتماعات المجدولة' : 'Scheduled Meetings'}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {quickLinks.map((link, i) => (
          <Link key={i} href={link.href}>
            <Card className="glass border-white/5 hover-elevate cursor-pointer transition-all h-full">
              <CardContent className="p-3 flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${link.color} mb-2`}>
                  <link.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-medium">{link.title}</span>
                {link.badge ? (
                  <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                    {link.badge}
                  </Badge>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Department Tools Section */}
      <Card className="glass border-white/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Hammer className="h-4 w-4 text-primary" />
              {language === 'ar' ? `أدوات قسم ${userDepartment}` : `${userDepartment} Tools`}
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {userTools.length} {language === 'ar' ? 'أداة' : 'tools'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {userTools.map((tool) => (
              <div
                key={tool.id}
                className="flex flex-col items-center p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-center"
                data-testid={`tool-${tool.id}`}
              >
                <div className={`p-2 rounded-lg bg-white/10 mb-2`}>
                  <tool.icon className={`h-5 w-5 ${tool.color}`} />
                </div>
                <span className="text-xs font-medium">
                  {language === 'ar' ? tool.nameAr : tool.name}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {language === 'ar' ? tool.descriptionAr : tool.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-blue-500" />
                {language === 'ar' ? 'المهام الحالية' : 'Current Tasks'}
              </CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-xs">
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  <ArrowRight className={`h-3 w-3 ${language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'}`} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {tasksLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : tasks.filter(t => t.status !== 'completed').length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{language === 'ar' ? 'لا توجد مهام حالية' : 'No current tasks'}</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => {
                    const creator = allUsers.find(u => u.id === (task as any).creatorId);
                    const creatorName = creator 
                      ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email 
                      : null;
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" data-testid={`task-item-${task.id}`}>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <Badge variant="outline" className="text-[10px] py-0">
                              {task.status === 'pending' ? (language === 'ar' ? 'معلق' : 'Pending') : (language === 'ar' ? 'قيد التنفيذ' : 'In Progress')}
                            </Badge>
                            {creatorName && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span className="truncate max-w-[80px]" title={creatorName}>
                                  {language === 'ar' ? `من: ${creatorName}` : `By: ${creatorName}`}
                                </span>
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={isPast(new Date(task.dueDate)) && task.status !== 'completed' ? 'text-red-500' : ''}>
                                <Clock className="h-3 w-3 inline mr-0.5" />
                                {format(new Date(task.dueDate), 'MMM d', { locale: dateLocale })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-green-500" />
                {language === 'ar' ? 'المحادثات الأخيرة' : 'Recent Chats'}
              </CardTitle>
              <Link href="/messages">
                <Button variant="ghost" size="sm" className="text-xs">
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  <ArrowRight className={`h-3 w-3 ${language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'}`} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {threadsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{language === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {threads.slice(0, 5).map(thread => (
                    <div key={thread.id} className="rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div 
                        className="flex items-center gap-3 p-2 cursor-pointer"
                        onClick={() => setReplyingToThread(replyingToThread === thread.id ? null : thread.id)}
                        data-testid={`chat-thread-${thread.id}`}
                      >
                        <div className="relative">
                          <UserAvatar 
                            name={getParticipantName(thread)} 
                            avatar={thread.participants?.[0]?.profileImageUrl}
                            size="sm" 
                          />
                          {(thread.unreadCount || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-[10px] rounded-full flex items-center justify-center text-white">
                              {thread.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{getParticipantName(thread)}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {thread.lastMessage?.content || (language === 'ar' ? 'لا توجد رسائل' : 'No messages')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {thread.lastMessage?.createdAt && (
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: false, locale: dateLocale })}
                            </span>
                          )}
                          <Link href="/messages">
                            <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`link-messages-${thread.id}`}>
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                      {replyingToThread === thread.id && (
                        <div className="px-2 pb-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Input
                            placeholder={language === 'ar' ? 'اكتب ردك...' : 'Type your reply...'}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleQuickReply(thread.id);
                              }
                            }}
                            className="flex-1 h-8 text-sm"
                            data-testid={`input-quick-reply-${thread.id}`}
                          />
                          <Button
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleQuickReply(thread.id)}
                            disabled={!replyText.trim() || sendMessageMutation.isPending}
                            data-testid={`button-send-reply-${thread.id}`}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-500" />
                {language === 'ar' ? 'البريد الوارد' : 'Inbox'}
              </CardTitle>
              <Link href="/mail">
                <Button variant="ghost" size="sm" className="text-xs">
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  <ArrowRight className={`h-3 w-3 ${language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'}`} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {emailsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : emails.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{language === 'ar' ? 'لا يوجد بريد' : 'No emails'}</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {emails.slice(0, 5).map(email => (
                    <Link key={email.id} href="/mail">
                      <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer ${
                        email.isRead ? 'bg-white/5 hover:bg-white/10' : 'bg-primary/5 hover:bg-primary/10'
                      }`}>
                        {!email.isRead && <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!email.isRead ? 'font-semibold' : 'font-medium'}`}>
                            {email.subject || (language === 'ar' ? 'بدون موضوع' : 'No Subject')}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {email.sender ? `${email.sender.firstName || ''} ${email.sender.lastName || ''}`.trim() || email.sender.email : (language === 'ar' ? 'مرسل غير معروف' : 'Unknown Sender')}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(email.createdAt), { addSuffix: false, locale: dateLocale })}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-4 w-4 text-orange-500" />
                {language === 'ar' ? 'الاجتماعات القادمة' : 'Upcoming Meetings'}
              </CardTitle>
              <Link href="/meetings">
                <Button variant="ghost" size="sm" className="text-xs">
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  <ArrowRight className={`h-3 w-3 ${language === 'ar' ? 'mr-1 rotate-180' : 'ml-1'}`} />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {meetingsLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : upcomingMeetings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{language === 'ar' ? 'لا توجد اجتماعات قادمة' : 'No upcoming meetings'}</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {upcomingMeetings.slice(0, 5).map(meeting => (
                    <div key={meeting.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <Video className="h-4 w-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{meeting.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(meeting.startTime), 'MMM d, HH:mm', { locale: dateLocale })}
                        </p>
                      </div>
                      {isToday(new Date(meeting.startTime)) && (
                        <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 text-[10px]">
                          {language === 'ar' ? 'اليوم' : 'Today'}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
