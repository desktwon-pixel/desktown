import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Plus,
  Users,
  Mail,
  Phone,
  Briefcase,
  Trash2,
  Edit,
  User,
  Calendar,
  Star,
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
  Clock,
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
} from "lucide-react";
import type { Department as DepartmentType, RemoteEmployee } from "@shared/schema";

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: typeof Calculator;
  color: string;
}

interface ToolCategory {
  specialty: string;
  tools: Tool[];
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

export default function Department() {
  const { id } = useParams<{ id: string }>();
  const departmentId = parseInt(id || "0");
  const { toast } = useToast();
  const [newEmployeeOpen, setNewEmployeeOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<RemoteEmployee | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [activeTab, setActiveTab] = useState("employees");

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");

  const { data: department, isLoading: departmentLoading } = useQuery<DepartmentType>({
    queryKey: ["/api/departments", departmentId],
  });

  const { data: employees = [], isLoading: employeesLoading } = useQuery<RemoteEmployee[]>({
    queryKey: ["/api/departments", departmentId, "employees"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: {
      username: string;
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      jobTitle?: string;
      bio?: string;
      skills?: string;
    }) => {
      const res = await apiRequest("POST", `/api/departments/${departmentId}/employees`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", departmentId, "employees"] });
      resetForm();
      setNewEmployeeOpen(false);
      toast({ title: "Employee Added", description: "Remote employee has been added to the department." });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add employee. Username may already exist.",
        variant: "destructive",
      });
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<RemoteEmployee> }) => {
      const res = await apiRequest("PATCH", `/api/employees/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", departmentId, "employees"] });
      setEditEmployee(null);
      resetForm();
      toast({ title: "Employee Updated", description: "Employee information has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update employee.", variant: "destructive" });
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      await apiRequest("DELETE", `/api/employees/${employeeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments", departmentId, "employees"] });
      toast({ title: "Employee Removed", description: "Employee has been removed from the department." });
    },
  });

  const resetForm = () => {
    setUsername("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setBio("");
    setSkills("");
  };

  const openEditDialog = (employee: RemoteEmployee) => {
    setEditEmployee(employee);
    setUsername(employee.username);
    setFirstName(employee.firstName);
    setLastName(employee.lastName);
    setEmail(employee.email || "");
    setPhone(employee.phone || "");
    setJobTitle(employee.jobTitle || "");
    setBio(employee.bio || "");
    setSkills(employee.skills || "");
  };

  const handleSubmit = () => {
    const data = {
      username,
      firstName,
      lastName,
      email: email || undefined,
      phone: phone || undefined,
      jobTitle: jobTitle || undefined,
      bio: bio || undefined,
      skills: skills || undefined,
    };

    if (editEmployee) {
      updateEmployeeMutation.mutate({ id: editEmployee.id, data });
    } else {
      createEmployeeMutation.mutate(data);
    }
  };

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

  if (departmentLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="p-4 md:p-6 max-w-6xl mx-auto">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Department not found</p>
          <Link href="/departments">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Departments
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const tools = getDepartmentTools();

  const EmployeeDialog = (
    <Dialog
      open={newEmployeeOpen || !!editEmployee}
      onOpenChange={(open) => {
        if (!open) {
          setNewEmployeeOpen(false);
          setEditEmployee(null);
          resetForm();
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editEmployee ? "Edit Employee" : "Add Remote Employee"}</DialogTitle>
          <DialogDescription>
            {editEmployee
              ? "Update employee information."
              : "Add a new remote employee with a unique username."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="e.g., john.doe"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "."))}
              disabled={!!editEmployee}
              data-testid="input-employee-username"
            />
            <p className="text-xs text-muted-foreground">
              Unique identifier for the employee. Cannot be changed after creation.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-employee-firstname"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                data-testid="input-employee-lastname"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              placeholder="e.g., Senior Accountant"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              data-testid="input-employee-jobtitle"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-employee-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                data-testid="input-employee-phone"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Brief description..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              data-testid="input-employee-bio"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="skills">Skills</Label>
            <Input
              id="skills"
              placeholder="e.g., Excel, QuickBooks, Financial Analysis"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              data-testid="input-employee-skills"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={
              !username ||
              !firstName ||
              !lastName ||
              createEmployeeMutation.isPending ||
              updateEmployeeMutation.isPending
            }
            data-testid="button-save-employee"
          >
            {createEmployeeMutation.isPending || updateEmployeeMutation.isPending
              ? "Saving..."
              : editEmployee
              ? "Update Employee"
              : "Add Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

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
              <div className="border rounded-lg divide-y">
                {employees.slice(0, 3).map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{emp.firstName[0]}{emp.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.jobTitle || "Team Member"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1,2,3,4,5].map((star) => (
                          <Star key={star} className={`h-4 w-4 ${star <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}`} />
                        ))}
                      </div>
                      <Button size="sm" variant="outline">Review</Button>
                    </div>
                  </div>
                ))}
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
                    <Button size="sm" variant="outline">View</Button>
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
                This tool is ready to be configured for your team.
              </p>
              <Button data-testid="button-tool-get-started">Get Started</Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedTool(null)} data-testid="button-tool-close">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {EmployeeDialog}
      {ToolDialog}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/departments">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold" data-testid="text-department-name">{department.name}</h1>
              <Badge variant="secondary">{getSpecialtyLabel(department.icon || "briefcase")}</Badge>
            </div>
            {department.description && (
              <p className="text-muted-foreground text-sm">{department.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => setNewEmployeeOpen(true)} data-testid="button-add-employee">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="employees" className="gap-2" data-testid="tab-employees">
            <Users className="h-4 w-4" />
            Employees ({employees.length})
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-2" data-testid="tab-tools">
            <Wrench className="h-4 w-4" />
            Tools ({tools.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employeesLoading ? (
              Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)
            ) : employees.length === 0 ? (
              <Card className="col-span-full p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground">No employees in this department</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add remote employees to start building your team
                </p>
                <Button onClick={() => setNewEmployeeOpen(true)} className="mt-4" data-testid="button-add-first-employee">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Employee
                </Button>
              </Card>
            ) : (
              employees.map((employee) => (
                <Card key={employee.id} className="hover-elevate" data-testid={`employee-card-${employee.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={employee.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">
                              {employee.firstName} {employee.lastName}
                            </h3>
                            <p className="text-xs text-muted-foreground">@{employee.username}</p>
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
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" />
                            {employee.jobTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {employee.bio && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{employee.bio}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-3">
                      {employee.email && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Mail className="h-3 w-3" />
                          {employee.email}
                        </Badge>
                      )}
                      {employee.phone && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Phone className="h-3 w-3" />
                          {employee.phone}
                        </Badge>
                      )}
                    </div>

                    {employee.skills && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {employee.skills.split(",").slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <Link href={`/employees/${employee.username}`}>
                        <Button size="sm" variant="ghost" data-testid={`button-view-profile-${employee.id}`}>
                          <User className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(employee)}
                          data-testid={`button-edit-employee-${employee.id}`}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteEmployeeMutation.mutate(employee.id)}
                          data-testid={`button-delete-employee-${employee.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tools" className="mt-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{getSpecialtyLabel(department.icon || "briefcase")} Tools</h2>
            <p className="text-sm text-muted-foreground">
              Specialty tools designed for your {getSpecialtyLabel(department.icon || "briefcase").toLowerCase()} team
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Card 
                key={tool.id} 
                className="hover-elevate cursor-pointer" 
                onClick={() => setSelectedTool(tool)}
                data-testid={`tool-card-${tool.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center`}>
                      <tool.icon className={`h-5 w-5 ${tool.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{tool.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{tool.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
