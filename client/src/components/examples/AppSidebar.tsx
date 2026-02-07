import { AppSidebar } from "../AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  return (
    <SidebarProvider>
      <AppSidebar
        user={{
          name: "Sarah Chen",
          email: "sarah.chen@company.com",
          role: "admin",
        }}
      />
    </SidebarProvider>
  );
}
