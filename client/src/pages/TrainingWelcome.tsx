import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    GraduationCap,
    Video,
    BookOpen,
    Calendar,
    Plus,
    Clock,
    Users,
    ChevronLeft,
    Sparkles,
    Play,
    Bell,
} from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    date: string;
    time: string;
    trainer: string;
}

export default function TrainingWelcome() {
    const { toast } = useToast();
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        {
            id: "1",
            title: "أساسيات القيادة الإدارية / Management Essentials",
            date: "2024-11-05",
            time: "10:00 AM",
            trainer: "د. أحمد المنصوري",
        },
        {
            id: "2",
            title: "ورشة عمل: الذكاء الاصطناعي في العمل / AI Workshop",
            date: "2024-11-07",
            time: "02:00 PM",
            trainer: "م. سارة الخالدي",
        }
    ]);

    const [newTitle, setNewTitle] = useState("");
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");

    const { data: currentUser } = useQuery<{ id: string; role?: string }>({
        queryKey: ["/api/auth/user"],
    });

    const isTrainer = currentUser?.role === "admin" || currentUser?.role === "manager";

    const handleAddAnnouncement = () => {
        if (!newTitle || !newDate || !newTime) {
            toast({
                title: "خطأ",
                description: "الرجاء إكمال كافة تفاصيل الإعلان",
                variant: "destructive"
            });
            return;
        }

        const announcement: Announcement = {
            id: Date.now().toString(),
            title: newTitle,
            date: newDate,
            time: newTime,
            trainer: "أنت / You",
        };

        setAnnouncements([announcement, ...announcements]);
        setNewTitle("");
        setNewDate("");
        setNewTime("");
        setShowAnnouncementModal(false);

        toast({
            title: "تم النشر",
            description: "تمت إضافة موعد المحاضرة القادمة بنجاح",
        });
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 lg:p-8" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal-500/20 via-blue-600/10 to-transparent border border-white/10 p-12 lg:p-20 shadow-2xl">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-teal-500/20 blur-[120px] rounded-full" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="max-w-2xl text-center md:text-right space-y-6">
                            <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 px-4 py-1.5 text-sm mb-4">
                                <Sparkles className="w-4 h-4 ml-2" />
                                مركز التعلم المتميز / Excellence in Learning
                            </Badge>
                            <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                                رصيدك المعرفي يبدأ من <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">هنا</span>
                            </h1>
                            <p className="text-lg text-gray-400 font-medium">
                                مرحباً بك في قسم التدريب والتطوير. منصتك المتكاملة لتطوير المهارات القيادية والتقنية، سواء عبر البث المباشر أو من خلال مكتبتنا الغنية بالمعلومات.
                            </p>
                        </div>
                        <div className="w-64 h-64 lg:w-80 lg:h-80 bg-white/5 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-3xl relative animate-pulse">
                            <GraduationCap className="w-32 h-32 lg:w-40 lg:h-40 text-teal-500 drop-shadow-[0_0_30px_rgba(20,184,166,0.3)]" />
                        </div>
                    </div>
                </div>

                {/* Main Navigation Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Live Room Access */}
                    <Link href="/training/live">
                        <a className="group block h-full">
                            <Card className="h-full bg-white/5 border-white/10 hover:border-teal-500/50 transition-all duration-500 overflow-hidden relative backdrop-blur-xl group-hover:-translate-y-2">
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-8 space-y-6 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                                        <Video className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-bold">قاعة التدريب المباشر</h2>
                                        <p className="text-gray-400">انضم الآن إلى محاضراتنا التفاعلية المباشرة وتواصل مع المدربين في الوقت الفعلي.</p>
                                    </div>
                                    <div className="flex items-center text-teal-400 font-bold gap-2">
                                        <span>دخول القاعة / Enter Room</span>
                                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </Card>
                        </a>
                    </Link>

                    {/* Library Access */}
                    <Link href="/training/library">
                        <a className="group block h-full">
                            <Card className="h-full bg-white/5 border-white/10 hover:border-blue-500/50 transition-all duration-500 overflow-hidden relative backdrop-blur-xl group-hover:-translate-y-2">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-8 space-y-6 relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="text-3xl font-bold">المكتبة المسجلة</h2>
                                        <p className="text-gray-400">استعرض مئات المحاضرات والدروس السابقة في أي وقت واصل رحلتك التعليمية بحرية.</p>
                                    </div>
                                    <div className="flex items-center text-blue-400 font-bold gap-2">
                                        <span>تصفح المكتبة / Browse Library</span>
                                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" />
                                    </div>
                                </div>
                            </Card>
                        </a>
                    </Link>
                </div>

                {/* Upcoming Classes / Announcements Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold font-tajawal">جدول المحاضرات القادمة / Upcoming Sessions</h2>
                        </div>
                        {isTrainer && (
                            <Button
                                onClick={() => setShowAnnouncementModal(true)}
                                className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 h-12 px-6 rounded-xl shadow-lg shadow-teal-500/20 transition-all active:scale-95"
                            >
                                <Plus className="w-5 h-5 ml-2" />
                                إعلان محاضرة / New Schedule
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {announcements.map((ann) => (
                            <Card key={ann.id} className="bg-white/5 border-white/10 p-6 space-y-4 hover:border-purple-500/30 transition-all group backdrop-blur-sm">
                                <div className="flex justify-between items-start">
                                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">جديد / NEW</Badge>
                                    <Bell className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
                                </div>
                                <h3 className="text-lg font-bold leading-relaxed">{ann.title}</h3>
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Calendar className="w-4 h-4 text-teal-400" />
                                        <span>التاريخ: {ann.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Clock className="w-4 h-4 text-teal-400" />
                                        <span>الوقت: {ann.time}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <Users className="w-4 h-4 text-teal-400" />
                                        <span>المدرب: {ann.trainer}</span>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full border-white/10 hover:bg-white/10 text-white gap-2">
                                    <Bell className="w-4 h-4" />
                                    تذكيري / Remind Me
                                </Button>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Simple Announcement Modal/Dialog (Hand-coded for style) */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAnnouncementModal(false)} />
                    <Card className="relative w-full max-w-lg bg-[#1e293b] border border-white/10 p-8 space-y-6 shadow-3xl">
                        <div className="text-right space-y-2">
                            <h3 className="text-2xl font-bold">إعلان موعد محاضرة جديدة</h3>
                            <p className="text-gray-400 text-sm">سيظهر هذا الإعلان فوراً لكافة الطلاب والموظفين في الصفحة الترحيبية.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2 text-right">
                                <label className="text-sm font-medium">عنوان المحاضرة / Title</label>
                                <Input
                                    className="bg-black/20 border-white/10 text-white"
                                    placeholder="مثال: مهارات التواصل الفعال"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-right">
                                    <label className="text-sm font-medium">التاريخ / Date</label>
                                    <Input
                                        type="date"
                                        className="bg-black/20 border-white/10 text-white"
                                        value={newDate}
                                        onChange={(e) => setNewDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 text-right">
                                    <label className="text-sm font-medium">الوقت / Time</label>
                                    <Input
                                        type="time"
                                        className="bg-black/20 border-white/10 text-white"
                                        value={newTime}
                                        onChange={(e) => setNewTime(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-row-reverse gap-3 mt-4">
                            <Button
                                onClick={handleAddAnnouncement}
                                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700"
                            >
                                نشر الإعلان / Publish
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowAnnouncementModal(false)}
                                className="flex-1 border-white/10 hover:bg-white/10 text-white"
                            >
                                إلغاء / Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
