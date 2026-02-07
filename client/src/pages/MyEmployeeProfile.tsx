import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Briefcase,
  User,
  Calendar,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  ListChecks,
  Target,
  ArrowUpRight,
  Timer,
  Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Task, User as UserType } from "@shared/schema";
import { format, formatDistanceToNow, isPast, isToday } from "date-fns";
import { useLanguage, translations } from "@/lib/i18n";

interface TaskWithCreator extends Task {
  creator?: UserType;
}

const priorityColors: Record<string, string> = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-green-500/10 text-green-500 border-green-500/20",
};

const statusIcons: Record<string, typeof Circle> = {
  pending: Circle,
  in_progress: Timer,
  completed: CheckCircle2,
};

const statusColors: Record<string, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-blue-500",
  completed: "text-green-500",
};

export default function MyEmployeeProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const { data: myTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/me/tasks"],
  });

  const { data: allUsers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me/tasks"] });
      toast({ title: "Task Updated", description: "Task status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task status.", variant: "destructive" });
    },
  });

  const getCreatorName = (creatorId: string | null) => {
    if (!creatorId) return "Unknown";
    const creator = allUsers.find(u => u.id === creatorId);
    if (!creator) return "Unknown";
    return `${creator.firstName || ""} ${creator.lastName || ""}`.trim() || creator.email || "Unknown";
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const pendingTasks = myTasks.filter(t => t.status === "pending");
  const inProgressTasks = myTasks.filter(t => t.status === "in_progress");
  const completedTasks = myTasks.filter(t => t.status === "completed");
  
  const overdueTasks = myTasks.filter(t => 
    t.dueDate && isPast(new Date(t.dueDate)) && t.status !== "completed"
  );

  const dueTodayTasks = myTasks.filter(t =>
    t.dueDate && isToday(new Date(t.dueDate)) && t.status !== "completed"
  );

  const completionRate = myTasks.length > 0 
    ? Math.round((completedTasks.length / myTasks.length) * 100)
    : 0;

  const calculateRating = (rate: number): number => {
    if (rate >= 90) return 5;
    if (rate >= 70) return 4;
    if (rate >= 50) return 3;
    if (rate >= 30) return 2;
    return 1;
  };

  const employeeRating = calculateRating(completionRate);

  const getRatingLabel = (rating: number): string => {
    const labels = language === 'ar' 
      ? { 5: 'ممتاز', 4: 'جيد جداً', 3: 'جيد', 2: 'مقبول', 1: 'يحتاج تحسين' }
      : { 5: 'Excellent', 4: 'Very Good', 3: 'Good', 2: 'Fair', 1: 'Needs Improvement' };
    return labels[rating as keyof typeof labels] || '';
  };

  const displayName = user 
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Employee"
    : "Employee";

  if (!user) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <Card className="p-8 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
          <p className="text-muted-foreground">Please log in to view your profile</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t.employeeProfilePage?.title || "Profile"}</h1>
          <p className="text-sm text-muted-foreground">{language === "ar" ? "مهامك ومسؤولياتك" : "Your tasks and responsibilities"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg mb-4">
                <AvatarImage src={user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {(user.firstName?.[0] || "").toUpperCase()}{(user.lastName?.[0] || "").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold" data-testid="text-my-name">{displayName}</h2>
              <p className="text-sm text-muted-foreground" data-testid="text-my-email">{user.email}</p>
              
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="secondary" className="capitalize" data-testid="badge-role">
                  {user.role || "member"}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={user.status === "online" ? "border-green-500 text-green-500" : ""}
                  data-testid="badge-status"
                >
                  {user.status || "offline"}
                </Badge>
              </div>

              {user.department && (
                <div className="flex items-center gap-1 mt-4 text-muted-foreground text-sm">
                  <Building2 className="h-4 w-4" />
                  <span data-testid="text-my-department">{user.department}</span>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                  {language === 'ar' ? 'تقييم الأداء' : 'Performance Rating'}
                </p>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= employeeRating
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400" data-testid="text-rating-label">
                  {getRatingLabel(employeeRating)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {language === 'ar' ? 'بناءً على نسبة إنجاز المهام' : 'Based on task completion rate'}
                </p>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {language === 'ar' ? 'نظرة عامة على المهام' : 'Task Overview'}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completion Rate</span>
                  <span className="font-semibold" data-testid="text-completion-rate">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-blue-500" data-testid="stat-in-progress">{inProgressTasks.length}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-amber-500" data-testid="stat-pending">{pendingTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-green-500" data-testid="stat-completed">{completedTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-red-500" data-testid="stat-overdue">{overdueTasks.length}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex flex-col gap-2">
              <Link href="/tasks">
                <Button variant="outline" className="w-full" data-testid="button-view-all-tasks">
                  <ListChecks className="h-4 w-4 mr-2" />
                  View All Tasks
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" className="w-full" data-testid="button-social-profile">
                  <User className="h-4 w-4 mr-2" />
                  Social Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              My Assigned Tasks & Responsibilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : myTasks.length === 0 ? (
              <div className="py-12 text-center">
                <ListChecks className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No tasks assigned to you yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Tasks assigned by your manager will appear here
                </p>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="all" data-testid="tab-all-tasks">
                    All ({myTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" data-testid="tab-active-tasks">
                    Active ({inProgressTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" data-testid="tab-pending-tasks">
                    Pending ({pendingTasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="completed" data-testid="tab-completed-tasks">
                    Done ({completedTasks.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                  <TaskList 
                    tasks={myTasks} 
                    getCreatorName={getCreatorName}
                    onStatusChange={handleStatusChange}
                    isUpdating={updateTaskMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="active">
                  <TaskList 
                    tasks={inProgressTasks} 
                    getCreatorName={getCreatorName}
                    onStatusChange={handleStatusChange}
                    isUpdating={updateTaskMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="pending">
                  <TaskList 
                    tasks={pendingTasks} 
                    getCreatorName={getCreatorName}
                    onStatusChange={handleStatusChange}
                    isUpdating={updateTaskMutation.isPending}
                  />
                </TabsContent>

                <TabsContent value="completed">
                  <TaskList 
                    tasks={completedTasks} 
                    getCreatorName={getCreatorName}
                    onStatusChange={handleStatusChange}
                    isUpdating={updateTaskMutation.isPending}
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {(overdueTasks.length > 0 || dueTodayTasks.length > 0) && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overdueTasks.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-500 mb-2">Overdue Tasks ({overdueTasks.length})</h4>
                  <ul className="space-y-2">
                    {overdueTasks.slice(0, 3).map(task => (
                      <li key={task.id} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="truncate" data-testid={`overdue-task-${task.id}`}>{task.title}</span>
                        {task.dueDate && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({formatDistanceToNow(new Date(task.dueDate))} ago)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dueTodayTasks.length > 0 && (
                <div>
                  <h4 className="font-medium text-amber-500 mb-2">Due Today ({dueTodayTasks.length})</h4>
                  <ul className="space-y-2">
                    {dueTodayTasks.slice(0, 3).map(task => (
                      <li key={task.id} className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="truncate" data-testid={`due-today-task-${task.id}`}>{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface TaskListProps {
  tasks: Task[];
  getCreatorName: (creatorId: string | null) => string;
  onStatusChange: (taskId: number, status: string) => void;
  isUpdating: boolean;
}

function TaskList({ tasks, getCreatorName, onStatusChange, isUpdating }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No tasks in this category
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {tasks.map(task => {
          const StatusIcon = statusIcons[task.status || "pending"] || Circle;
          const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== "completed";

          return (
            <Card key={task.id} className={`hover-elevate ${isOverdue ? "border-red-500/30" : ""}`} data-testid={`task-card-${task.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${statusColors[task.status || "pending"]}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <h4 className="font-medium truncate" data-testid={`task-title-${task.id}`}>
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`shrink-0 ${priorityColors[task.priority || "medium"]}`}
                        data-testid={`task-priority-${task.id}`}
                      >
                        {task.priority || "medium"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1" data-testid={`task-assigned-by-${task.id}`}>
                        <User className="h-3 w-3" />
                        Assigned by: {getCreatorName(task.creatorId)}
                      </span>
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500" : ""}`} data-testid={`task-due-${task.id}`}>
                          <Calendar className="h-3 w-3" />
                          Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3 gap-2">
                      <Select
                        value={task.status || "pending"}
                        onValueChange={(value) => onStatusChange(task.id, value)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-[140px] h-8" data-testid={`task-status-select-${task.id}`}>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Link href="/tasks">
                        <Button variant="ghost" size="sm" className="h-8" data-testid={`task-view-${task.id}`}>
                          View Details
                          <ArrowUpRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
