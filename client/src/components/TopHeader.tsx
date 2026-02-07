import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationItem } from "./NotificationItem";
import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { Notification } from "@shared/schema";

export function TopHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = unreadData?.count || 0;

  const handleNotificationClick = (id: number) => {
    markReadMutation.mutate(id);
  };

  return (
    <header className="flex items-center justify-between gap-4 h-16 px-4 border-b bg-background sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center overflow-hidden border border-white/5">
              <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain p-0.5" />
            </div>
            <span className="font-bold text-lg hidden md:inline-block">DeskTown</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 max-w-md mx-4">
        {searchOpen ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-9"
              autoFocus
              onBlur={() => setSearchOpen(false)}
              data-testid="input-search"
            />
          </div>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setSearchOpen(true)}
            data-testid="button-search"
          >
            <Search className="h-4 w-4 mr-2" />
            Search...
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-2">
            <div className="flex items-center justify-between px-2 pb-2 border-b mb-2">
              <span className="font-medium">Notifications</span>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => markAllReadMutation.mutate()}
                >
                  Mark all read
                </Button>
              )}
            </div>
            {notifications.length > 0 ? (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    id={String(notification.id)}
                    title={notification.title}
                    message={notification.message || ""}
                    time={notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ""}
                    isRead={notification.read || false}
                    onClick={() => handleNotificationClick(notification.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No notifications
              </p>
            )}
          </PopoverContent>
        </Popover>
        <ThemeToggle />
      </div>
    </header>
  );
}
