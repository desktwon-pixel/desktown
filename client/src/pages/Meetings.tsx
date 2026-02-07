import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MeetingCard } from "@/components/MeetingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Calendar, 
  Clock, 
  Video, 
  Loader2,
  CalendarDays,
  MapPin,
  Users,
  Sparkles,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { translations } from "@/lib/i18n";
import type { Meeting } from "@shared/schema";

export default function Meetings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    room: "Virtual Room A",
    attendeeIds: [] as string[],
  });

  // Fetch current user
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  // Fetch all departments
  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch remote employees from all departments the user manages or belongs to
  const { data: teamMembers = [] } = useQuery<any[]>({
    queryKey: ["/api/departments/employees/all"],
    enabled: departments.length > 0,
  });

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (data: typeof newMeeting) => {
      if (!data.date || !data.startTime) {
        throw new Error("Date and start time are required");
      }

      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      if (isNaN(startDateTime.getTime())) {
        throw new Error("Invalid date or time");
      }

      let endDateTime: Date | null = null;
      if (data.endTime) {
        endDateTime = new Date(`${data.date}T${data.endTime}`);
        if (isNaN(endDateTime.getTime())) {
          endDateTime = null;
        }
      }

      return await apiRequest("POST", "/api/meetings", {
        title: data.title,
        description: data.description || null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime ? endDateTime.toISOString() : null,
        location: data.room || null,
        attendeeIds: data.attendeeIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      setNewMeeting({ title: "", description: "", date: "", startTime: "", endTime: "", room: "Virtual Room A", attendeeIds: [] });
      setDialogOpen(false);
      toast({ title: t.meetings?.meetingCreated || "Meeting scheduled", description: t.meetings?.meetingCreatedDesc || "Your meeting has been created." });
    },
    onError: () => {
      toast({ title: t.meetings?.error || "Error", description: t.meetings?.failedCreate || "Failed to create meeting.", variant: "destructive" });
    },
  });

  const handleCreateMeeting = () => {
    if (!newMeeting.title.trim()) {
      toast({ title: t.meetings?.error || "Error", description: t.meetings?.titleRequired || "Meeting title is required.", variant: "destructive" });
      return;
    }
    if (!newMeeting.date || !newMeeting.startTime) {
      toast({ title: t.meetings?.error || "Error", description: t.meetings?.dateTimeRequired || "Date and start time are required.", variant: "destructive" });
      return;
    }
    createMeetingMutation.mutate(newMeeting);
  };

  const handleJoinMeeting = (meetingId: string, meetingTitle: string) => {
    setLocation(`/video-room/${meetingId}`);
    toast({ 
      title: t.meetings?.joiningMeeting || "Joining Meeting", 
      description: t.meetings?.openingConference || "Opening video conference..." 
    });
  };

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      return await apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ title: t.meetings?.meetingDeleted || "Meeting deleted", description: t.meetings?.meetingRemovedDesc || "The meeting has been removed." });
    },
    onError: () => {
      toast({ title: t.meetings?.error || "Error", description: t.meetings?.failedDelete || "Failed to delete meeting.", variant: "destructive" });
    },
  });

  const handleDeleteMeeting = (meetingId: number) => {
    if (confirm(t.meetings?.confirmDelete || "Are you sure you want to delete this meeting?")) {
      deleteMeetingMutation.mutate(meetingId);
    }
  };

  const formatMeeting = (meeting: Meeting) => {
    const startTime = meeting.startTime ? new Date(meeting.startTime) : null;
    const today = new Date();
    const isToday = startTime && 
      startTime.getDate() === today.getDate() &&
      startTime.getMonth() === today.getMonth() &&
      startTime.getFullYear() === today.getFullYear();

    const locale = language === "ar" ? "ar-SA" : "en-US";

    return {
      id: String(meeting.id),
      title: meeting.title,
      time: startTime ? startTime.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" }) : "",
      date: isToday ? (t.meetings?.today || "Today") : startTime?.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" }) || "",
      participants: [] as Array<{ name: string; avatar?: string | null }>,
      room: meeting.location || (t.meetings?.virtualRoom || "Virtual"),
    };
  };

  const now = new Date();
  const todayMeetings = meetings.filter(m => {
    if (!m.startTime) return false;
    const start = new Date(m.startTime);
    return start.toDateString() === now.toDateString();
  });

  const upcomingMeetings = meetings.filter(m => {
    if (!m.startTime) return false;
    const start = new Date(m.startTime);
    return start > now && start.toDateString() !== now.toDateString();
  });

  const meetingStats = {
    total: meetings.length,
    today: todayMeetings.length,
    upcoming: upcomingMeetings.length,
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
            <Video className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-meetings-title">{t.meetings?.title || "Meetings"}</h1>
            <p className="text-muted-foreground text-sm">{t.meetings?.subtitle || "Schedule and join virtual meetings"}</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-new-meeting">
              <Plus className="h-4 w-4" />
              {t.meetings?.scheduleMeeting || "Schedule Meeting"}
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-white/10 max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400" />
                {t.meetings?.scheduleNewMeeting || "Schedule New Meeting"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t.meetings?.meetingTitle || "Meeting Title"}</Label>
                <Input
                  id="title"
                  placeholder={t.meetings?.titlePlaceholder || "Weekly team sync"}
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-violet-500/50"
                  data-testid="input-meeting-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.meetings?.descriptionOptional || "Description (optional)"}</Label>
                <Textarea
                  id="description"
                  placeholder={t.meetings?.descriptionPlaceholder || "Meeting agenda..."}
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  className="bg-white/5 border-white/10 focus:border-violet-500/50 min-h-[80px]"
                  data-testid="input-meeting-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">{t.meetings?.date || "Date"}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newMeeting.date}
                    onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                    className="bg-white/5 border-white/10"
                    data-testid="input-meeting-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="room">{t.meetings?.room || "Room"}</Label>
                  <Input
                    id="room"
                    placeholder={t.meetings?.virtualRoom || "Virtual Room"}
                    value={newMeeting.room}
                    onChange={(e) => setNewMeeting({ ...newMeeting, room: e.target.value })}
                    className="bg-white/5 border-white/10"
                    data-testid="input-meeting-room"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t.meetings?.startTime || "Start Time"}</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, startTime: e.target.value })}
                    className="bg-white/5 border-white/10"
                    data-testid="input-meeting-start-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{t.meetings?.endTime || "End Time"}</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting({ ...newMeeting, endTime: e.target.value })}
                    className="bg-white/5 border-white/10"
                    data-testid="input-meeting-end-time"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "المشاركون من الفريق" : "Team Members"}</Label>
                <div className="space-y-2">
                  <select
                    multiple
                    className="w-full h-32 p-2 rounded-lg border border-white/10 bg-white/5 text-sm focus:ring-primary focus:border-primary"
                    value={newMeeting.attendeeIds}
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions);
                      const values = options.map(option => option.value);
                      setNewMeeting({ ...newMeeting, attendeeIds: values });
                    }}
                  >
                    {teamMembers.map((employee) => (
                      <option key={employee.id} value={String(employee.id)} className="py-1 px-2 hover:bg-primary/20">
                        {employee.firstName} {employee.lastName} - {employee.jobTitle || (language === "ar" ? "موظف" : "Employee")}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground">
                    {language === "ar" ? "اضغط مع الاستمرار على Ctrl (أو Cmd) لاختيار أكثر من شخص" : "Hold Ctrl (or Cmd) to select multiple participants"}
                  </p>
                  {newMeeting.attendeeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {newMeeting.attendeeIds.map(id => {
                        const employee = teamMembers.find(e => String(e.id) === id);
                        if (!employee) return null;
                        return (
                          <Badge key={id} variant="secondary" className="text-[10px] h-5 py-0">
                            {employee.firstName} {employee.lastName}
                            <X className="h-2 w-2 ml-1 cursor-pointer" onClick={() => {
                              setNewMeeting({
                                ...newMeeting,
                                attendeeIds: newMeeting.attendeeIds.filter(aid => aid !== id)
                              });
                            }} />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateMeeting}
                disabled={createMeetingMutation.isPending}
                data-testid="button-create-meeting"
              >
                {createMeetingMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.meetings?.creating || "Creating..."}
                  </>
                ) : (t.meetings?.scheduleMeeting || "Schedule Meeting")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t.meetings?.totalMeetings || "Total Meetings", value: meetingStats.total, icon: CalendarDays, color: "from-slate-500 to-slate-600" },
          { label: t.meetings?.today || "Today", value: meetingStats.today, icon: Clock, color: "from-violet-500 to-purple-500" },
          { label: t.meetings?.upcoming || "Upcoming", value: meetingStats.upcoming, icon: Calendar, color: "from-cyan-500 to-teal-500" },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <Clock className="h-4 w-4 text-violet-400" />
              </div>
              {t.meetings?.todaysMeetings || "Today's Meetings"}
              {todayMeetings.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-violet-500/10 text-violet-400 border-violet-500/30">
                  {todayMeetings.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-white/5" />
              ))
            ) : todayMeetings.length > 0 ? (
              todayMeetings.map((meeting) => {
                const formatted = formatMeeting(meeting);
                return (
                  <div 
                    key={meeting.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    data-testid={`card-meeting-today-${meeting.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{formatted.title}</h4>
                      <Badge variant="outline" className="text-xs bg-violet-500/10 text-violet-400 border-violet-500/30">
                        {formatted.time}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatted.room}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {formatted.participants.length || 0} {t.meetings?.attendees || "attendees"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.meetings?.noTodayMeetings || "No meetings scheduled for today"}</p>
                <p className="text-xs mt-1">{t.meetings?.scheduleFirst || "Schedule your first meeting"}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10">
                <Calendar className="h-4 w-4 text-cyan-400" />
              </div>
              {t.meetings?.upcomingMeetings || "Upcoming Meetings"}
              {upcomingMeetings.length > 0 && (
                <Badge variant="outline" className="ml-2 bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                  {upcomingMeetings.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-white/5" />
              ))
            ) : upcomingMeetings.length > 0 ? (
              upcomingMeetings.slice(0, 5).map((meeting) => {
                const formatted = formatMeeting(meeting);
                return (
                  <div 
                    key={meeting.id}
                    className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    data-testid={`card-meeting-upcoming-${meeting.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{formatted.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {formatted.date}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatted.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatted.room}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t.meetings?.noUpcomingMeetings || "No upcoming meetings"}</p>
                <p className="text-xs mt-1">{t.meetings?.planAhead || "Plan your schedule ahead"}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {meetings.length > 0 && (
        <Card className="glass border-white/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Video className="h-4 w-4 text-emerald-400" />
              </div>
              {t.meetings?.allMeetings || "All Meetings"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((meeting) => {
                const formatted = formatMeeting(meeting);
                return (
                  <MeetingCard
                    key={meeting.id}
                    {...formatted}
                    onJoin={() => handleJoinMeeting(formatted.id, meeting.title)}
                    onDelete={() => handleDeleteMeeting(meeting.id)}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
