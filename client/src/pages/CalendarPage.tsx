import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Bell,
  BellRing,
  ChevronLeft,
  ChevronRight,
  Video,
  Trash2,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, translations } from "@/lib/i18n";
import type { Meeting } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const DAYS_AR = ['السبت', 'الجمعة', 'الخميس', 'الأربعاء', 'الثلاثاء', 'الإثنين', 'الأحد'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Reminder {
  id: string;
  meetingId: number;
  reminderTime: number;
  enabled: boolean;
}

export default function CalendarPage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    reminderEnabled: true,
    reminderMinutes: "15",
  });

  const days = language === 'ar' ? DAYS_AR : DAYS_EN;
  const months = language === 'ar' ? MONTHS_AR : MONTHS_EN;

  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["/api/meetings"],
  });

  useEffect(() => {
    const savedReminders = localStorage.getItem('calendar-reminders');
    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      meetings.forEach((meeting) => {
        const meetingTime = new Date(meeting.startTime);
        const reminder = reminders.find(r => r.meetingId === meeting.id && r.enabled);
        if (reminder) {
          const reminderTime = new Date(meetingTime.getTime() - reminder.reminderTime * 60 * 1000);
          const diff = reminderTime.getTime() - now.getTime();
          if (diff > 0 && diff < 60000) {
            if (Notification.permission === 'granted') {
              new Notification(language === 'ar' ? 'تذكير بالاجتماع' : 'Meeting Reminder', {
                body: `${meeting.title} ${language === 'ar' ? 'يبدأ بعد' : 'starts in'} ${reminder.reminderTime} ${language === 'ar' ? 'دقيقة' : 'minutes'}`,
                icon: '/favicon.ico',
              });
            }
            toast({
              title: language === 'ar' ? 'تذكير بالاجتماع' : 'Meeting Reminder',
              description: `${meeting.title} ${language === 'ar' ? 'يبدأ بعد' : 'starts in'} ${reminder.reminderTime} ${language === 'ar' ? 'دقيقة' : 'minutes'}`,
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [meetings, reminders, language, toast]);

  const createMeetingMutation = useMutation({
    mutationFn: async (data: typeof newEvent) => {
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      let endDateTime: Date | null = null;
      if (data.endTime) {
        endDateTime = new Date(`${data.date}T${data.endTime}`);
      }
      
      return await apiRequest("POST", "/api/meetings", {
        title: data.title,
        description: data.description || null,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime ? endDateTime.toISOString() : null,
        location: data.location || null,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      
      if (newEvent.reminderEnabled) {
        const newReminder: Reminder = {
          id: `reminder-${Date.now()}`,
          meetingId: data.id,
          reminderTime: parseInt(newEvent.reminderMinutes),
          enabled: true,
        };
        const updatedReminders = [...reminders, newReminder];
        setReminders(updatedReminders);
        localStorage.setItem('calendar-reminders', JSON.stringify(updatedReminders));
      }
      
      setNewEvent({ title: "", description: "", date: "", startTime: "", endTime: "", location: "", reminderEnabled: true, reminderMinutes: "15" });
      setDialogOpen(false);
      toast({ 
        title: language === 'ar' ? 'تم إنشاء الحدث' : 'Event Created', 
        description: language === 'ar' ? 'تم إضافة الحدث إلى التقويم' : 'Event has been added to calendar' 
      });
    },
    onError: () => {
      toast({ 
        title: language === 'ar' ? 'خطأ' : 'Error', 
        description: language === 'ar' ? 'فشل في إنشاء الحدث' : 'Failed to create event', 
        variant: "destructive" 
      });
    },
  });

  const deleteMeetingMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      return await apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
      toast({ 
        title: language === 'ar' ? 'تم الحذف' : 'Deleted', 
        description: language === 'ar' ? 'تم حذف الحدث' : 'Event has been deleted' 
      });
    },
  });

  const toggleReminder = (meetingId: number) => {
    const existingReminder = reminders.find(r => r.meetingId === meetingId);
    let updatedReminders: Reminder[];
    
    if (existingReminder) {
      updatedReminders = reminders.map(r => 
        r.meetingId === meetingId ? { ...r, enabled: !r.enabled } : r
      );
    } else {
      updatedReminders = [...reminders, {
        id: `reminder-${Date.now()}`,
        meetingId,
        reminderTime: 15,
        enabled: true,
      }];
    }
    
    setReminders(updatedReminders);
    localStorage.setItem('calendar-reminders', JSON.stringify(updatedReminders));
    
    toast({
      title: language === 'ar' ? 'تم تحديث التذكير' : 'Reminder Updated',
      description: existingReminder?.enabled 
        ? (language === 'ar' ? 'تم إيقاف التذكير' : 'Reminder disabled')
        : (language === 'ar' ? 'تم تفعيل التذكير' : 'Reminder enabled'),
    });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: language === 'ar' ? 'تم تفعيل الإشعارات' : 'Notifications Enabled',
          description: language === 'ar' ? 'ستصلك تذكيرات للأحداث' : 'You will receive event reminders',
        });
      }
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const getEventsForDate = (date: Date) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.startTime);
      return meetingDate.toDateString() === date.toDateString();
    });
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    const dateStr = clickedDate.toISOString().split('T')[0];
    setNewEvent(prev => ({ ...prev, date: dateStr }));
  };

  const handleCreateEvent = () => {
    if (!newEvent.title.trim()) {
      toast({ 
        title: language === 'ar' ? 'خطأ' : 'Error', 
        description: language === 'ar' ? 'عنوان الحدث مطلوب' : 'Event title is required', 
        variant: "destructive" 
      });
      return;
    }
    if (!newEvent.date || !newEvent.startTime) {
      toast({ 
        title: language === 'ar' ? 'خطأ' : 'Error', 
        description: language === 'ar' ? 'التاريخ والوقت مطلوبان' : 'Date and time are required', 
        variant: "destructive" 
      });
      return;
    }
    createMeetingMutation.mutate(newEvent);
  };

  const handleJoinMeeting = (meetingId: number, meetingTitle: string) => {
    const roomName = `DeskTown-${meetingId}-${meetingTitle.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')}`;
    const jitsiUrl = `https://meet.jit.si/${roomName}`;
    window.open(jitsiUrl, '_blank');
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        <Card className="bg-white dark:bg-card shadow-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                {language === 'ar' ? 'التقويم' : 'Calendar'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={requestNotificationPermission}
                  data-testid="button-enable-notifications"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications'}
                </Button>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-event">
                      <Plus className="h-4 w-4 mr-2" />
                      {language === 'ar' ? 'إضافة حدث' : 'Add Event'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {language === 'ar' ? 'إضافة حدث جديد' : 'Add New Event'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>{language === 'ar' ? 'العنوان' : 'Title'}</Label>
                        <Input
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          placeholder={language === 'ar' ? 'عنوان الحدث' : 'Event title'}
                          data-testid="input-event-title"
                        />
                      </div>
                      <div>
                        <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
                        <Textarea
                          value={newEvent.description}
                          onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                          placeholder={language === 'ar' ? 'وصف الحدث' : 'Event description'}
                          data-testid="input-event-description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
                          <Input
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                            data-testid="input-event-date"
                          />
                        </div>
                        <div>
                          <Label>{language === 'ar' ? 'الموقع' : 'Location'}</Label>
                          <Input
                            value={newEvent.location}
                            onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                            placeholder={language === 'ar' ? 'الموقع' : 'Location'}
                            data-testid="input-event-location"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>{language === 'ar' ? 'وقت البدء' : 'Start Time'}</Label>
                          <Input
                            type="time"
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                            data-testid="input-event-start-time"
                          />
                        </div>
                        <div>
                          <Label>{language === 'ar' ? 'وقت الانتهاء' : 'End Time'}</Label>
                          <Input
                            type="time"
                            value={newEvent.endTime}
                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                            data-testid="input-event-end-time"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <BellRing className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">
                            {language === 'ar' ? 'تذكير' : 'Reminder'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={newEvent.reminderMinutes}
                            onValueChange={(value) => setNewEvent({ ...newEvent, reminderMinutes: value })}
                            disabled={!newEvent.reminderEnabled}
                          >
                            <SelectTrigger className="w-24" data-testid="select-reminder-time">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 {language === 'ar' ? 'دقائق' : 'min'}</SelectItem>
                              <SelectItem value="10">10 {language === 'ar' ? 'دقائق' : 'min'}</SelectItem>
                              <SelectItem value="15">15 {language === 'ar' ? 'دقيقة' : 'min'}</SelectItem>
                              <SelectItem value="30">30 {language === 'ar' ? 'دقيقة' : 'min'}</SelectItem>
                              <SelectItem value="60">1 {language === 'ar' ? 'ساعة' : 'hour'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Switch
                            checked={newEvent.reminderEnabled}
                            onCheckedChange={(checked) => setNewEvent({ ...newEvent, reminderEnabled: checked })}
                            data-testid="switch-reminder-enabled"
                          />
                        </div>
                      </div>
                      <Button 
                        onClick={handleCreateEvent} 
                        className="w-full"
                        disabled={createMeetingMutation.isPending}
                        data-testid="button-create-event"
                      >
                        {createMeetingMutation.isPending 
                          ? (language === 'ar' ? 'جاري الإنشاء...' : 'Creating...') 
                          : (language === 'ar' ? 'إنشاء الحدث' : 'Create Event')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={prevMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-lg font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="ghost" size="icon" onClick={nextMonth} data-testid="button-next-month">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {days.map((day, i) => (
                <div key={i} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 md:h-24" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                const events = getEventsForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = selectedDate?.toDateString() === date.toDateString();

                return (
                  <div
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-20 md:h-24 p-1 border rounded-lg cursor-pointer hover-elevate transition-colors ${
                      isToday ? 'border-primary bg-primary/5' : 'border-border'
                    } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    data-testid={`calendar-day-${day}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {events.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs truncate px-1 py-0.5 rounded bg-primary/10 text-primary"
                        >
                          {event.title}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{events.length - 2} {language === 'ar' ? 'أخرى' : 'more'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {selectedDate && (
          <Card className="bg-white dark:bg-card shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                {language === 'ar' ? 'أحداث' : 'Events for'} {selectedDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {language === 'ar' ? 'لا توجد أحداث في هذا اليوم' : 'No events on this day'}
                </p>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map((event) => {
                    const reminder = reminders.find(r => r.meetingId === event.id);
                    const startTime = new Date(event.startTime);
                    
                    return (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        data-testid={`event-${event.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {startTime.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={reminder?.enabled ? "default" : "outline"}
                            size="icon"
                            onClick={() => toggleReminder(event.id)}
                            data-testid={`button-toggle-reminder-${event.id}`}
                          >
                            {reminder?.enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleJoinMeeting(event.id, event.title)}
                            data-testid={`button-join-meeting-${event.id}`}
                          >
                            <Video className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMeetingMutation.mutate(event.id)}
                            data-testid={`button-delete-event-${event.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-white dark:bg-card shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              {language === 'ar' ? 'الأحداث القادمة' : 'Upcoming Events'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings
              .filter(m => new Date(m.startTime) >= today)
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .slice(0, 5)
              .map((event) => {
                const reminder = reminders.find(r => r.meetingId === event.id);
                const startTime = new Date(event.startTime);
                const isToday = startTime.toDateString() === today.toDateString();
                
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                    data-testid={`upcoming-event-${event.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isToday ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <span className="text-sm font-bold">{startTime.getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {startTime.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })} - {startTime.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isToday && (
                        <Badge variant="default" className="bg-primary">
                          {language === 'ar' ? 'اليوم' : 'Today'}
                        </Badge>
                      )}
                      {reminder?.enabled && (
                        <BellRing className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                );
              })}
            {meetings.filter(m => new Date(m.startTime) >= today).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                {language === 'ar' ? 'لا توجد أحداث قادمة' : 'No upcoming events'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
