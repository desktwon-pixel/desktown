import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Ticket as TicketIcon,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  LayoutDashboard,
  Inbox,
  UserCheck,
  AlarmClock,
  SlidersHorizontal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Ticket, User } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

const statusColors: Record<string, string> = {
  open: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  resolved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  closed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-400 border-red-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const statusIcons: Record<string, typeof AlertCircle> = {
  open: AlertCircle,
  in_progress: Clock,
  resolved: CheckCircle2,
  closed: CheckCircle2,
};

type NavItemKey =
  | "dashboard"
  | "all"
  | "new"
  | "my"
  | "unassigned"
  | "assigned"
  | "overdue"
  | "filter";

type MenuSelection = "all" | "my" | "unassigned" | "assignedToMe" | "overdue";

export default function Tickets() {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === "ar";
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [, navigate] = useLocation();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium",
  });
  const [department, setDepartment] = useState("");
  const [activeNav, setActiveNav] = useState<NavItemKey>("all");
  const [menuSelection, setMenuSelection] = useState<MenuSelection>("all");

  const formRef = useRef<HTMLDivElement | null>(null);
  const filterTriggerRef = useRef<HTMLButtonElement | null>(null);

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      priority: string;
    }) => {
      return await apiRequest("POST", "/api/tickets", {
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: "open",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setNewTicket({ title: "", description: "", priority: "medium" });
      toast({
        title: t.tickets?.ticketCreated || "Ticket created",
        description:
          t.tickets?.ticketCreatedDesc ||
          "Your support ticket has been submitted.",
      });
    },
    onError: () => {
      toast({
        title: t.tickets?.error || "Error",
        description: t.tickets?.failedCreate || "Failed to create ticket.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = () => {
    if (!newTicket.title) return;
    createTicketMutation.mutate(newTicket);
  };

  const handleScrollToForm = () => {
    setActiveNav("new");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleFilterMenuClick = () => {
    setActiveNav("filter");
    filterTriggerRef.current?.focus();
    filterTriggerRef.current?.click();
  };

  const handleMyTicketsClick = () => {
    if (!currentUser) {
      toast({
        title: t.tickets?.error || "Error",
        description:
          t.tickets?.loginRequired || "Sign in to view your tickets.",
        variant: "destructive",
      });
      return;
    }
    setActiveNav("my");
    setMenuSelection("my");
  };

  const handleAssignedToMeClick = () => {
    if (!currentUser) {
      toast({
        title: t.tickets?.error || "Error",
        description:
          t.tickets?.loginRequired || "Sign in to view assigned tickets.",
        variant: "destructive",
      });
      return;
    }
    setActiveNav("assigned");
    setMenuSelection("assignedToMe");
  };

  const handleUnassignedClick = () => {
    setActiveNav("unassigned");
    setMenuSelection("unassigned");
  };

  const handleOverdueClick = () => {
    setActiveNav("overdue");
    setMenuSelection("overdue");
  };

  const handleAllTicketsClick = () => {
    setActiveNav("all");
    setMenuSelection("all");
  };

  const handleDashboardClick = () => {
    setActiveNav("dashboard");
    navigate("/dashboard");
  };

  const getUserById = (userId: string | null) => {
    if (!userId) return null;
    return users.find((u) => u.id === userId);
  };

  const query = search.trim().toLowerCase();

  const filteredTickets = tickets.filter((ticket) => {
    let matchesMenu = true;

    if (menuSelection === "my") {
      matchesMenu = ticket.reporterId === currentUser?.id;
    } else if (menuSelection === "unassigned") {
      matchesMenu = !ticket.assigneeId;
    } else if (menuSelection === "assignedToMe") {
      matchesMenu = ticket.assigneeId === currentUser?.id;
    } else if (menuSelection === "overdue") {
      const createdAt = ticket.createdAt
        ? new Date(ticket.createdAt as any)
        : null;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      matchesMenu =
        !!createdAt &&
        (ticket.status === "open" || ticket.status === "in_progress") &&
        createdAt < sevenDaysAgo;
    }

    const matchesFilter = filter === "all" || ticket.status === filter;

    const reporter = getUserById(ticket.reporterId);
    const assignee = getUserById(ticket.assigneeId);

    const haystack = [
      ticket.title,
      ticket.description || "",
      `#${String(ticket.id).padStart(4, "0")}`,
      ticket.status?.replace("_", " ") || "",
      ticket.priority || "",
      reporter
        ? `${reporter.firstName || ""} ${reporter.lastName || ""} ${
            reporter.email || ""
          }`
        : "",
      assignee
        ? `${assignee.firstName || ""} ${assignee.lastName || ""} ${
            assignee.email || ""
          }`
        : "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = !query || haystack.includes(query);
    return matchesMenu && matchesFilter && matchesSearch;
  });

  const ticketStats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    inProgress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter(
      (t) => t.status === "resolved" || t.status === "closed",
    ).length,
  };

  return (
    <div
      className="p-6 md:p-8 max-w-7xl mx-auto bg-white rounded-2xl shadow-sm"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex gap-6">
        <aside className="hidden md:block w-52 shrink-0 rounded-xl bg-white border border-slate-200 py-4 px-3 space-y-2 shadow-sm">
          <div className="px-2 pb-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {t.tickets?.dashboardSection || "لوحة التحكم"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDashboardClick}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "dashboard"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>{t.tickets?.menuDashboard || "لوحة التحكم"}</span>
          </button>

          <button
            type="button"
            onClick={handleAllTicketsClick}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "all"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <TicketIcon className="h-4 w-4" />
            <span>{t.tickets?.menuAllTickets || "كل التذاكر"}</span>
          </button>

          <button
            type="button"
            onClick={handleScrollToForm}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "new"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>{t.tickets?.menuNewTicket || "تذكرة جديدة"}</span>
          </button>

          <button
            type="button"
            onClick={handleMyTicketsClick}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "my"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>{t.tickets?.menuMyTickets || "تذاكري"}</span>
          </button>

          <button
            type="button"
            onClick={handleUnassignedClick}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "unassigned"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <Inbox className="h-4 w-4" />
            <span>{t.tickets?.menuUnassigned || "غير مخصصة"}</span>
          </button>

          <button
            type="button"
            onClick={handleAssignedToMeClick}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "assigned"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>{t.tickets?.menuAssignedToMe || "مسندة إليّ"}</span>
          </button>

          <button
            type="button"
            onClick={handleOverdueClick}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "overdue"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <AlarmClock className="h-4 w-4" />
            <span>{t.tickets?.menuOverdue || "متأخرة"}</span>
          </button>

          <button
            type="button"
            onClick={handleFilterMenuClick}
            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition border border-transparent ${
              activeNav === "filter"
                ? "bg-slate-900 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>{t.tickets?.menuFilter || "تصفية"}</span>
          </button>
        </aside>

        <div className="flex-1 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-white border border-slate-200 shadow-sm">
                <TicketIcon className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h1
                  className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900"
                  data-testid="text-tickets-title"
                >
                  {t.tickets?.title || "مركز دعم التذاكر"}
                </h1>
                <p className="text-xs md:text-sm text-slate-500">
                  {t.tickets?.subtitle ||
                    "إدارة وتتبع جميع تذاكر الدعم في مكان واحد"}
                </p>
              </div>
            </div>

            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
              data-testid="button-new-ticket"
              onClick={handleScrollToForm}
            >
              <Plus className="h-4 w-4" />
              {t.tickets?.newTicket || "تذكرة جديدة"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: t.tickets?.open || "تذاكر مفتوحة",
                value: ticketStats.open,
                description: t.tickets?.openSubtitle || "Assigned to you",
                bg: "bg-emerald-500",
              },
              {
                label: t.tickets?.resolved || "محلولة",
                value: ticketStats.resolved,
                description: t.tickets?.resolvedSubtitle || "All resolved",
                bg: "bg-yellow-400",
              },
              {
                label: t.tickets?.inProgress || "قيد المعالجة",
                value: ticketStats.inProgress,
                description: t.tickets?.inProgressSubtitle || "All unresolved",
                bg: "bg-orange-500",
              },
              {
                label: t.tickets?.total || "إجمالي التذاكر",
                value: ticketStats.total,
                description: t.tickets?.totalSubtitle || "All generated",
                bg: "bg-rose-500",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl px-5 py-4 text-white shadow-lg shadow-slate-900/40 border border-white/10 ${stat.bg}`}
              >
                <p className="text-xs opacity-80">{stat.label}</p>
                <p className="text-3xl font-semibold mt-1">{stat.value}</p>
                <p className="text-[11px] mt-1 opacity-90">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] gap-6 items-start">
            <Card
              ref={formRef}
              className="border border-slate-200 bg-white shadow-sm"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold">
                      {t.tickets?.newSupportRequest || "طلب دعم جديد"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t.tickets?.newSupportRequestSubtitle ||
                        "املأ النموذج لفتح تذكرة دعم جديدة"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="title">
                      {t.tickets?.ticketTitle || "الموضوع"}
                    </Label>
                    <Input
                      id="title"
                      placeholder={
                        t.tickets?.titlePlaceholder || "أدخل عنوان المشكلة"
                      }
                      value={newTicket.title}
                      onChange={(e) =>
                        setNewTicket({ ...newTicket, title: e.target.value })
                      }
                      className="bg-white border border-slate-200 focus:border-blue-500"
                      data-testid="input-ticket-title"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="department">
                      {t.tickets?.department || "القسم"}
                    </Label>
                    <Select value={department} onValueChange={setDepartment}>
                      <SelectTrigger
                        id="department"
                        className="bg-white border border-slate-200"
                      >
                        <SelectValue
                          placeholder={
                            t.tickets?.selectDepartment || "اختر القسم"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="support">
                          {t.tickets?.departmentSupport || "Support"}
                        </SelectItem>
                        <SelectItem value="billing">
                          {t.tickets?.departmentBilling || "الفوترة"}
                        </SelectItem>
                        <SelectItem value="technical">
                          {t.tickets?.departmentTechnical || "الدعم الفني"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="priority">
                      {t.tickets?.priority || "الأولوية"}
                    </Label>
                    <Select
                      value={newTicket.priority}
                      onValueChange={(value) =>
                        setNewTicket({ ...newTicket, priority: value })
                      }
                    >
                      <SelectTrigger
                        id="priority"
                        className="bg-white border border-slate-200"
                        data-testid="select-ticket-priority"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">
                          {t.tickets?.highPriority || "عالية"}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t.tickets?.mediumPriority || "متوسطة"}
                        </SelectItem>
                        <SelectItem value="low">
                          {t.tickets?.lowPriority || "منخفضة"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description">
                      {t.tickets?.description || "الوصف"}
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={
                        t.tickets?.descriptionPlaceholder ||
                        "اكتب وصفاً تفصيلياً للمشكلة..."
                      }
                      value={newTicket.description}
                      onChange={(e) =>
                        setNewTicket({
                          ...newTicket,
                          description: e.target.value,
                        })
                      }
                      className="bg-white border border-slate-200 focus:border-blue-500 min-h-[140px]"
                      data-testid="input-ticket-description"
                    />
                  </div>
                </div>

                <Button
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={handleCreateTicket}
                  disabled={createTicketMutation.isPending}
                  data-testid="button-create-ticket"
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t.tickets?.submitting || "جارٍ الإرسال..."}
                    </>
                  ) : (
                    t.tickets?.submitTicket || "إرسال التذكرة"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {t.tickets?.activeTickets || "Active Tickets"}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {t.tickets?.activeTicketsSubtitle ||
                        "استعرض وتتبع تذاكر الدعم الحالية"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="flex-1 min-w-[160px]">
                      <Input
                        placeholder={
                          t.tickets?.searchTickets || "ابحث في جميع التذاكر..."
                        }
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-9 bg-white border border-slate-200"
                        data-testid="input-search-tickets"
                      />
                    </div>

                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger
                        ref={filterTriggerRef}
                        className="h-9 w-full sm:w-[160px] bg-white border border-slate-200"
                        data-testid="select-ticket-filter"
                      >
                        <Filter className="h-3.5 w-3.5 mr-2" />
                        <SelectValue
                          placeholder={t.tickets?.filter || "Filter"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t.tickets?.allTickets || "كل التذاكر"}
                        </SelectItem>
                        <SelectItem value="open">
                          {t.tickets?.open || "مفتوحة"}
                        </SelectItem>
                        <SelectItem value="in_progress">
                          {t.tickets?.inProgress || "قيد المعالجة"}
                        </SelectItem>
                        <SelectItem value="resolved">
                          {t.tickets?.resolved || "محلولة"}
                        </SelectItem>
                        <SelectItem value="closed">
                          {t.tickets?.closed || "مغلقة"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  {isLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Skeleton
                          key={i}
                          className="h-24 w-full bg-slate-100"
                        />
                      ))
                  ) : filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => {
                      const reporter = getUserById(ticket.reporterId);
                      const assignee = getUserById(ticket.assigneeId);
                      const StatusIcon =
                        statusIcons[ticket.status as string] || AlertCircle;

                      return (
                        <Card
                          key={ticket.id}
                          className="bg-white border border-slate-200 hover:border-blue-400 transition-all duration-300 cursor-pointer"
                          data-testid={`card-ticket-${ticket.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div
                                  className={`p-2.5 rounded-lg border ${
                                    statusColors[
                                      ticket.status as string
                                    ]?.split(" ")[0] || "bg-slate-500/10"
                                  }`}
                                >
                                  <StatusIcon
                                    className={`h-4 w-4 ${
                                      statusColors[
                                        ticket.status as string
                                      ]?.split(" ")[1] || "text-slate-400"
                                    }`}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                      #{String(ticket.id).padStart(4, "0")}
                                    </span>
                                    <h3 className="text-sm font-semibold truncate">
                                      {ticket.title}
                                    </h3>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {t.tickets?.reportedBy ||
                                      "تم الإبلاغ بواسطة"}{" "}
                                    {reporter
                                      ? `${reporter.firstName || ""} ${
                                          reporter.lastName || ""
                                        }`.trim() || reporter.email
                                      : t.tickets?.unknown || "غير معروف"}
                                    {assignee && (
                                      <span className="text-cyan-400">
                                        {" "}
                                        • {t.tickets?.assignedTo ||
                                          "مسندة إلى"}{" "}
                                        {`${assignee.firstName || ""} ${
                                          assignee.lastName || ""
                                        }`.trim() || assignee.email}
                                      </span>
                                    )}
                                  </p>
                                  {ticket.description && (
                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                      {ticket.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                <Badge
                                  variant="outline"
                                  className={
                                    priorityColors[ticket.priority as string] ||
                                    priorityColors.medium
                                  }
                                >
                                  {ticket.priority}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    statusColors[ticket.status as string] ||
                                    statusColors.open
                                  }
                                >
                                  {ticket.status?.replace("_", " ")}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card className="bg-white border border-slate-200">
                      <CardContent className="py-10 text-center text-slate-500">
                        <TicketIcon className="h-10 w-10 mx-auto mb-3 opacity-40" />
                        <p className="text-sm mb-1">
                          {search
                            ? t.tickets?.noTicketsMatch ||
                              "لا توجد تذاكر تطابق بحثك"
                            : t.tickets?.noTicketsYet ||
                              "لا توجد تذاكر حتى الآن"}
                        </p>
                        <p className="text-xs">
                          {t.tickets?.createFirstTicket ||
                            "أنشئ أول تذكرة دعم للبدء"}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
