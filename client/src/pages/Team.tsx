import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Mail, 
  MessageSquare, 
  Users, 
  Briefcase, 
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { User, Task } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";

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

export default function Team() {
  const { language } = useLanguage();
  const t = translations[language];
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const filteredMembers = users.filter(
    (user) =>
      (`${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(search.toLowerCase())) ||
      (user.department?.toLowerCase().includes(search.toLowerCase()) || false)
  );

  const departments = Array.from(new Set(users.map((u) => u.department).filter(Boolean)));

  const getUserStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assigneeId === userId);
    const completed = userTasks.filter(t => t.status === "completed").length;
    return { tasksCompleted: completed, total: userTasks.length };
  };

  const teamStats = {
    total: users.length,
    departments: departments.length,
    online: users.filter(u => getEffectiveStatus(u) === "online").length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-team-title">{t.team?.title || "Team"}</h1>
            <p className="text-muted-foreground text-sm">{t.team?.subtitle || "View team members and performance metrics"}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t.team?.totalMembers || "Total Members", value: teamStats.total, icon: Users, color: "from-emerald-500 to-green-500" },
          { label: t.team?.departments || "Departments", value: teamStats.departments, icon: Briefcase, color: "from-violet-500 to-purple-500" },
          { label: t.team?.onlineNow || "Online Now", value: teamStats.online, icon: Activity, color: "from-cyan-500 to-teal-500" },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.team?.searchPlaceholder || "Search by name or department..."}
            className="pl-10 bg-white/5 border-white/10 focus:border-emerald-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-team"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full bg-white/5" />
          ))
        ) : filteredMembers.length > 0 ? (
          filteredMembers.map((member) => {
            const displayName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email || 'Unknown';
            const stats = getUserStats(member.id);
            const isExpanded = selectedMember === member.id;
            const effectiveStatus = getEffectiveStatus(member);
            
            return (
              <Card
                key={member.id}
                className="glass border-white/5 hover-glow cursor-pointer transition-all duration-300"
                onClick={() => setSelectedMember(isExpanded ? null : member.id)}
                data-testid={`card-member-${member.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <UserAvatar
                      name={displayName}
                      avatar={member.profileImageUrl}
                      size="lg"
                      status={effectiveStatus}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{member.role || (t.team?.member || "member")}</p>
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        {member.department && (
                          <Badge variant="outline" className="text-xs bg-white/5 border-white/10">
                            {member.department}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs capitalize ${
                            effectiveStatus === 'online' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                              : effectiveStatus === 'away'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            effectiveStatus === 'online' ? 'bg-emerald-400' 
                            : effectiveStatus === 'away' ? 'bg-amber-400' 
                            : 'bg-slate-400'
                          }`} />
                          {effectiveStatus === 'online' ? (t.team?.online || "online") : effectiveStatus === 'away' ? (t.team?.away || "away") : (t.team?.offline || "offline")}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-white/5">
                          <p className="text-xs text-muted-foreground">{t.team?.completed || "Completed"}</p>
                          <p className="text-lg font-semibold text-emerald-400">{stats.tasksCompleted}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-white/5">
                          <p className="text-xs text-muted-foreground">{t.team?.totalTasks || "Total Tasks"}</p>
                          <p className="text-lg font-semibold">{stats.total}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-1.5" data-testid={`button-email-${member.id}`}>
                          <Mail className="h-4 w-4" />
                          {t.team?.email || "Email"}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1.5" data-testid={`button-message-${member.id}`}>
                          <MessageSquare className="h-4 w-4" />
                          {t.team?.message || "Message"}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="col-span-full glass border-white/5">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-1">{search ? (t.team?.noSearchResults || "No team members match your search") : (t.team?.noMembers || "No team members yet")}</p>
              <p className="text-xs">{t.team?.inviteFirst || "Invite your team to get started"}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
