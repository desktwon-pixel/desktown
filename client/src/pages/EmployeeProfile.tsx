import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  User,
  Calendar,
  Star,
  Building2,
  Clock,
  Calculator,
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  HeartHandshake,
  UserCheck,
  ClipboardList,
  GraduationCap,
  Award,
  Scale,
  FileSearch,
  Shield,
  BookOpen,
  Gavel,
  Megaphone,
  BarChart3,
  Target,
  Share2,
  Palette,
  Settings,
  Package,
  ListChecks,
  Gauge,
  Truck,
  PieChart,
  MessageSquare,
  FolderOpen,
  Bell,
  Wrench,
  Users,
} from "lucide-react";
import type { RemoteEmployee, Department } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: typeof Calculator;
  color: string;
}

const departmentTools: Record<string, Tool[]> = {
  calculator: [
    { id: "budget", name: "Budget Planner", description: "Plan and track departmental budgets", icon: Calculator, color: "text-blue-500" },
    { id: "expenses", name: "Expense Tracker", description: "Log and categorize expenses", icon: Receipt, color: "text-green-500" },
    { id: "invoices", name: "Invoice Manager", description: "Create and manage invoices", icon: FileText, color: "text-purple-500" },
    { id: "reports", name: "Financial Reports", description: "Generate financial summaries", icon: TrendingUp, color: "text-orange-500" },
    { id: "payroll", name: "Payroll Calculator", description: "Calculate employee payments", icon: CreditCard, color: "text-pink-500" },
    { id: "forecast", name: "Cash Flow Forecast", description: "Project future cash flows", icon: PieChart, color: "text-cyan-500" },
  ],
  hearthandshake: [
    { id: "leave", name: "Leave Tracker", description: "Manage employee leave requests", icon: Clock, color: "text-blue-500" },
    { id: "performance", name: "Performance Reviews", description: "Track employee evaluations", icon: Award, color: "text-yellow-500" },
    { id: "directory", name: "Employee Directory", description: "Searchable employee database", icon: Users, color: "text-green-500" },
    { id: "recruitment", name: "Recruitment Pipeline", description: "Track hiring progress", icon: UserCheck, color: "text-purple-500" },
    { id: "training", name: "Training Manager", description: "Organize training programs", icon: GraduationCap, color: "text-orange-500" },
    { id: "onboarding", name: "Onboarding Checklist", description: "New hire onboarding tasks", icon: ClipboardList, color: "text-pink-500" },
  ],
  scale: [
    { id: "contracts", name: "Contract Templates", description: "Legal document templates", icon: FileText, color: "text-blue-500" },
    { id: "compliance", name: "Compliance Checklist", description: "Regulatory requirements tracker", icon: Shield, color: "text-green-500" },
    { id: "cases", name: "Case Tracker", description: "Manage legal cases and matters", icon: FileSearch, color: "text-purple-500" },
    { id: "documents", name: "Document Repository", description: "Secure legal document storage", icon: FolderOpen, color: "text-orange-500" },
    { id: "policies", name: "Policy Manager", description: "Company policy management", icon: BookOpen, color: "text-cyan-500" },
    { id: "disputes", name: "Dispute Resolution", description: "Track and resolve disputes", icon: Gavel, color: "text-red-500" },
  ],
  megaphone: [
    { id: "campaigns", name: "Campaign Tracker", description: "Monitor marketing campaigns", icon: Target, color: "text-blue-500" },
    { id: "content", name: "Content Calendar", description: "Plan content schedule", icon: Calendar, color: "text-green-500" },
    { id: "analytics", name: "Analytics Dashboard", description: "Track marketing metrics", icon: BarChart3, color: "text-purple-500" },
    { id: "social", name: "Social Media Manager", description: "Manage social accounts", icon: Share2, color: "text-pink-500" },
    { id: "brand", name: "Brand Assets", description: "Brand guidelines and assets", icon: Palette, color: "text-orange-500" },
    { id: "leads", name: "Lead Generation", description: "Track marketing leads", icon: TrendingUp, color: "text-cyan-500" },
  ],
  settings: [
    { id: "projects", name: "Project Tracker", description: "Monitor project progress", icon: ListChecks, color: "text-blue-500" },
    { id: "inventory", name: "Inventory Manager", description: "Track stock and supplies", icon: Package, color: "text-green-500" },
    { id: "processes", name: "Process Documentation", description: "Document workflows", icon: BookOpen, color: "text-purple-500" },
    { id: "quality", name: "Quality Metrics", description: "Track quality standards", icon: Gauge, color: "text-orange-500" },
    { id: "vendors", name: "Vendor Management", description: "Manage supplier relationships", icon: Truck, color: "text-cyan-500" },
    { id: "maintenance", name: "Maintenance Scheduler", description: "Schedule equipment maintenance", icon: Wrench, color: "text-red-500" },
  ],
  dollarSign: [
    { id: "pipeline", name: "Sales Pipeline", description: "Track deals and opportunities", icon: TrendingUp, color: "text-blue-500" },
    { id: "leads", name: "Lead Tracker", description: "Manage sales leads", icon: Target, color: "text-green-500" },
    { id: "quotes", name: "Quote Generator", description: "Create sales proposals", icon: FileText, color: "text-purple-500" },
    { id: "clients", name: "Client Database", description: "Customer relationship manager", icon: Users, color: "text-orange-500" },
    { id: "commission", name: "Commission Calculator", description: "Calculate sales commissions", icon: Calculator, color: "text-pink-500" },
    { id: "forecasts", name: "Sales Forecasts", description: "Project future sales", icon: PieChart, color: "text-cyan-500" },
  ],
  users: [
    { id: "calendar", name: "Team Calendar", description: "Shared team schedule", icon: Calendar, color: "text-blue-500" },
    { id: "resources", name: "Resource Allocation", description: "Assign team resources", icon: Users, color: "text-green-500" },
    { id: "meetings", name: "Meeting Scheduler", description: "Plan team meetings", icon: Clock, color: "text-purple-500" },
    { id: "board", name: "Collaboration Board", description: "Team task board", icon: ListChecks, color: "text-orange-500" },
    { id: "analytics", name: "Team Analytics", description: "Team performance metrics", icon: BarChart3, color: "text-pink-500" },
    { id: "chat", name: "Team Chat", description: "Internal messaging", icon: MessageSquare, color: "text-cyan-500" },
  ],
  briefcase: [
    { id: "tasks", name: "Task Board", description: "Manage team tasks", icon: ListChecks, color: "text-blue-500" },
    { id: "notes", name: "Team Notes", description: "Shared documentation", icon: FileText, color: "text-green-500" },
    { id: "files", name: "File Manager", description: "Organize team files", icon: FolderOpen, color: "text-purple-500" },
    { id: "calendar", name: "Department Calendar", description: "Schedule and events", icon: Calendar, color: "text-orange-500" },
    { id: "announcements", name: "Announcements", description: "Team updates and news", icon: Bell, color: "text-pink-500" },
    { id: "directory", name: "Contact Directory", description: "Quick contact lookup", icon: Users, color: "text-cyan-500" },
  ],
};

export default function EmployeeProfile() {
  const { username } = useParams<{ username: string }>();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const { language } = useLanguage();
  const t = translations[language];

  const { data: employee, isLoading: employeeLoading } = useQuery<RemoteEmployee>({
    queryKey: ["/api/employees/username", username],
  });

  const { data: department } = useQuery<Department>({
    queryKey: ["/api/departments", employee?.departmentId],
    enabled: !!employee?.departmentId,
  });

  const normalizeIconKey = (icon: string): string => {
    const iconMap: Record<string, string> = {
      "dollar-sign": "dollarSign",
      "dollarsign": "dollarSign",
      "heart-handshake": "hearthandshake",
    };
    return iconMap[icon.toLowerCase()] || icon;
  };

  const getDepartmentTools = () => {
    if (!department) return [];
    const normalizedIcon = normalizeIconKey(department.icon || "briefcase");
    return departmentTools[normalizedIcon] || departmentTools.briefcase;
  };

  const getSpecialtyLabel = (icon: string) => {
    const normalizedIcon = normalizeIconKey(icon);
    const labels: Record<string, string> = {
      calculator: "Finance",
      hearthandshake: "Human Resources",
      scale: "Legal",
      megaphone: "Marketing",
      settings: "Operations",
      dollarSign: "Sales",
      users: "Team",
      briefcase: "General",
    };
    return labels[normalizedIcon] || "General";
  };

  if (employeeLoading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Card className="p-8 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
          <p className="text-muted-foreground">{t.employeeProfilePage?.employeeNotFound || "Employee not found"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === 'ar' ? "الملف الشخصي للموظف الذي تبحث عنه غير موجود." : "The employee profile you're looking for doesn't exist."}
          </p>
          <Link href="/departments">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t.employeeProfilePage?.goBack || "Go Back"}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const skillsList = employee.skills ? employee.skills.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const tools = getDepartmentTools();

  const ToolDialog = (
    <Dialog open={!!selectedTool} onOpenChange={(open) => !open && setSelectedTool(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedTool && <selectedTool.icon className={`h-5 w-5 ${selectedTool.color}`} />}
            {selectedTool?.name}
          </DialogTitle>
          <DialogDescription>{selectedTool?.description}</DialogDescription>
        </DialogHeader>
        <div className="py-6">
          {selectedTool?.id === "budget" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-bold">$150,000</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm text-muted-foreground">Spent</p>
                    <p className="text-2xl font-bold text-orange-500">$87,500</p>
                  </CardContent>
                </Card>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Budget Usage</span>
                  <span>58%</span>
                </div>
                <Progress value={58} />
              </div>
              <div className="space-y-2">
                <Label>Add Budget Item</Label>
                <div className="flex gap-2">
                  <Input placeholder="Description" className="flex-1" />
                  <Input placeholder="Amount" type="number" className="w-32" />
                  <Button>Add</Button>
                </div>
              </div>
            </div>
          )}
          {selectedTool?.id === "expenses" && (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Input placeholder="Expense description" className="flex-1" />
                <Input placeholder="Amount" type="number" className="w-32" />
                <Select defaultValue="office">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">Office</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Log</Button>
              </div>
              <div className="border rounded-lg divide-y">
                {[
                  { desc: "Office supplies", amount: 250, cat: "Supplies", date: "Dec 1" },
                  { desc: "Software license", amount: 1200, cat: "Software", date: "Nov 28" },
                  { desc: "Team lunch", amount: 180, cat: "Office", date: "Nov 25" },
                ].map((exp, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{exp.desc}</p>
                      <p className="text-xs text-muted-foreground">{exp.cat} - {exp.date}</p>
                    </div>
                    <p className="font-semibold">${exp.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {selectedTool?.id === "leave" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-500">12</p>
                    <p className="text-xs text-muted-foreground">Available Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-orange-500">3</p>
                    <p className="text-xs text-muted-foreground">Pending Requests</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">8</p>
                    <p className="text-xs text-muted-foreground">Days Used</p>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-2">
                <Label>Request Leave</Label>
                <div className="flex gap-2">
                  <Input type="date" className="flex-1" />
                  <Input type="date" className="flex-1" />
                  <Select defaultValue="vacation">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>Submit</Button>
                </div>
              </div>
            </div>
          )}
          {selectedTool?.id === "performance" && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <div className="flex justify-center gap-1 mb-2">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className={`h-8 w-8 ${star <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                  ))}
                </div>
                <p className="text-2xl font-bold">4.0 / 5.0</p>
                <p className="text-sm text-muted-foreground">{t.employeeProfilePage?.rating || "Rating"}</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Productivity</span>
                  <Progress value={85} className="w-32" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Communication</span>
                  <Progress value={90} className="w-32" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Teamwork</span>
                  <Progress value={78} className="w-32" />
                </div>
              </div>
            </div>
          )}
          {selectedTool?.id === "pipeline" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {["Lead", "Qualified", "Proposal", "Closed"].map((stage, i) => (
                  <div key={stage} className="text-center">
                    <div className="bg-muted rounded-lg p-3 mb-2">
                      <p className="text-2xl font-bold">{[12, 8, 5, 3][i]}</p>
                    </div>
                    <p className="text-sm font-medium">{stage}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Add New Deal</Label>
                <div className="flex gap-2">
                  <Input placeholder="Deal name" className="flex-1" />
                  <Input placeholder="Value" type="number" className="w-32" />
                  <Button>Add</Button>
                </div>
              </div>
            </div>
          )}
          {selectedTool?.id === "campaigns" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-blue-500">5</p>
                    <p className="text-xs text-muted-foreground">Active Campaigns</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-500">24.5K</p>
                    <p className="text-xs text-muted-foreground">Total Reach</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-purple-500">3.2%</p>
                    <p className="text-xs text-muted-foreground">Conversion Rate</p>
                  </CardContent>
                </Card>
              </div>
              <div className="border rounded-lg divide-y">
                {["Q4 Product Launch", "Holiday Sale", "Newsletter Campaign"].map((name, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <Button size="sm" variant="outline">{t.common?.view || "View"}</Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!["budget", "expenses", "leave", "performance", "pipeline", "campaigns"].includes(selectedTool?.id || "") && (
            <div className="text-center py-8">
              <div className={`h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4`}>
                {selectedTool && <selectedTool.icon className={`h-8 w-8 ${selectedTool.color}`} />}
              </div>
              <p className="text-muted-foreground mb-4">
                {language === 'ar' ? "هذه الأداة جاهزة للتهيئة لعملك." : "This tool is ready to be configured for your work."}
              </p>
              <Button data-testid="button-tool-get-started">{language === 'ar' ? "ابدأ الآن" : "Get Started"}</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedTool(null)} data-testid="button-tool-close">
            {t.common?.close || "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {ToolDialog}

      <div className="flex items-center gap-3">
        <Link href={department ? `/departments/${department.id}` : "/departments"}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{t.employeeProfilePage?.title || "Employee Profile"}</h1>
          {department && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              {department.name}
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={employee.profileImageUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {employee.firstName[0]}{employee.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold" data-testid="text-employee-name">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <p className="text-muted-foreground" data-testid="text-employee-username">
                    @{employee.username}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    employee.status === "active"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {employee.status || "active"}
                </Badge>
              </div>
              {employee.jobTitle && (
                <div className="flex items-center gap-2 mt-3 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span data-testid="text-employee-jobtitle">{employee.jobTitle}</span>
                </div>
              )}
              {employee.startDate && (
                <div className="flex items-center gap-2 mt-2 text-muted-foreground text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {t.employeeProfilePage?.joinDate || "Joined"} {new Date(employee.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className={`h-4 w-4 text-primary`} />
              {t.employeeProfilePage?.contact || "Contact Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.email ? (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.employeeProfilePage?.email || "Email"}</p>
                  <a
                    href={`mailto:${employee.email}`}
                    className="text-sm hover:underline"
                    data-testid="link-employee-email"
                  >
                    {employee.email}
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{language === 'ar' ? "لا يوجد بريد إلكتروني" : "No email provided"}</p>
            )}
            {employee.phone ? (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t.employeeProfilePage?.phone || "Phone"}</p>
                  <a
                    href={`tel:${employee.phone}`}
                    className="text-sm hover:underline"
                    data-testid="link-employee-phone"
                  >
                    {employee.phone}
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{language === 'ar' ? "لا يوجد هاتف" : "No phone provided"}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className={`h-4 w-4 text-primary`} />
              {language === 'ar' ? "المهارات والخبرات" : "Skills & Expertise"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {skillsList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{language === 'ar' ? "لا توجد مهارات مدرجة" : "No skills listed"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {employee.bio && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className={`h-4 w-4 text-primary`} />
              {language === 'ar' ? "نبذة" : "About"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-employee-bio">
              {employee.bio}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className={`h-4 w-4 text-primary`} />
            {language === 'ar' ? "تفاصيل التوظيف" : "Employment Details"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t.employeeProfilePage?.department || "Department"}</p>
              <p className="text-sm font-medium">{department?.name || (t.common?.loading || "Loading...")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? "الحالة" : "Status"}</p>
              <p className="text-sm font-medium capitalize">{employee.status || "active"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.employeeProfilePage?.joinDate || "Start Date"}</p>
              <p className="text-sm font-medium">
                {employee.startDate
                  ? new Date(employee.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                  : (language === 'ar' ? "غير محدد" : "Not specified")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{language === 'ar' ? "رقم الموظف" : "Employee ID"}</p>
              <p className="text-sm font-medium">EMP-{String(employee.id).padStart(5, "0")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {department && tools.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className={`h-4 w-4 text-primary`} />
              {t.employeeProfilePage?.departmentTools || "Department Tools"} - {getSpecialtyLabel(department.icon || "briefcase")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              {language === 'ar' 
                ? `الأدوات المتخصصة المتاحة لدورك في قسم ${department.name}`
                : `Specialty tools available for your role in the ${department.name} department`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-start gap-1 hover-elevate"
                  onClick={() => setSelectedTool(tool)}
                  data-testid={`tool-button-${tool.id}`}
                >
                  <div className="flex items-center gap-2">
                    <tool.icon className={`h-4 w-4 ${tool.color}`} />
                    <span className="font-medium text-sm">{tool.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground text-left line-clamp-1">
                    {tool.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
