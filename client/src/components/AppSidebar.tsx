import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./UserAvatar";
import {
  LayoutDashboard,
  CheckSquare,
  Ticket,
  MessageSquare,
  Users,
  Video,
  Briefcase,
  DollarSign,
  Shield,
  Rss,
  LogOut,
  Building2,
  User,
  Newspaper,
  Zap,
  Store,
  Package,
  ChevronRight,
  Sparkles,
  Mail,
  CreditCard,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage, translations } from "@/lib/i18n";

type UserRole = "member" | "manager" | "admin" | "office_renter" | "visitor";

interface NavItem {
  titleKey: string;
  url: string;
  icon: typeof LayoutDashboard;
  categoryKey: string;
  allowedRoles: UserRole[];
}

const navigationItems: NavItem[] = [
  { titleKey: "followUp", url: "/follow-up", icon: LayoutDashboard, categoryKey: "overview", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "tasks", url: "/tasks", icon: CheckSquare, categoryKey: "productivity", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "tickets", url: "/tickets", icon: Ticket, categoryKey: "productivity", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "n8nAutomation", url: "/n8n-settings", icon: Zap, categoryKey: "productivity", allowedRoles: ["manager", "admin"] },
  { titleKey: "socialFeed", url: "/feed", icon: Rss, categoryKey: "communication", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "messages", url: "/messages", icon: MessageSquare, categoryKey: "communication", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "internalMail", url: "/mail", icon: Mail, categoryKey: "communication", allowedRoles: ["member", "manager", "admin", "office_renter"] },
  { titleKey: "meetings", url: "/meetings", icon: Video, categoryKey: "communication", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "team", url: "/team", icon: Users, categoryKey: "organization", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "departments", url: "/departments", icon: Building2, categoryKey: "organization", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "training", url: "/training", icon: GraduationCap, categoryKey: "organization", allowedRoles: ["member", "manager", "admin"] },
  { titleKey: "officeManagement", url: "/office-management", icon: Store, categoryKey: "management", allowedRoles: ["manager", "admin"] },
  { titleKey: "servicesShowcase", url: "/services-showcase", icon: Package, categoryKey: "management", allowedRoles: ["manager", "admin"] },
  { titleKey: "jobPostings", url: "/jobs", icon: Briefcase, categoryKey: "management", allowedRoles: ["manager", "admin"] },
  { titleKey: "adminPanel", url: "/admin", icon: Shield, categoryKey: "admin", allowedRoles: ["admin"] },
  { titleKey: "finances", url: "/finances", icon: DollarSign, categoryKey: "admin", allowedRoles: ["admin"] },
  { titleKey: "advertising", url: "/advertising", icon: Newspaper, categoryKey: "admin", allowedRoles: ["admin"] },
  { titleKey: "accessControl", url: "/access", icon: Shield, categoryKey: "admin", allowedRoles: ["admin"] },
  { titleKey: "myOffice", url: "/my-office", icon: Store, categoryKey: "businessServices", allowedRoles: ["office_renter"] },
  { titleKey: "myServices", url: "/my-services", icon: Package, categoryKey: "businessServices", allowedRoles: ["office_renter"] },
  { titleKey: "paidServices", url: "/paid-services", icon: CreditCard, categoryKey: "businessServices", allowedRoles: ["office_renter"] },
  { titleKey: "mySubscriptions", url: "/my-subscriptions", icon: DollarSign, categoryKey: "businessServices", allowedRoles: ["office_renter"] },
];

function hasAccess(userRole: string | null | undefined, allowedRoles: UserRole[]): boolean {
  const role = (userRole || "member") as UserRole;
  return allowedRoles.includes(role);
}

interface AppSidebarProps {
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    profileImageUrl?: string | null;
    role?: string | null;
    department?: string | null;
  };
}

export function AppSidebar({ user }: AppSidebarProps) {
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User' : 'User';
  const displayRole = user?.role || 'member';
  const avatar = user?.profileImageUrl;
  const [location] = useLocation();
  const { language } = useLanguage();
  const t = translations[language];

  // Fetch unread counts for notification badges
  const { data: threads } = useQuery<{ id: number; unreadCount: number }[]>({
    queryKey: ['/api/threads'],
    refetchInterval: 30000,
  });

  const { data: unreadNotificationsCount = 0 } = useQuery<number>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const { data: emailUnreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/emails/unread-count'],
    refetchInterval: 30000,
  });

  const { data: tasks } = useQuery<{ id: number; status: string }[]>({
    queryKey: ['/api/tasks'],
    refetchInterval: 30000,
  });

  const { data: tickets } = useQuery<{ id: number; status: string }[]>({
    queryKey: ['/api/tickets'],
    refetchInterval: 30000,
  });

  // Calculate unread counts
  const messageUnreadCount = threads?.reduce((sum, thread) => sum + (thread.unreadCount || 0), 0) || 0;
  const emailUnreadCount = emailUnreadData?.count || 0;
  const pendingTaskCount = tasks?.filter(task => task.status === 'pending' || task.status === 'in_progress').length || 0;
  const openTicketCount = tickets?.filter(ticket => ticket.status === 'open' || ticket.status === 'in_progress').length || 0;

  // Map titleKeys to their notification counts
  const notificationCounts: Record<string, number> = {
    tasks: pendingTaskCount,
    tickets: openTicketCount,
    messages: messageUnreadCount,
    internalMail: emailUnreadCount,
  };

  const filteredItems = navigationItems.filter(item => hasAccess(user?.role, item.allowedRoles));

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.categoryKey]) acc[item.categoryKey] = [];
    acc[item.categoryKey].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const categoryIcons: Record<string, typeof Sparkles> = {
    overview: LayoutDashboard,
    productivity: Zap,
    communication: MessageSquare,
    organization: Users,
    management: Store,
    admin: Shield,
    businessServices: Store,
  };

  const getCategoryLabel = (categoryKey: string) => {
    const labels: Record<string, string> = {
      overview: t.sidebar?.overview || "Overview",
      productivity: t.sidebar?.productivity || "Productivity",
      communication: t.sidebar?.communication || "Communication",
      organization: t.sidebar?.organization || "Organization",
      management: t.sidebar?.management || "Management",
      admin: t.sidebar?.admin || "Admin",
      businessServices: t.sidebar?.businessServices || "Business Services",
    };
    return labels[categoryKey] || categoryKey;
  };

  const getItemLabel = (titleKey: string) => {
    const labels: Record<string, string> = {
      workspace: t.sidebar?.workspace || "My Workspace",
      followUp: t.sidebar?.followUp || "Follow Up",
      employeeProfile: t.sidebar?.employeeProfile || "Employee Profile",
      tasks: t.sidebar?.tasks || "Tasks",
      tickets: t.sidebar?.tickets || "Tickets",
      n8nAutomation: t.sidebar?.n8nAutomation || "n8n Automation",
      socialProfile: t.sidebar?.socialProfile || "Social Profile",
      socialFeed: t.sidebar?.socialFeed || "Social Feed",
      messages: t.sidebar?.messages || "Messages",
      internalMail: t.sidebar?.internalMail || "Internal Mail",
      meetings: t.sidebar?.meetings || "Meetings",
      team: t.sidebar?.team || "Team",
      departments: t.sidebar?.departments || "Departments",
      training: t.sidebar?.training || "Training & Development",
      officeManagement: t.sidebar?.officeManagement || "Office Management",
      servicesShowcase: t.sidebar?.servicesShowcase || "Services Showcase",
      jobPostings: t.sidebar?.jobPostings || "Job Postings",
      finances: t.sidebar?.finances || "Finances",
      advertising: t.sidebar?.advertising || "Advertising",
      adminPanel: t.sidebar?.adminPanel || "Admin Panel",
      accessControl: t.sidebar?.accessControl || "Access Control",
      myOffice: t.sidebar?.myOffice || "My Office",
      myServices: t.sidebar?.myServices || "My Services",
      paidServices: t.sidebar?.paidServices || "Paid Services",
      mySubscriptions: t.sidebar?.mySubscriptions || "My Subscriptions",
    };
    return labels[titleKey] || titleKey;
  };

  const isOfficeRenter = displayRole === "office_renter";

  return (
    <Sidebar className="border-r border-white/5">
      <SidebarHeader className="p-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden border border-white/10">
                <img src="/assets/logo.png" alt="DeskTown Logo" className="w-full h-full object-contain p-1" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-sidebar" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">DeskTown</h1>
              <p className="text-xs text-muted-foreground">
                {isOfficeRenter ? t.sidebar?.businessServices || "Business Services" : t.sidebar?.virtualWorkspace || "Virtual Workspace"}
              </p>
            </div>
          </div>
          <LanguageSwitcher size="icon" showLabel={false} />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        {Object.entries(groupedItems).map(([categoryKey, items]) => {
          const CategoryIcon = categoryIcons[categoryKey] || Sparkles;
          return (
            <SidebarGroup key={categoryKey} className="mb-2">
              <SidebarGroupLabel className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider px-3 mb-1">
                <CategoryIcon className="h-3 w-3" />
                {getCategoryLabel(categoryKey)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive = location === item.url;
                    const itemLabel = getItemLabel(item.titleKey);
                    const notifCount = notificationCounts[item.titleKey] || 0;
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton
                          asChild
                          className={cn(
                            "group relative rounded-lg transition-all duration-200",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                          )}
                        >
                          <Link
                            href={item.url}
                            data-testid={`link-nav-${item.titleKey.toLowerCase().replace(/\s/g, "-")}`}
                            className="flex items-center gap-3 px-3 py-2.5"
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full glow" />
                            )}
                            <item.icon className={cn(
                              "h-4 w-4 transition-colors",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="font-medium text-sm">{itemLabel}</span>
                            {notifCount > 0 && (
                              <Badge
                                variant="destructive"
                                className="ml-auto h-5 min-w-5 px-1.5 text-xs font-semibold"
                                data-testid={`badge-${item.titleKey.toLowerCase()}-count`}
                              >
                                {notifCount > 99 ? '99+' : notifCount}
                              </Badge>
                            )}
                            {isActive && notifCount === 0 && (
                              <ChevronRight className="ml-auto h-4 w-4 text-primary/50" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-white/5">
        <div className="glass rounded-xl p-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UserAvatar name={displayName} avatar={avatar} size="md" status="online" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate capitalize flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {displayRole}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
              data-testid="button-logout"
              onClick={() => window.location.href = '/api/logout'}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
