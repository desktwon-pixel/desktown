import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Shield, UserPlus, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

function getEffectiveStatus(user: User): "online" | "away" | "offline" | "busy" {
  const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
  
  if (user.status === "online" && user.lastSeenAt) {
    const lastSeen = new Date(user.lastSeenAt).getTime();
    const now = Date.now();
    if (now - lastSeen > INACTIVE_THRESHOLD) {
      return "offline";
    }
  }
  
  return (user.status as "online" | "away" | "offline" | "busy") || "offline";
}

const permissions = [
  { id: "tasks", label: "Task Management", description: "Create, edit, and assign tasks" },
  { id: "tickets", label: "Support Tickets", description: "Manage support tickets" },
  { id: "social", label: "Social Feed", description: "Post and moderate content" },
  { id: "meetings", label: "Meeting Scheduler", description: "Schedule and manage meetings" },
  { id: "jobs", label: "Job Postings", description: "Create and publish job listings" },
  { id: "finances", label: "Financial Review", description: "View and approve expenses" },
  { id: "access", label: "Access Control", description: "Manage user roles and permissions" },
];

const rolePermissions: Record<string, string[]> = {
  admin: permissions.map((p) => p.id),
  manager: ["tasks", "tickets", "social", "meetings", "finances"],
  member: ["tasks", "social", "meetings"],
};

export default function AccessControl() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editRole, setEditRole] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest("PATCH", `/api/users/${userId}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Changes saved", description: "User role has been updated." });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user role.", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      (`${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(search.toLowerCase())) ||
      (user.role?.toLowerCase().includes(search.toLowerCase()) || false)
  );

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditRole(user.role || "member");
    setEditPermissions(rolePermissions[user.role || "member"] || []);
  };

  const handleRoleChange = (newRole: string) => {
    setEditRole(newRole);
    setEditPermissions(rolePermissions[newRole] || []);
  };

  const handleSaveChanges = () => {
    if (editingUser) {
      updateUserMutation.mutate({ userId: editingUser.id, role: editRole });
    }
  };

  const handleInvite = () => {
    if (inviteEmail) {
      toast({ title: "Invitation sent", description: `Invitation sent to ${inviteEmail}` });
      setInviteEmail("");
      setInviteRole("member");
      setInviteDialogOpen(false);
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const managerCount = users.filter((u) => u.role === "manager").length;
  const memberCount = users.filter((u) => u.role === "member" || !u.role).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">Access Control</h1>
          <p className="text-muted-foreground mt-1">Manage roles and permissions</p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-invite-user">
              <UserPlus className="h-4 w-4 mr-1" />
              Invite User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-invite-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleInvite} data-testid="button-send-invite">Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-users"
            />
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full m-4" />
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => {
                  const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
                  const effectiveStatus = getEffectiveStatus(user);
                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-4 p-4 ${index !== filteredUsers.length - 1 ? "border-b" : ""}`}
                    >
                      <UserAvatar 
                        name={displayName} 
                        avatar={user.profileImageUrl} 
                        size="md" 
                        status={effectiveStatus} 
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{displayName}</p>
                        <p className="text-sm text-muted-foreground">{user.department || "No department"}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{user.role || "member"}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditUser(user)}
                        data-testid={`button-edit-user-${user.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {search ? "No users match your search" : "No users yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Admin</span>
                  <Badge>{adminCount}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Full access to all features</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Manager</span>
                  <Badge>{managerCount}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Team management and approvals</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Member</span>
                  <Badge>{memberCount}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Basic access to tasks and social</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User Permissions</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <UserAvatar 
                  name={`${editingUser.firstName || ''} ${editingUser.lastName || ''}`.trim() || editingUser.email || 'Unknown'} 
                  avatar={editingUser.profileImageUrl}
                  size="lg" 
                />
                <div>
                  <p className="font-medium">
                    {`${editingUser.firstName || ''} ${editingUser.lastName || ''}`.trim() || editingUser.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{editingUser.department || "No department"}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editRole} onValueChange={handleRoleChange}>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Role Permissions</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Permissions are determined by the assigned role
                </p>
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{permission.label}</p>
                      <p className="text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                    <Switch
                      checked={editPermissions.includes(permission.id)}
                      disabled
                      data-testid={`switch-permission-${permission.id}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={handleSaveChanges} 
              disabled={updateUserMutation.isPending}
              data-testid="button-save-permissions"
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
