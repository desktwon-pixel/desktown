import { useLocation, Link } from "wouter";
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
import { UserAvatar } from "./UserAvatar";
import {
  Home,
  Building2,
  Package,
  Briefcase,
  MessageCircle,
  LogOut,
  User,
  ChevronRight,
  Sparkles,
  Store,
  Heart,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage, translations } from "@/lib/i18n";

interface NavItem {
  titleKey: string;
  url: string;
  icon: typeof Home;
  categoryKey: string;
}

const navigationItems: NavItem[] = [
  { titleKey: "welcome", url: "/welcome", icon: Home, categoryKey: "home" },
  { titleKey: "browseOffices", url: "/visitor/offices", icon: Building2, categoryKey: "explore" },
  { titleKey: "findJobs", url: "/careers", icon: Briefcase, categoryKey: "opportunities" },
  { titleKey: "myProfile", url: "/profile", icon: User, categoryKey: "account" },
];

interface VisitorSidebarProps {
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    profileImageUrl?: string | null;
    role?: string | null;
  };
}

export function VisitorSidebar({ user }: VisitorSidebarProps) {
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Visitor' : 'Visitor';
  const avatar = user?.profileImageUrl;
  const [location] = useLocation();
  const { language } = useLanguage();
  const t = translations[language];

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.categoryKey]) acc[item.categoryKey] = [];
    acc[item.categoryKey].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const categoryIcons: Record<string, typeof Sparkles> = {
    home: Home,
    explore: Store,
    opportunities: Briefcase,
    support: MessageCircle,
    account: User,
  };

  const getCategoryLabel = (categoryKey: string) => {
    const labels: Record<string, string> = {
      home: t.sidebar?.home || "Home",
      explore: t.sidebar?.explore || "Explore",
      opportunities: t.sidebar?.opportunities || "Opportunities",
      support: t.sidebar?.support || "Support",
      account: t.sidebar?.account || "Account",
    };
    return labels[categoryKey] || categoryKey;
  };

  const getItemLabel = (titleKey: string) => {
    const labels: Record<string, string> = {
      welcome: t.sidebar?.welcome || "Welcome",
      browseOffices: t.sidebar?.browseOffices || "Browse Offices",
      viewServices: t.sidebar?.viewServices || "View Services",
      findJobs: t.sidebar?.findJobs || "Find Jobs",
      contactUs: t.sidebar?.contactUs || "Contact Us",
      myProfile: t.sidebar?.myProfile || "My Profile",
    };
    return labels[titleKey] || titleKey;
  };

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
              <p className="text-xs text-muted-foreground">{t.sidebar?.welcomePortal || "Welcome Portal"}</p>
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
              <SidebarGroupLabel className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <CategoryIcon className="h-3.5 w-3.5" />
                {getCategoryLabel(categoryKey)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive = location === item.url || 
                      (item.url !== "/" && item.url !== "/welcome" && location.startsWith(item.url));
                    const itemLabel = getItemLabel(item.titleKey);
                    return (
                      <SidebarMenuItem key={item.titleKey}>
                        <SidebarMenuButton 
                          asChild 
                          isActive={isActive}
                          className={cn(
                            "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                            isActive 
                              ? "bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-foreground" 
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Link href={item.url} data-testid={`nav-${item.titleKey.toLowerCase().replace(/\s+/g, '-')}`}>
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-cyan-500 to-teal-500 rounded-r-full" />
                            )}
                            <item.icon className={cn(
                              "h-4 w-4 transition-colors",
                              isActive ? "text-cyan-500" : "text-muted-foreground group-hover:text-foreground"
                            )} />
                            <span className="flex-1 text-sm font-medium">{itemLabel}</span>
                            {isActive && (
                              <ChevronRight className="h-4 w-4 text-cyan-500" />
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
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-white/5 to-transparent">
          <UserAvatar 
            name={displayName}
            avatar={avatar} 
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-cyan-500 capitalize">{t.sidebar?.visitor || "Visitor"}</p>
          </div>
          <form action="/api/logout" method="POST">
            <Button 
              type="submit" 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
