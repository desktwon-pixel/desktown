import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Task, User, Department } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";

export default function Tasks() {
    const { language } = useLanguage();
    const t = translations[language];
    const { toast } = useToast();
    const { user: authUser } = useAuth();

    const [filterDepartment, setFilterDepartment] = useState("all");
    const [filterManager, setFilterManager] = useState("all");
    const [filterSupervisor, setFilterSupervisor] = useState("all");
    const [filterEmployee, setFilterEmployee] = useState("all");
    const [filterAssigned, setFilterAssigned] = useState("all");

    const [newTask, setNewTask] = useState({
        title: "",
        description: "",
        priority: "medium",
        dueDate: "",
        assigneeId: "",
        assignToWholeDepartment: false,
    });

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 4;

    const { data: tasks = [], isLoading } = useQuery<Task[]>({
        queryKey: ["/api/tasks"],
    });

    const { data: users = [] } = useQuery<User[]>({
        queryKey: ["/api/users"],
    });

    const { data: departments = [] } = useQuery<Department[]>({
        queryKey: ["/api/departments"],
    });

    const createTaskMutation = useMutation({
        mutationFn: async (data: {
            title: string;
            description?: string;
            priority: string;
            dueDate?: string;
            assigneeId?: string;
        }) => {
            return await apiRequest("POST", "/api/tasks", {
                title: data.title,
                description: data.description || null,
                priority: data.priority,
                dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
                assigneeId: data.assigneeId || null,
                status: "pending",
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
            setNewTask({
                title: "",
                description: "",
                priority: "medium",
                dueDate: "",
                assigneeId: "",
                assignToWholeDepartment: false,
            });
            toast({
                title: language === "ar" ? "تم إنشاء المهمة" : "Task created",
                description:
                    language === "ar"
                        ? "تمت إضافة مهمتك الجديدة"
                        : "Your new task has been added.",
            });
        },
        onError: () => {
            toast({
                title: language === "ar" ? "خطأ" : "Error",
                description:
                    language === "ar" ? "فشل إنشاء المهمة" : "Failed to create task.",
                variant: "destructive",
            });
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async ({ id, status }: { id: number; status: string }) => {
            return await apiRequest("PATCH", `/api/tasks/${id}`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
        },
    });

    const handleCreateTask = () => {
        if (newTask.title) {
            createTaskMutation.mutate({
                title: newTask.title,
                description: newTask.description || undefined,
                priority: newTask.priority,
                dueDate: newTask.dueDate || undefined,
                assigneeId: newTask.assigneeId || undefined,
            });
        }
    };

    const handleApproveTask = (taskId: number) => {
        updateTaskMutation.mutate({ id: taskId, status: "completed" });
    };

    const handleRejectTask = (taskId: number) => {
        updateTaskMutation.mutate({ id: taskId, status: "failed" });
    };

    const getUserById = (userId: string | null) => {
        if (!userId) return null;
        return users.find((u) => u.id === userId);
    };

    const getStatusBadge = (status: string | null) => {
        switch (status || "pending") {
            case "in_progress":
                return (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-xs">
                        {language === "ar" ? "قيد التنفيذ" : "IN PROGRESS"}
                    </Badge>
                );
            case "completed":
                return (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs">
                        {language === "ar" ? "مكتمل" : "COMPLETED"}
                    </Badge>
                );
            case "failed":
                return (
                    <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs">
                        {language === "ar" ? "فشل" : "FAILED"}
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-slate-500 hover:bg-slate-600 text-white text-xs">
                        {language === "ar" ? "معلق" : "PENDING"}
                    </Badge>
                );
        }
    };

    const getStatusColor = (status: string | null) => {
        switch (status || "pending") {
            case "in_progress":
                return "border-l-amber-500";
            case "completed":
                return "border-l-emerald-500";
            case "failed":
                return "border-l-red-500";
            default:
                return "border-l-slate-500";
        }
    };

    const filteredTasks = tasks.filter((task) => {
        if (filterEmployee !== "all" && task.assigneeId !== filterEmployee)
            return false;

        // Filter by department if needed
        if (filterDepartment !== "all") {
            const assignee = getUserById(task.assigneeId);
            if (assignee?.department !== filterDepartment) return false;
        }

        return true;
    });

    const paginatedTasks = filteredTasks.slice(
        currentPage * itemsPerPage,
        (currentPage + 1) * itemsPerPage,
    );
    const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

    const summaryData = [
        {
            deptInternal: language === "ar" ? "قسم داخلي" : "Dept Internal",
            employees: language === "ar" ? "الموظفون" : "Employees",
            task: language === "ar" ? "الموظفون" : "Employees",
            corporateSecret: language === "ar" ? "سري" : "Corporate Secret",
            status: language === "ar" ? "جاهزية الموظف" : "Eanh Seeleyesness",
        },
        {
            deptInternal: language === "ar" ? "قبول للتوظيف" : "Acent to enploct",
            employees: language === "ar" ? "حجز بالتيكت" : "Reserve Beltect",
            task: language === "ar" ? "مهمة" : "Task",
            corporateSecret: language === "ar" ? "اقتباس أمني" : "Cottate secuor",
            status: "Teti Balty",
        },
        {
            deptInternal: "•••",
            employees: "•••",
            task: "•••",
            corporateSecret: "•••",
            status: "•••",
        },
    ];

    const handleLogout = () => {
        window.location.href = '/api/logout';
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 space-y-6 w-full h-full bg-slate-50">
                <Skeleton className="h-10 w-64 bg-gray-200" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-96 bg-gray-200" />
                    <Skeleton className="h-96 bg-gray-200" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50 text-gray-900 p-4 md:p-6 space-y-6 w-full overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1
                    className="text-2xl font-bold tracking-tight text-gray-900"
                    data-testid="text-command-center-title"
                >
                    {language === "ar" ? "مركز التحكم" : "Command Center"}
                </h1>
                <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="gap-2 bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
                    data-testid="button-logout"
                >
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {language === "ar" ? "تسجيل الخروج" : "Logout"}
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                        {language === "ar" ? "القسم:" : "Department:"}
                    </Label>
                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                        <SelectTrigger
                            className="bg-white border-gray-200 text-gray-900 shadow-sm"
                            data-testid="select-department"
                        >
                            <SelectValue
                                placeholder={language === "ar" ? "الكل" : "All"}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {language === "ar" ? "الكل" : "All"}
                            </SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.name}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                        {language === "ar" ? "المدير:" : "Manager:"}
                    </Label>
                    <Select value={filterManager} onValueChange={setFilterManager}>
                        <SelectTrigger
                            className="bg-white border-gray-200 text-teal-600 shadow-sm font-medium"
                            data-testid="select-manager"
                        >
                            <SelectValue placeholder={language === "ar" ? "التسويق" : "Marketing"} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                            {users
                                .filter((u) => u.role === "manager" || u.role === "admin")
                                .map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                        {language === "ar" ? "المشرفون:" : "Supervisors:"}
                    </Label>
                    <Select value={filterSupervisor} onValueChange={setFilterSupervisor}>
                        <SelectTrigger
                            className="bg-white border-gray-200 text-gray-900 shadow-sm"
                            data-testid="select-supervisor"
                        >
                            <SelectValue
                                placeholder={
                                    language === "ar" ? "مشرفو العمليات" : "Overse Supervisors"
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                {language === "ar" ? "مشرفو العمليات" : "Overse Supervisors"}
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                        {language === "ar" ? "الموظف:" : "Employee:"}
                    </Label>
                    <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                        <SelectTrigger
                            className="bg-white border-gray-200 text-gray-900 shadow-sm"
                            data-testid="select-employee"
                        >
                            <SelectValue placeholder="Seele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{language === "ar" ? "الكل" : "All"}</SelectItem>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.firstName || user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                        {language === "ar" ? "المعين:" : "Assigned:"}
                    </Label>
                    <Select value={filterAssigned} onValueChange={setFilterAssigned}>
                        <SelectTrigger
                            className="bg-white border-gray-200 text-gray-900 shadow-sm"
                            data-testid="select-assigned"
                        >
                            <SelectValue placeholder="Seele" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Seele</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="w-full h-px bg-gray-200"></div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {language === "ar" ? "إنشاء محتوى جديد" : "Create New Content"}
                    </h2>
                    <Card className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold text-gray-900">
                                {language === "ar" ? "إنشاء أمر جديد" : "Create New Command"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Input
                                    placeholder={
                                        language === "ar" ? "عنوان المهمة" : "Task Title"
                                    }
                                    value={newTask.title}
                                    onChange={(e) =>
                                        setNewTask({ ...newTask, title: e.target.value })
                                    }
                                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400"
                                    data-testid="input-task-title"
                                />
                            </div>
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={language === "ar" ? "الوصف" : "Description"}
                                    value={newTask.description}
                                    onChange={(e) =>
                                        setNewTask({ ...newTask, description: e.target.value })
                                    }
                                    className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 min-h-[60px] resize-none"
                                    data-testid="input-task-description"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        {language === "ar" ? "الأولوية" : "Urgency"}
                                    </span>
                                    <Select
                                        value={newTask.priority}
                                        onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                                    >
                                        <SelectTrigger className="w-32 bg-white border-gray-200 text-gray-900 h-8 shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">{language === 'ar' ? 'منخفض' : 'Low'}</SelectItem>
                                            <SelectItem value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</SelectItem>
                                            <SelectItem value="high">{language === 'ar' ? 'عالي' : 'High'}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1"></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">
                                    {language === "ar" ? "تاريخ الاستحقاق" : "Due Date"}
                                </span>
                                <div className="flex-1"></div>
                                <Input
                                    type="date"
                                    value={newTask.dueDate}
                                    onChange={(e) =>
                                        setNewTask({ ...newTask, dueDate: e.target.value })
                                    }
                                    className="w-40 bg-white border-gray-200 text-gray-900 shadow-sm"
                                    data-testid="input-due-date"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700">
                                    {language === "ar" ? "تحويل إلى موظف" : "Assign to Employee"}
                                </Label>
                                <Select
                                    value={newTask.assigneeId}
                                    onValueChange={(value) =>
                                        setNewTask({ ...newTask, assigneeId: value })
                                    }
                                >
                                    <SelectTrigger
                                        className="bg-white border-gray-200 text-gray-900 shadow-sm"
                                        data-testid="select-assignee"
                                    >
                                        <SelectValue
                                            placeholder={
                                                language === "ar"
                                                    ? "اختر موظف..."
                                                    : "Select employee..."
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem key={user.id} value={user.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center text-white text-xs">
                                                        {(
                                                            user.firstName?.[0] ||
                                                            user.email?.[0] ||
                                                            "U"
                                                        ).toUpperCase()}
                                                    </div>
                                                    <span>
                                                        {`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                                                            user.email}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    {language === "ar"
                                        ? "تعيين للقسم بالكامل"
                                        : "Assign to Whole Department"}
                                </span>
                                <Switch
                                    checked={newTask.assignToWholeDepartment}
                                    onCheckedChange={(checked) =>
                                        setNewTask({ ...newTask, assignToWholeDepartment: checked })
                                    }
                                    data-testid="switch-assign-department"
                                />
                            </div>
                            <Button
                                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm"
                                onClick={handleCreateTask}
                                disabled={createTaskMutation.isPending || !newTask.title}
                                data-testid="button-create-task"
                            >
                                {createTaskMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {language === "ar" ? "جاري الإنشاء..." : "Creating..."}
                                    </>
                                ) : language === "ar" ? (
                                    "إنشاء المهمة"
                                ) : (
                                    "Create Task"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {language === "ar" ? "بطاقات المهام" : "Task Cards"}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full content-start">
                        {paginatedTasks.length > 0 ? (
                            paginatedTasks.map((task) => {
                                const assignee = getUserById(task.assigneeId);
                                return (
                                    <Card
                                        key={task.id}
                                        className={`bg-white text-gray-900 border-0 border-l-4 ${getStatusColor(task.status)} rounded-xl relative overflow-visible shadow-sm`}
                                        data-testid={`task-card-${task.id}`}
                                    >
                                        <div className="absolute -top-2 -right-2 z-10">
                                            {task.status === "completed" ? (
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                                                    <CheckCircle2 className="h-5 w-5 text-white" />
                                                </div>
                                            ) : task.status === "failed" ? (
                                                <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                                                    <XCircle className="h-5 w-5 text-white" />
                                                </div>
                                            ) : (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleApproveTask(task.id)}
                                                        className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg hover:bg-emerald-600 transition-colors"
                                                        data-testid={`button-approve-${task.id}`}
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 text-white" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRejectTask(task.id)}
                                                        className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                                        data-testid={`button-reject-${task.id}`}
                                                    >
                                                        <XCircle className="h-4 w-4 text-white" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-4 space-y-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900">
                                                    {task.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {task.description || task.title}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-500 italic">
                                                {assignee
                                                    ? `${assignee.firstName || ""} ${assignee.lastName || ""}`.trim()
                                                    : language === "ar"
                                                        ? "غير معين"
                                                        : "Unassigned"}
                                            </p>
                                            {getStatusBadge(task.status)}
                                            <div className="pt-2 border-t border-gray-100">
                                                <p className="text-xs text-gray-600">
                                                    {language === "ar"
                                                        ? "تعديل الملفات كما هو مطلوب"
                                                        : "Modify as required"}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="col-span-full py-12 text-center text-gray-400">
                                {language === 'ar' ? 'لا توجد مهام' : 'No tasks found'}
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end gap-2 mt-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-3 h-3 rounded-full transition-colors ${currentPage === i
                                        ? "bg-cyan-500"
                                        : "bg-gray-300 hover:bg-gray-400"
                                        }`}
                                    data-testid={`pagination-dot-${i}`}
                                />
                            ))}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                                }
                                disabled={currentPage === totalPages - 1}
                                className="h-8 w-8 text-gray-600 hover:bg-gray-100"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                    {language === "ar" ? "ملخص للإدارة" : "Summary for management"}
                </h2>
                <Card className="bg-[#F8F9FA] text-gray-900 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left p-3 font-medium text-gray-700">
                                            {language === "ar" ? "القسم الداخلي" : "Dept Internal"}
                                        </th>
                                        <th className="text-left p-3 font-medium text-gray-700">
                                            {language === "ar" ? "الموظفون" : "Employees"}
                                        </th>
                                        <th className="text-left p-3 font-medium text-gray-700">
                                            {language === "ar" ? "المهمة" : "Task"}
                                        </th>
                                        <th className="text-left p-3 font-medium text-gray-700">
                                            {language === "ar" ? "سري الشركة" : "Corporate Secret"}
                                        </th>
                                        <th className="text-left p-3 font-medium text-gray-700">
                                            {language === "ar" ? "الجاهزية" : "Readiness"}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaryData.map((row, i) => (
                                        <tr
                                            key={i}
                                            className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
                                        >
                                            <td className="p-3 text-gray-800">{row.deptInternal}</td>
                                            <td className="p-3 text-gray-800">{row.employees}</td>
                                            <td className="p-3 text-gray-800">{row.task}</td>
                                            <td className="p-3 text-gray-800">
                                                {row.corporateSecret}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-800">{row.status}</span>
                                                    {i === 1 && (
                                                        <div className="flex gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}