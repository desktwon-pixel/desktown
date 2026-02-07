import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/UserAvatar";
import { Link } from "wouter";
import {
  Shield,
  Users,
  DollarSign,
  Megaphone,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Server,
  Database,
  Zap,
  ArrowRight,
  UserPlus,
  BarChart3,
  PieChart,
  Building2,
  Ticket,
  Mail,
  Sparkles,
} from "lucide-react";
import type {
  User,
  Transaction,
  Department,
  Ticket as TicketType,
} from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

export default function AdminPanel() {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === "ar";

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<
    Transaction[]
  >({
    queryKey: ["/api/transactions"],
  });

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<
    Department[]
  >({
    queryKey: ["/api/departments"],
  });

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<
    TicketType[]
  >({
    queryKey: ["/api/tickets"],
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const managerCount = users.filter((u) => u.role === "manager").length;
  const memberCount = users.filter(
    (u) => u.role === "member" || !u.role,
  ).length;
  const onlineUsers = users.filter((u) => u.status === "online").length;

  const totalRevenue =
    transactions
      .filter((t) => t.amount > 0 && t.status === "approved")
      .reduce((sum, t) => sum + t.amount, 0) / 100;

  const totalExpenses =
    transactions
      .filter((t) => t.amount < 0 && t.status === "approved")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 100;

  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending",
  ).length;
  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  const isLoading =
    usersLoading || transactionsLoading || departmentsLoading || ticketsLoading;

  const systemStats = [
    {
      label: isRTL ? "إجمالي المستخدمين" : "Total Users",
      value: users.length.toString(),
      icon: Users,
      trend: `${onlineUsers} ${isRTL ? "متصل" : "online"}`,
      trendUp: true,
      gradient: "from-cyan-500 to-teal-500",
      iconBg: "bg-cyan-500/10",
      link: "/access",
    },
    {
      label: isRTL ? "الأقسام" : "Departments",
      value: departments.length.toString(),
      icon: Building2,
      trend: isRTL ? "نشط" : "Active",
      trendUp: departments.length > 0,
      gradient: "from-violet-500 to-purple-500",
      iconBg: "bg-violet-500/10",
      link: "/departments",
    },
    {
      label: isRTL ? "الإيرادات" : "Revenue",
      value: `$${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      trend: isRTL ? "هذا الشهر" : "This month",
      trendUp: totalRevenue > totalExpenses,
      gradient: "from-emerald-500 to-green-500",
      iconBg: "bg-emerald-500/10",
      link: "/finances",
    },
    {
      label: isRTL ? "التذاكر المفتوحة" : "Open Tickets",
      value: openTickets.toString(),
      icon: Ticket,
      trend: `${pendingTransactions} ${isRTL ? "معاملة معلقة" : "pending"}`,
      trendUp: openTickets === 0,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-500/10",
      link: "/tickets",
    },
  ];

  const adminModules = [
    {
      title: isRTL ? "التحكم بالوصول" : "Access Control",
      description: isRTL
        ? "إدارة أدوار المستخدمين والصلاحيات"
        : "Manage user roles and permissions",
      icon: Shield,
      link: "/access",
      stats: `${adminCount} ${isRTL ? "مشرف" : "admins"}, ${managerCount} ${isRTL ? "مدير" : "managers"}`,
      color: "from-cyan-500 to-teal-500",
    },
    {
      title: isRTL ? "المالية" : "Finances",
      description: isRTL
        ? "مراجعة المعاملات والموافقة على المصروفات"
        : "Review transactions and approve expenses",
      icon: DollarSign,
      link: "/finances",
      stats: `${pendingTransactions} ${isRTL ? "معاملة معلقة" : "pending"}`,
      color: "from-emerald-500 to-green-500",
    },
    {
      title: isRTL ? "الإعلانات" : "Advertising",
      description: isRTL
        ? "إدارة الحملات الإعلانية"
        : "Manage advertising campaigns",
      icon: Megaphone,
      link: "/advertising",
      stats: isRTL ? "إنشاء وإدارة الإعلانات" : "Create and manage ads",
      color: "from-pink-500 to-rose-500",
    },
    {
      title: isRTL ? "إدارة المكتب" : "Office Management",
      description: isRTL
        ? "إعدادات وتكوين المكتب"
        : "Office settings and configuration",
      icon: Building2,
      link: "/office-management",
      stats: isRTL ? "إعدادات المكتب" : "Office settings",
      color: "from-blue-500 to-indigo-500",
    },
  ];

  const roleDistribution = [
    { name: isRTL ? "مشرف" : "Admin", value: adminCount, fill: "#06b6d4" },
    { name: isRTL ? "مدير" : "Manager", value: managerCount, fill: "#8b5cf6" },
    { name: isRTL ? "عضو" : "Member", value: memberCount, fill: "#10b981" },
  ].filter((d) => d.value > 0);

  const activityData = [
    { day: isRTL ? "إثنين" : "Mon", users: 12, transactions: 5 },
    { day: isRTL ? "ثلاثاء" : "Tue", users: 19, transactions: 8 },
    { day: isRTL ? "أربعاء" : "Wed", users: 15, transactions: 12 },
    { day: isRTL ? "خميس" : "Thu", users: 22, transactions: 6 },
    { day: isRTL ? "جمعة" : "Fri", users: 18, transactions: 9 },
    { day: isRTL ? "سبت" : "Sat", users: 8, transactions: 3 },
    { day: isRTL ? "أحد" : "Sun", users: 5, transactions: 2 },
  ];

  const recentUsers = users.slice(0, 5);

  return (
    <div
      className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                data-testid="text-admin-panel-title"
              >
                {isRTL ? "لوحة الإدارة" : "Admin Panel"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isRTL
                  ? "إدارة النظام والمستخدمين"
                  : "System and user management"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="gap-2 px-3 py-1.5 border-emerald-500/30 bg-emerald-500/10"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">
              {isRTL ? "النظام يعمل" : "System Online"}
            </span>
          </Badge>
          <Badge variant="outline" className="gap-2 px-3 py-1.5">
            <Server className="h-3 w-3" />
            <span className="text-xs">{isRTL ? "صحة جيدة" : "Healthy"}</span>
          </Badge>
        </div>
      </div>

      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        data-testid="section-admin-stats"
      >
        {systemStats.map((stat, index) => (
          <Link href={stat.link} key={stat.label}>
            <div
              className="glass rounded-xl p-4 hover-glow transition-all duration-300 cursor-pointer group"
              data-testid={`admin-stat-card-${index}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                  <stat.icon
                    className="h-4 w-4"
                    style={{
                      color: stat.gradient.includes("cyan")
                        ? "#06b6d4"
                        : stat.gradient.includes("violet")
                          ? "#8b5cf6"
                          : stat.gradient.includes("emerald")
                            ? "#10b981"
                            : "#f59e0b",
                    }}
                  />
                </div>
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p
                    className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                  >
                    {stat.value}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
                {stat.trendUp !== null &&
                  (stat.trendUp ? (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  ))}
                <span className="text-xs text-muted-foreground">
                  {stat.trend}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <section
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="section-admin-modules"
      >
        {adminModules.map((module, index) => (
          <Link href={module.link} key={module.title}>
            <Card
              className="glass border-white/5 hover-glow transition-all duration-300 cursor-pointer group h-full"
              data-testid={`admin-module-${index}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${module.color}`}
                  >
                    <module.icon className="h-5 w-5 text-white" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-semibold mb-1">{module.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {module.description}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {module.stats}
                </Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        data-testid="section-admin-analytics"
      >
        <Card className="lg:col-span-2 glass border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
              </div>
              {isRTL ? "نشاط النظام الأسبوعي" : "Weekly System Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activityData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="usersGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="transactionsGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(222, 47%, 9%)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    }}
                    labelStyle={{ color: "#f1f5f9" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    name={isRTL ? "المستخدمين" : "Users"}
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#usersGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="transactions"
                    name={isRTL ? "المعاملات" : "Transactions"}
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#transactionsGradient)"
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
              {isRTL ? "توزيع الأدوار" : "Role Distribution"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {roleDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(222, 47%, 9%)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">
                      {isRTL ? "لا يوجد مستخدمين" : "No users yet"}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {roleDistribution.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        data-testid="section-admin-details"
      >
        <Card className="glass border-white/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                {isRTL ? "المستخدمين الحديثين" : "Recent Users"}
              </CardTitle>
              <Link href="/access">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:bg-white/5"
                  data-testid="link-view-all-users"
                >
                  {isRTL ? "عرض الكل" : "View all"}{" "}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {usersLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : recentUsers.length > 0 ? (
              recentUsers.map((user) => {
                const displayName =
                  `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  user.email ||
                  "Unknown";
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                    data-testid={`user-item-${user.id}`}
                  >
                    <UserAvatar
                      name={displayName}
                      avatar={user.profileImageUrl}
                      size="sm"
                      status={
                        (user.status as
                          | "online"
                          | "offline"
                          | "away"
                          | "busy") || "offline"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize">
                      {user.role || "member"}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">
                  {isRTL ? "لا يوجد مستخدمين" : "No users yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              {isRTL ? "حالة النظام" : "System Status"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{isRTL ? "الخادم" : "Server"}</span>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {isRTL ? "يعمل" : "Operational"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {isRTL ? "قاعدة البيانات" : "Database"}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {isRTL ? "متصل" : "Connected"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {isRTL ? "البريد الإلكتروني" : "Email Service"}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {isRTL ? "نشط" : "Active"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {isRTL ? "الأتمتة" : "Automation"}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {isRTL ? "يعمل" : "Running"}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {isRTL ? "استخدام النظام" : "System Usage"}
                </span>
                <span className="text-sm font-medium">67%</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>

            <div className="pt-4 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {isRTL ? "التخزين" : "Storage"}
                </span>
                <span className="text-sm font-medium">42%</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
