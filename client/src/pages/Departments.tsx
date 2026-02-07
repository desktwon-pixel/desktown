import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Link } from "wouter";
import {
  Building2,
  Plus,
  Users,
  Briefcase,
  DollarSign,
  Calculator,
  HeartHandshake,
  Scale,
  Megaphone,
  Settings,
  ArrowRight,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  Activity,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Department, RemoteEmployee } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";

const departmentIcons: Record<string, typeof Briefcase> = {
  briefcase: Briefcase,
  calculator: Calculator,
  users: Users,
  hearthandshake: HeartHandshake,
  scale: Scale,
  megaphone: Megaphone,
  settings: Settings,
  dollarSign: DollarSign,
};

const departmentColors: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  green: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  red: "bg-red-500/10 text-red-500 border-red-500/20",
  pink: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  yellow: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  cyan: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

export default function Departments() {
  const { language } = useLanguage();
  const t = translations[language];

  const colorOptions = [
    { value: "blue", label: t.departments?.colorBlue || "Blue" },
    { value: "green", label: t.departments?.colorGreen || "Green" },
    { value: "purple", label: t.departments?.colorPurple || "Purple" },
    { value: "orange", label: t.departments?.colorOrange || "Orange" },
    { value: "red", label: t.departments?.colorRed || "Red" },
    { value: "pink", label: t.departments?.colorPink || "Pink" },
    { value: "yellow", label: t.departments?.colorYellow || "Yellow" },
    { value: "cyan", label: t.departments?.colorCyan || "Cyan" },
  ];

  const iconOptions = [
    { value: "briefcase", label: t.departments?.iconGeneral || "General", icon: Briefcase },
    { value: "calculator", label: t.departments?.iconFinance || "Finance", icon: Calculator },
    { value: "users", label: t.departments?.iconTeam || "Team", icon: Users },
    { value: "hearthandshake", label: t.departments?.iconHR || "Human Resources", icon: HeartHandshake },
    { value: "scale", label: t.departments?.iconLegal || "Legal", icon: Scale },
    { value: "megaphone", label: t.departments?.iconMarketing || "Marketing", icon: Megaphone },
    { value: "settings", label: t.departments?.iconOperations || "Operations", icon: Settings },
    { value: "dollarSign", label: t.departments?.iconSales || "Sales", icon: DollarSign },
  ];
  const { toast } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDeptOpen, setNewDeptOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");
  const [deptIcon, setDeptIcon] = useState("briefcase");
  const [deptColor, setDeptColor] = useState("blue");
  const [deptPassword, setDeptPassword] = useState("");
  const [unlocked, setUnlocked] = useState<Set<number>>(new Set());

  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: employees = [] } = useQuery<RemoteEmployee[]>({
    queryKey: ["/api/departments", selectedDepartment?.id, "employees"],
    enabled: !!selectedDepartment && unlocked.has(selectedDepartment.id),
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; icon: string; color: string; password?: string }) => {
      const res = await apiRequest("POST", "/api/departments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setNewDeptOpen(false);
      setDeptName("");
      setDeptDescription("");
      setDeptIcon("briefcase");
      setDeptColor("blue");
      setDeptPassword("");
      toast({ title: t.departments?.departmentCreated || "Department Created", description: t.departments?.departmentCreatedDesc || "New department has been added." });
    },
    onError: () => {
      toast({ title: t.departments?.error || "Error", description: t.departments?.failedCreate || "Failed to create department.", variant: "destructive" });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setSelectedDepartment(null);
      toast({ title: t.departments?.departmentDeleted || "Department Deleted", description: t.departments?.departmentDeletedDesc || "The department has been removed." });
    },
  });

  const verifyPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await apiRequest("POST", `/api/departments/${id}/verify-password`, { password });
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (data.valid) {
        setUnlocked(prev => new Set(Array.from(prev).concat(variables.id)));
        setPasswordDialogOpen(false);
        setPasswordInput("");
        toast({ title: t.departments?.accessGranted || "Access Granted", description: t.departments?.departmentUnlocked || "Department unlocked successfully." });
      } else {
        toast({ title: t.departments?.accessDenied || "Access Denied", description: t.departments?.incorrectPassword || "Incorrect password.", variant: "destructive" });
      }
    },
  });

  const handleSelectDepartment = (dept: Department) => {
    setSelectedDepartment(dept);
    if (dept.password && !unlocked.has(dept.id)) {
      setPasswordDialogOpen(true);
    } else {
      setUnlocked(prev => new Set(Array.from(prev).concat(dept.id)));
    }
  };

  const isDepartmentUnlocked = (dept: Department) => {
    return !dept.password || unlocked.has(dept.id);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t.departments?.myDepartments || "My Departments"}</h1>
          <p className="text-muted-foreground text-sm">{t.departments?.subtitle || "Manage your team departments and employees"}</p>
        </div>
        <Dialog open={newDeptOpen} onOpenChange={setNewDeptOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-department">
              <Plus className="h-4 w-4 mr-2" />
              {t.departments?.addDepartment || "Add Department"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.departments?.createDepartment || "Create Department"}</DialogTitle>
              <DialogDescription>
                {t.departments?.createDepartmentDesc || "Add a new department to organize your team."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dept-name">{t.departments?.departmentName || "Department Name"}</Label>
                <Input
                  id="dept-name"
                  placeholder={t.departments?.departmentNamePlaceholder || "e.g., Human Resources, Finance"}
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  data-testid="input-department-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-desc">{t.departments?.description || "Description"}</Label>
                <Textarea
                  id="dept-desc"
                  placeholder={t.departments?.descriptionPlaceholder || "Brief description of the department..."}
                  value={deptDescription}
                  onChange={(e) => setDeptDescription(e.target.value)}
                  data-testid="input-department-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t.departments?.icon || "Icon"}</Label>
                  <Select value={deptIcon} onValueChange={setDeptIcon}>
                    <SelectTrigger data-testid="select-department-icon">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t.departments?.color || "Color"}</Label>
                  <Select value={deptColor} onValueChange={setDeptColor}>
                    <SelectTrigger data-testid="select-department-color">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept-password">{t.departments?.passwordProtection || "Password Protection (Optional)"}</Label>
                <div className="relative">
                  <Input
                    id="dept-password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.departments?.passwordPlaceholder || "Leave empty for no password"}
                    value={deptPassword}
                    onChange={(e) => setDeptPassword(e.target.value)}
                    data-testid="input-department-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t.departments?.passwordHint || "Set a password to protect department access"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() =>
                  createDepartmentMutation.mutate({
                    name: deptName,
                    description: deptDescription,
                    icon: deptIcon,
                    color: deptColor,
                    password: deptPassword || undefined,
                  })
                }
                disabled={!deptName || createDepartmentMutation.isPending}
                data-testid="button-create-department"
              >
                {createDepartmentMutation.isPending ? (t.departments?.creating || "Creating...") : (t.departments?.createDepartment || "Create Department")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t.departments?.departmentProtected || "Department Protected"}
            </DialogTitle>
            <DialogDescription>
              {t.departments?.enterPasswordToAccess || "This department is password protected. Enter the password to access."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder={t.departments?.enterPassword || "Enter password"}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              data-testid="input-verify-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && selectedDepartment) {
                  verifyPasswordMutation.mutate({ id: selectedDepartment.id, password: passwordInput });
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
              {t.common?.cancel || "Cancel"}
            </Button>
            <Button
              onClick={() => {
                if (selectedDepartment) {
                  verifyPasswordMutation.mutate({ id: selectedDepartment.id, password: passwordInput });
                }
              }}
              disabled={verifyPasswordMutation.isPending}
              data-testid="button-verify-password"
            >
              {verifyPasswordMutation.isPending ? (t.departments?.verifying || "Verifying...") : (t.departments?.unlock || "Unlock")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {t.departments?.yourDepartments || "Your Departments"}
          </h2>
          {departmentsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
          ) : departments.length === 0 ? (
            <Card className="p-6 text-center">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
              <p className="text-muted-foreground text-sm">{t.departments?.noDepartments || "No departments yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.departments?.createFirst || "Create your first department to get started"}</p>
            </Card>
          ) : (
            departments.map((dept) => {
              const IconComponent = departmentIcons[dept.icon || "briefcase"] || Briefcase;
              const colorClass = departmentColors[dept.color || "blue"] || departmentColors.blue;

              return (
                <Card
                  key={dept.id}
                  className={`hover-elevate cursor-pointer transition-all ${
                    selectedDepartment?.id === dept.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => handleSelectDepartment(dept)}
                  data-testid={`department-card-${dept.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{dept.name}</h3>
                          {dept.password && (
                            unlocked.has(dept.id) ? (
                              <Unlock className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )
                          )}
                        </div>
                        {dept.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {dept.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedDepartment ? (
            isDepartmentUnlocked(selectedDepartment) ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      {selectedDepartment.name}
                      {selectedDepartment.password && <Unlock className="h-4 w-4 text-emerald-500" />}
                    </h2>
                    {selectedDepartment.description && (
                      <p className="text-sm text-muted-foreground">{selectedDepartment.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/departments/${selectedDepartment.id}`}>
                      <Button size="sm" data-testid="button-manage-employees">
                        <UserPlus className="h-4 w-4 mr-1" />
                        {t.departments?.manageEmployees || "Manage Employees"}
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDepartmentMutation.mutate(selectedDepartment.id)}
                      data-testid="button-delete-department"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold">{employees.length}</p>
                      <p className="text-xs text-muted-foreground">{t.departments?.employees || "Employees"}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Activity className="h-6 w-6 mx-auto text-emerald-500 mb-2" />
                      <p className="text-2xl font-bold">{employees.filter(e => e.status === 'active').length}</p>
                      <p className="text-xs text-muted-foreground">{t.departments?.active || "Active"}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t.departments?.teamMembers || "Team Members"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employees.length === 0 ? (
                      <div className="text-center py-6">
                        <Users className="h-10 w-10 mx-auto text-muted-foreground opacity-50 mb-2" />
                        <p className="text-sm text-muted-foreground">{t.departments?.noEmployees || "No employees yet"}</p>
                        <Link href={`/departments/${selectedDepartment.id}`}>
                          <Button size="sm" className="mt-3" data-testid="button-add-first-employee">
                            <UserPlus className="h-4 w-4 mr-1" />
                            {t.departments?.addFirstEmployee || "Add First Employee"}
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {employees.map((emp) => (
                          <div
                            key={emp.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                            data-testid={`employee-row-${emp.id}`}
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={emp.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {emp.firstName[0]}{emp.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{emp.username} {emp.jobTitle && `• ${emp.jobTitle}`}
                              </p>
                            </div>
                            <Badge variant={emp.status === 'active' ? 'default' : 'secondary'}>
                              {emp.status === 'active' ? (t.departments?.statusActive || "Active") : (t.departments?.statusInactive || "Inactive")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <Lock className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                  <h3 className="font-medium text-lg mb-1">{t.departments?.departmentLocked || "Department Locked"}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.departments?.enterPasswordToAccess || "Enter the password to access this department"}
                  </p>
                  <Button onClick={() => setPasswordDialogOpen(true)} data-testid="button-unlock-department">
                    <Lock className="h-4 w-4 mr-2" />
                    {t.departments?.unlockDepartment || "Unlock Department"}
                  </Button>
                </div>
              </Card>
            )
          ) : (
            <Card className="h-full flex items-center justify-center p-8">
              <div className="text-center">
                <Briefcase className="h-16 w-16 mx-auto text-muted-foreground opacity-30 mb-4" />
                <h3 className="font-medium text-lg mb-1">{t.departments?.selectDepartment || "Select a Department"}</h3>
                <p className="text-sm text-muted-foreground">
                  {t.departments?.chooseDepartment || "Choose a department from the list to manage its employees"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
