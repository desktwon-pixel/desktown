import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  CheckSquare, 
  Calendar,
  Zap,
  Percent,
  Users,
  Bell,
  Building2,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Newspaper,
  FolderOpen,
} from "lucide-react";
import { Link } from "wouter";
import { UserAvatar } from "@/components/UserAvatar";
import { GroupChatPanel } from "@/components/GroupChatPanel";
import type { Task, Meeting, Transaction, User } from "@shared/schema";
import { useState } from "react";
import { useLanguage, translations } from "@/lib/i18n";
import { 
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function FollowUp() {
  const { language } = useLanguage();
  const t = translations[language];
  const [activityPeriod, setActivityPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const { data: currentUser, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: emailUnreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/emails/unread-count'],
    refetchInterval: 30000,
  });

  const { data: threads = [] } = useQuery<{ id: number; unreadCount: number; participants: { id: string; firstName?: string | null; lastName?: string | null; email?: string }[]; lastMessage?: { content?: string } | null }[]>({
    queryKey: ['/api/threads'],
    refetchInterval: 30000,
  });

  const userName = currentUser 
    ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'User'
    : 'User';
  
  const today = new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const unreadEmailCount = emailUnreadData?.count || 0;
  const activeTasks = tasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
  const upcomingMeetings = meetings.filter(m => new Date(m.startTime) > new Date()).length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalRevenue = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
  const netBalance = totalRevenue - totalExpenses;
  const isLoss = netBalance < 0;

  const latestThread = threads[0];

  const weeklyActivityData = language === 'ar' ? [
    { day: "سبت", value1: 50, value2: 30 },
    { day: "جمعة", value1: 70, value2: 45 },
    { day: "خميس", value1: 40, value2: 55 },
    { day: "أربعاء", value1: 60, value2: 50 },
    { day: "ثلاثاء", value1: 45, value2: 35 },
    { day: "إثنين", value1: 30, value2: 20 },
    { day: "أحد", value1: 35, value2: 25 },
  ] : [
    { day: "Sun", value1: 35, value2: 25 },
    { day: "Mon", value1: 30, value2: 20 },
    { day: "Tue", value1: 45, value2: 35 },
    { day: "Wed", value1: 60, value2: 50 },
    { day: "Thu", value1: 40, value2: 55 },
    { day: "Fri", value1: 70, value2: 45 },
    { day: "Sat", value1: 50, value2: 30 },
  ];

  const monthlyActivityData = [
    { day: language === 'ar' ? "الأسبوع 1" : "Week 1", value1: 150, value2: 120 },
    { day: language === 'ar' ? "الأسبوع 2" : "Week 2", value1: 200, value2: 180 },
    { day: language === 'ar' ? "الأسبوع 3" : "Week 3", value1: 180, value2: 150 },
    { day: language === 'ar' ? "الأسبوع 4" : "Week 4", value1: 220, value2: 200 },
  ];

  const yearlyActivityData = [
    { day: language === 'ar' ? "يناير" : "Jan", value1: 120, value2: 100 },
    { day: language === 'ar' ? "فبراير" : "Feb", value1: 150, value2: 130 },
    { day: language === 'ar' ? "مارس" : "Mar", value1: 180, value2: 160 },
    { day: language === 'ar' ? "أبريل" : "Apr", value1: 200, value2: 180 },
    { day: language === 'ar' ? "مايو" : "May", value1: 170, value2: 150 },
    { day: language === 'ar' ? "يونيو" : "Jun", value1: 190, value2: 170 },
  ];

  const getActivityData = () => {
    switch (activityPeriod) {
      case 'monthly': return monthlyActivityData;
      case 'yearly': return yearlyActivityData;
      default: return weeklyActivityData;
    }
  };

  const kpiCards = [
    {
      icon: Mail,
      label: t.followUp?.unreadEmail || "UNREAD EMAIL",
      value: unreadEmailCount,
      color: "bg-purple-100 text-purple-600",
      iconBg: "bg-purple-500",
    },
    {
      icon: CheckSquare,
      label: t.followUp?.activeTasks || "ACTIVE TASKS",
      value: activeTasks,
      color: "bg-white",
      showIcon: false,
    },
    {
      icon: Calendar,
      label: t.followUp?.upcomingMeetings || "UPCOMING MEETINGS",
      value: upcomingMeetings,
      color: "bg-amber-100 text-amber-600",
      iconBg: "bg-amber-500",
    },
    {
      icon: Zap,
      label: t.followUp?.upcomingMeetingsAlt || "UPCOMING MEETINGS",
      value: upcomingMeetings,
      color: "bg-white",
      showZap: true,
    },
    {
      icon: Percent,
      label: t.followUp?.taskCompletion || "TASK COMPLETION",
      value: `${taskCompletionRate}%`,
      color: "bg-white",
    },
  ];

  const quickAccessCards = [
    { icon: CheckCircle2, label: t.followUp?.taskManagement || "TASK Management", color: "bg-blue-500", link: "/tasks" },
    { icon: Building2, label: t.followUp?.departments || "DEPARTMENTS", color: "bg-orange-500", link: "/departments" },
    { icon: Calendar, label: t.followUp?.calendar || "CALENDAR", color: "bg-green-500", link: "/calendar" },
    { icon: FolderOpen, label: language === 'ar' ? "الملفات" : "FILES", color: "bg-purple-500", link: "/files" },
    { icon: Newspaper, label: language === 'ar' ? "الإعلانات" : "ADVERTISING", color: "bg-yellow-500", link: "/advertising" },
    { icon: Users, label: t.followUp?.teamDirectory || "TEAM Directory", color: "bg-blue-600", link: "/team" },
  ];

  const isLoading = userLoading || tasksLoading || meetingsLoading || transactionsLoading;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="bg-white dark:bg-card shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar 
                  name={userName} 
                  avatar={currentUser?.profileImageUrl} 
                  size="md" 
                />
                <span className="font-semibold text-foreground" data-testid="text-user-name">
                  {userName}
                </span>
              </div>
              <div className="text-sm text-muted-foreground" data-testid="text-today-date">
                {language === 'ar' ? 'اليوم:' : 'Today:'} {today}
              </div>
              <Badge 
                variant="outline" 
                className="gap-2 px-3 py-1.5 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10"
                data-testid="badge-system-status"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  {t.followUp?.systemConnected || "System Connected"}
                </span>
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3" data-testid="section-kpi-cards">
          {kpiCards.map((kpi, index) => (
            <Card 
              key={index} 
              className="bg-white dark:bg-card shadow-sm border-0 hover:shadow-md transition-shadow"
              data-testid={`kpi-card-${index}`}
            >
              <CardContent className="p-4 text-center">
                {kpi.iconBg ? (
                  <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                    <kpi.icon className="h-5 w-5 text-white" />
                  </div>
                ) : kpi.showZap ? (
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className="text-2xl font-bold text-foreground" data-testid={`kpi-value-${index}`}>
                      {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : kpi.value}
                    </span>
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-foreground mb-2" data-testid={`kpi-value-${index}`}>
                    {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : kpi.value}
                  </div>
                )}
                {!kpi.showZap && kpi.iconBg && (
                  <div className="text-2xl font-bold text-foreground mb-2" data-testid={`kpi-value-${index}`}>
                    {isLoading ? <Skeleton className="h-8 w-12 mx-auto" /> : kpi.value}
                  </div>
                )}
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {kpi.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-3 bg-white dark:bg-card shadow-sm border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-semibold text-foreground">
                  {t.followUp?.weeklyActivity || "Weekly Activity"}
                </h3>
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-muted rounded-full p-1">
                  <button
                    onClick={() => setActivityPeriod('yearly')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      activityPeriod === 'yearly' 
                        ? 'bg-white dark:bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="btn-period-yearly"
                  >
                    {language === 'ar' ? 'سنوي' : 'Yearly'}
                  </button>
                  <button
                    onClick={() => setActivityPeriod('monthly')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      activityPeriod === 'monthly' 
                        ? 'bg-white dark:bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="btn-period-monthly"
                  >
                    {language === 'ar' ? 'شهري' : 'Monthly'}
                  </button>
                  <button
                    onClick={() => setActivityPeriod('weekly')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      activityPeriod === 'weekly' 
                        ? 'bg-white dark:bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    data-testid="btn-period-weekly"
                  >
                    {language === 'ar' ? 'أسبوعي' : 'Weekly'}
                  </button>
                </div>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getActivityData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="gradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value1" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      fill="url(#gradient1)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value2" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      fill="url(#gradient2)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 bg-white dark:bg-card shadow-sm border-0">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-foreground">
                {t.followUp?.financialOverview || "Financial Overview"}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-500/10 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid="text-expenses">
                    $ {totalExpenses > 0 ? `-${totalExpenses}` : totalExpenses}
                  </p>
                  <p className="text-xs text-red-500 uppercase">
                    {t.followUp?.expenses || "EXPENSES"}
                  </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400" data-testid="text-revenues">
                    ${totalRevenue}
                  </p>
                  <p className="text-xs text-emerald-500 uppercase">
                    {t.followUp?.revenues || "REVENUES"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground uppercase mb-1">
                  {t.followUp?.netBalance || "NET BALANCE"}
                </p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${isLoss ? 'text-red-500' : 'text-emerald-500'}`} data-testid="text-net-balance">
                    ${Math.abs(netBalance)}
                  </p>
                  {isLoss && (
                    <Badge variant="destructive" className="text-xs">
                      {t.followUp?.loss || "Loss"}
                    </Badge>
                  )}
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-muted rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${isLoss ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, Math.abs(netBalance) / (totalRevenue + totalExpenses) * 100 || 0)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3" data-testid="section-quick-access">
          {quickAccessCards.map((card, index) => (
            <Link href={card.link} key={index}>
              <Card 
                className="bg-white dark:bg-card shadow-sm border-0 hover:shadow-md transition-all cursor-pointer group"
                data-testid={`quick-access-${index}`}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-xl ${card.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide leading-tight">
                    {card.label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card className="bg-white dark:bg-card shadow-sm border-0">
          <CardContent className="p-4">
            <GroupChatPanel fullHeight />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
