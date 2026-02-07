import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, 
  Users, 
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Briefcase,
  TicketCheck,
  ArrowRight,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Layers,
  Zap,
  Clock,
  Sparkles,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Task, Ticket, Meeting, Transaction, Department, User } from "@shared/schema";
import { useState } from "react";
import { StatusVideoRecorder, FloatingVideoButton } from "@/components/StatusVideoRecorder";
import { StatusStoriesRow } from "@/components/StatusViewer";
import { useLanguage, translations } from "@/lib/i18n";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const departmentIcons: Record<string, typeof Briefcase> = {
  briefcase: Briefcase,
  calculator: DollarSign,
  users: Users,
  hearthandshake: Users,
};

const departmentColors: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  green: "from-emerald-500 to-emerald-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
  pink: "from-pink-500 to-pink-600",
  yellow: "from-amber-500 to-amber-600",
  cyan: "from-cyan-500 to-cyan-600",
};

const priorityColors: Record<string, string> = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  in_progress: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-muted text-muted-foreground",
};

export default function Dashboard() {
  const [videoRecorderOpen, setVideoRecorderOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const t = translations[language];

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const inProgressTasks = tasks.filter(t => t.status === "in_progress").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const openTickets = tickets.filter(t => t.status === "open").length;
  const resolvedTickets = tickets.filter(t => t.status === "resolved" || t.status === "closed").length;

  const upcomingMeetings = meetings.filter(m => new Date(m.startTime) > new Date()).length;

  const totalRevenue = transactions.filter(t => t.type === "income").reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === "expense").reduce((acc, t) => acc + Math.abs(t.amount || 0), 0);
  const netBalance = totalRevenue - totalExpenses;

  const taskStatusData = [
    { name: t.dashboard?.Pending || "Pending", value: pendingTasks, fill: "#f59e0b" },
    { name: t.dashboard?.inProgress || "In Progress", value: inProgressTasks, fill: "#06b6d4" },
    { name: t.dashboard?.Completed || "Completed", value: completedTasks, fill: "#10b981" },
  ].filter(d => d.value > 0);

  const [activityPeriod, setActivityPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');

  const weeklyActivityData = [
    { day: language === 'ar' ? "إثنين" : "Mon", tasks: 4, tickets: 2 },
    { day: language === 'ar' ? "ثلاثاء" : "Tue", tasks: 6, tickets: 3 },
    { day: language === 'ar' ? "أربعاء" : "Wed", tasks: 8, tickets: 1 },
    { day: language === 'ar' ? "خميس" : "Thu", tasks: 5, tickets: 4 },
    { day: language === 'ar' ? "جمعة" : "Fri", tasks: 7, tickets: 2 },
    { day: language === 'ar' ? "سبت" : "Sat", tasks: 2, tickets: 0 },
    { day: language === 'ar' ? "أحد" : "Sun", tasks: 1, tickets: 1 },
  ];

  const monthlyActivityData = [
    { day: language === 'ar' ? "الأسبوع 1" : "Week 1", tasks: 25, tickets: 12 },
    { day: language === 'ar' ? "الأسبوع 2" : "Week 2", tasks: 32, tickets: 18 },
    { day: language === 'ar' ? "الأسبوع 3" : "Week 3", tasks: 28, tickets: 15 },
    { day: language === 'ar' ? "الأسبوع 4" : "Week 4", tasks: 35, tickets: 20 },
  ];

  const yearlyActivityData = [
    { day: language === 'ar' ? "يناير" : "Jan", tasks: 120, tickets: 45 },
    { day: language === 'ar' ? "فبراير" : "Feb", tasks: 98, tickets: 38 },
    { day: language === 'ar' ? "مارس" : "Mar", tasks: 145, tickets: 52 },
    { day: language === 'ar' ? "أبريل" : "Apr", tasks: 132, tickets: 48 },
    { day: language === 'ar' ? "مايو" : "May", tasks: 156, tickets: 61 },
    { day: language === 'ar' ? "يونيو" : "Jun", tasks: 142, tickets: 55 },
    { day: language === 'ar' ? "يوليو" : "Jul", tasks: 168, tickets: 72 },
    { day: language === 'ar' ? "أغسطس" : "Aug", tasks: 175, tickets: 68 },
    { day: language === 'ar' ? "سبتمبر" : "Sep", tasks: 158, tickets: 58 },
    { day: language === 'ar' ? "أكتوبر" : "Oct", tasks: 182, tickets: 75 },
    { day: language === 'ar' ? "نوفمبر" : "Nov", tasks: 195, tickets: 82 },
    { day: language === 'ar' ? "ديسمبر" : "Dec", tasks: 210, tickets: 90 },
  ];

  const getActivityData = () => {
    switch (activityPeriod) {
      case 'monthly': return monthlyActivityData;
      case 'yearly': return yearlyActivityData;
      default: return weeklyActivityData;
    }
  };

  const getActivityTitle = () => {
    switch (activityPeriod) {
      case 'monthly': return language === 'ar' ? "النشاط الشهري" : "Monthly Activity";
      case 'yearly': return language === 'ar' ? "النشاط السنوي" : "Yearly Activity";
      default: return t.dashboard?.weeklyActivity || "Weekly Activity";
    }
  };

  const kpis = [
    { 
      label: t.dashboard?.taskCompletion || "Task Completion", 
      value: `${taskCompletionRate}%`, 
      icon: Target, 
      trend: completedTasks > 0 ? `${completedTasks} ${t.dashboard?.completed || "completed"}` : (t.tasks?.noTasksYet || "No tasks yet"),
      trendUp: taskCompletionRate >= 50,
      gradient: "from-cyan-500 to-teal-500",
      iconBg: "bg-cyan-500/10",
      path: "/tasks"
    },
    { 
      label: t.dashboard?.activeTasks || "Active Tasks", 
      value: inProgressTasks.toString(), 
      icon: Zap, 
      trend: `${pendingTasks} ${t.dashboard?.pending || "pending"}`,
      trendUp: null,
      gradient: "from-blue-500 to-indigo-500",
      iconBg: "bg-blue-500/10",
      path: "/tasks"
    },
    { 
      label: t.dashboard?.openTickets || "Open Tickets", 
      value: openTickets.toString(), 
      icon: TicketCheck, 
      trend: resolvedTickets > 0 ? `${resolvedTickets} ${t.dashboard?.resolved || "resolved"}` : (t.tickets?.noTicketsYet || "No tickets yet"),
      trendUp: openTickets === 0,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-500/10",
      path: "/tickets"
    },
    { 
      label: t.dashboard?.teamMembers || "Team Members", 
      value: users.length.toString(), 
      icon: Users, 
      trend: t.dashboard?.activeNow || "Active now",
      trendUp: true,
      gradient: "from-emerald-500 to-green-500",
      iconBg: "bg-emerald-500/10",
      path: "/team"
    },
    { 
      label: t.dashboard?.meetings || "Meetings", 
      value: upcomingMeetings.toString(), 
      icon: Calendar, 
      trend: t.dashboard?.upcoming || "Upcoming",
      trendUp: null,
      gradient: "from-violet-500 to-purple-500",
      iconBg: "bg-violet-500/10",
      path: "/meetings"
    },
    { 
      label: t.dashboard?.departments || "Departments", 
      value: departments.length.toString(), 
      icon: Building2, 
      trend: t.dashboard?.active || "Active",
      trendUp: departments.length > 0,
      gradient: "from-pink-500 to-rose-500",
      iconBg: "bg-pink-500/10",
      path: "/departments"
    },
  ];

  const activeTasks = tasks
    .filter(t => t.status === "pending" || t.status === "in_progress")
    .slice(0, 5);

  const getUserName = (userId: string | null | undefined) => {
    if (!userId) return "Unassigned";
    const user = users.find(u => u.id === userId);
    if (!user) return "Unknown";
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || "Unknown";
  };

  const isLoading = tasksLoading || ticketsLoading || meetingsLoading || transactionsLoading;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" data-testid="text-dashboard-title">{t.dashboard?.title || "Dashboard"}</h1>
              <p className="text-muted-foreground text-sm">{t.dashboard?.welcomeBack || "Welcome back to your workspace"}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-2 px-3 py-1.5 border-emerald-500/30 bg-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">{t.dashboard?.systemOnline || "System Online"}</span>
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1.5">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{new Date().toLocaleDateString()}</span>
          </Badge>
        </div>
      </div>

      <section className="glass rounded-xl p-4 border border-white/5" data-testid="section-stories">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">{t.dashboard?.dailyStories || "Daily Stories"}</h3>
        </div>
        <StatusStoriesRow 
          currentUser={currentUser ? {
            id: currentUser.id,
            name: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'User',
            avatar: currentUser.profileImageUrl
          } : undefined}
          onAddStory={() => setVideoRecorderOpen(true)}
        />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="section-kpis">
        {kpis.map((kpi, index) => (
          <div 
            key={kpi.label} 
            className="glass rounded-xl p-4 hover-glow transition-all duration-300 cursor-pointer group"
            data-testid={`kpi-card-${index}`}
            onClick={() => kpi.path && setLocation(kpi.path)}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                <kpi.icon className={`h-4 w-4 bg-gradient-to-r ${kpi.gradient} bg-clip-text text-transparent`} style={{ color: kpi.gradient.includes('cyan') ? '#06b6d4' : kpi.gradient.includes('blue') ? '#3b82f6' : kpi.gradient.includes('amber') ? '#f59e0b' : kpi.gradient.includes('emerald') ? '#10b981' : kpi.gradient.includes('violet') ? '#8b5cf6' : '#ec4899' }} />
              </div>
            </div>
            <div>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <p className={`text-2xl font-bold bg-gradient-to-r ${kpi.gradient} bg-clip-text text-transparent`} data-testid={`kpi-value-${index}`}>
                  {kpi.value}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
              {kpi.trendUp !== null && (
                kpi.trendUp ? 
                  <TrendingUp className="h-3 w-3 text-emerald-400" /> : 
                  <TrendingDown className="h-3 w-3 text-red-400" />
              )}
              <span className="text-xs text-muted-foreground">{kpi.trend}</span>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="section-analytics">
        <Card className="lg:col-span-2 glass border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10">
                  <BarChart3 className="h-4 w-4 text-cyan-400" />
                </div>
                {getActivityTitle()}
              </CardTitle>
              <div className="flex gap-1">
                <Button 
                  size="sm" 
                  variant={activityPeriod === 'weekly' ? 'default' : 'ghost'}
                  onClick={() => setActivityPeriod('weekly')}
                  className="h-7 px-2 text-xs"
                  data-testid="btn-activity-weekly"
                >
                  {language === 'ar' ? 'أسبوعي' : 'Weekly'}
                </Button>
                <Button 
                  size="sm" 
                  variant={activityPeriod === 'monthly' ? 'default' : 'ghost'}
                  onClick={() => setActivityPeriod('monthly')}
                  className="h-7 px-2 text-xs"
                  data-testid="btn-activity-monthly"
                >
                  {language === 'ar' ? 'شهري' : 'Monthly'}
                </Button>
                <Button 
                  size="sm" 
                  variant={activityPeriod === 'yearly' ? 'default' : 'ghost'}
                  onClick={() => setActivityPeriod('yearly')}
                  className="h-7 px-2 text-xs"
                  data-testid="btn-activity-yearly"
                >
                  {language === 'ar' ? 'سنوي' : 'Yearly'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getActivityData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tasksGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="ticketsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222, 47%, 9%)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tasks" 
                    name="Tasks" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    fill="url(#tasksGradient)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tickets" 
                    name="Tickets" 
                    stroke="#14b8a6" 
                    strokeWidth={2}
                    fill="url(#ticketsGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10">
                <PieChart className="h-4 w-4 text-teal-400" />
              </div>
              {t.dashboard?.taskDistribution || "Task Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {taskStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(222, 47%, 9%)', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                      }} 
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Layers className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t.dashboard?.noTaskData || "No task data yet"}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {taskStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="section-projects">
        <Card className="glass border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Briefcase className="h-4 w-4 text-blue-400" />
                </div>
                {t.dashboard?.activeTasks || "Active Tasks"}
              </CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5" data-testid="link-view-all-tasks">
                  {t.dashboard?.viewAll || "View all"} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasksLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  data-testid={`task-item-${task.id}`}
                >
                  <div className={`p-2 rounded-lg border ${priorityColors[task.priority || 'medium']}`}>
                    {task.priority === 'high' ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {getUserName(task.assigneeId)}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs border ${statusColors[task.status || 'pending']}`}>
                    {task.status === 'in_progress' ? 'In Progress' : (task.status || 'pending').charAt(0).toUpperCase() + (task.status || 'pending').slice(1)}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.dashboard?.noActiveTasks || "No active tasks"}</p>
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="mt-4" data-testid="button-create-task">
                    {t.dashboard?.createTask || "Create a task"}
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                {t.dashboard?.financialOverview || "Financial Overview"}
              </CardTitle>
              <Link href="/finances">
                <Button variant="ghost" size="sm" className="text-xs hover:bg-white/5" data-testid="link-view-finance">
                  {t.dashboard?.details || "Details"} <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <p className="text-xs text-emerald-400">{t.dashboard?.revenue || "Revenue"}</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-400" data-testid="text-revenue">
                      ${(totalRevenue / 100).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <p className="text-xs text-red-400">{t.dashboard?.expenses || "Expenses"}</p>
                    </div>
                    <p className="text-xl font-bold text-red-400" data-testid="text-expenses">
                      ${(totalExpenses / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">{t.dashboard?.netBalance || "Net Balance"}</p>
                    {netBalance >= 0 ? (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {t.dashboard?.profitable || "Profitable"}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                        {t.dashboard?.loss || "Loss"}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`} data-testid="text-balance">
                    ${(Math.abs(netBalance) / 100).toLocaleString()}
                  </p>
                  <Progress 
                    value={totalRevenue > 0 ? (totalRevenue / (totalRevenue + totalExpenses)) * 100 : 50} 
                    className="mt-3 h-2 bg-white/10"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section data-testid="section-departments">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{t.dashboard?.departments || "Departments"}</h2>
              <p className="text-sm text-muted-foreground">
                {departments.length} {t.dashboard?.departmentsInOrg || "department(s) in your organization"}
              </p>
            </div>
          </div>
          <Link href="/departments">
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-view-all-departments">
              {t.dashboard?.viewAll || "View All"} <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {departmentsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : departments.length === 0 ? (
          <Card className="glass border-white/5 p-8 text-center" data-testid="card-no-departments">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
            <p className="text-muted-foreground mb-1">{t.dashboard?.noDepartments || "No departments yet"}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {t.dashboard?.createDepartment || "Create a department to organize your team"}
            </p>
            <Link href="/departments">
              <Button data-testid="button-create-department">
                {t.dashboard?.addDepartment || "Add Department"}
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.slice(0, 6).map((dept) => {
              const IconComponent = departmentIcons[dept.icon || "briefcase"] || Briefcase;
              const gradientClass = departmentColors[dept.color || "blue"] || departmentColors.blue;

              return (
                <Link key={dept.id} href={`/departments/${dept.id}`}>
                  <Card 
                    className="glass border-white/5 hover-glow cursor-pointer h-full transition-all duration-300" 
                    data-testid={`department-card-${dept.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClass} flex-shrink-0`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold">{dept.name}</h3>
                              {dept.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {dept.description}
                                </p>
                              )}
                            </div>
                            {dept.password && (
                              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                                Protected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              <span className="text-xs">Team</span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <FloatingVideoButton onClick={() => setVideoRecorderOpen(true)} />
      <StatusVideoRecorder 
        open={videoRecorderOpen} 
        onOpenChange={setVideoRecorderOpen} 
      />
    </div>
  );
}
