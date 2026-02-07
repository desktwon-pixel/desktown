import { TopHeader } from "../TopHeader";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/components/ui/sidebar";

const mockNotifications = [
  { id: "1", title: "New task assigned", message: "You have been assigned to 'Review Q4 reports'", time: "5 min ago", isRead: false },
  { id: "2", title: "Meeting reminder", message: "Sprint Planning starts in 30 minutes", time: "25 min ago", isRead: false },
  { id: "3", title: "Comment on your post", message: "James Wilson commented on your update", time: "1 hour ago", isRead: true },
];

export default function TopHeaderExample() {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <div className="w-full">
          <TopHeader
            notifications={mockNotifications}
            onNotificationClick={(id) => console.log("Clicked notification:", id)}
          />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
