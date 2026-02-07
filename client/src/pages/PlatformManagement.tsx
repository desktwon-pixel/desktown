import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
    Building2,
    Users,
    TrendingUp,
    DollarSign,
    ShieldCheck,
    Zap,
    Clock,
    Sparkles,
    Search,
    CheckCircle2,
    XCircle,
    Eye,
    CreditCard,
    BarChart3,
    Activity,
    AlertCircle,
    ArrowUpRight,
    ClipboardList,
    Filter,
    ArrowRight,
} from "lucide-react";
import { useLanguage, translations } from "@/lib/i18n";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Office, ServiceOrder } from "@shared/schema";

export default function PlatformManagement() {
    const { language } = useLanguage();
    const t = translations[language];
    const { toast } = useToast();

    const { data: stats, isLoading: statsLoading } = useQuery<{
        activeSubscriptions: number;
        totalOffices: number;
        totalUsers: number;
        pendingRequests: number;
    }>({
        queryKey: ["/api/admin/stats"],
    });

    const { data: growthData = [] } = useQuery<any[]>({
        queryKey: ["/api/admin/growth-data"],
    });

    const { data: offices = [], isLoading: officesLoading } = useQuery<Office[]>({
        queryKey: ["/api/admin/offices"],
    });

    const { data: financialReports } = useQuery<{
        totalRevenue: number;
        netProfit: number;
        commissions: number;
        payoutsPending: number;
    }>({
        queryKey: ["/api/admin/financials"],
    });

    const { data: paymentLogs = [] } = useQuery<ServiceOrder[]>({
        queryKey: ["/api/admin/payment-logs"],
    });

    const approveMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("POST", `/api/admin/offices/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/offices"] });
            queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
            toast({ title: language === 'ar' ? "تمت الموافقة" : "Approved", description: language === 'ar' ? "تمت الموافقة على المكتب بنجاح" : "Office approved successfully" });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiRequest("POST", `/api/admin/offices/${id}/reject`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/admin/offices"] });
            toast({ title: language === 'ar' ? "تم الرفض" : "Rejected", description: language === 'ar' ? "تم رفض المكتب" : "Office rejected" });
        }
    });

    const kpis = [
        {
            label: language === 'ar' ? "الاشتراكات النشطة" : "Active Subscriptions",
            value: stats?.activeSubscriptions || 0,
            icon: Zap,
            gradient: "from-cyan-500 to-blue-500",
            trend: "+12% " + (language === 'ar' ? "هذا الشهر" : "this month")
        },
        {
            label: language === 'ar' ? "إجمالي المكاتب" : "Total Offices",
            value: stats?.totalOffices || 0,
            icon: Building2,
            gradient: "from-purple-500 to-indigo-500",
            trend: "+5 " + (language === 'ar' ? "جديد" : "new")
        },
        {
            label: language === 'ar' ? "إجمالي المستخدمين" : "Total Users",
            value: stats?.totalUsers || 0,
            icon: Users,
            gradient: "from-emerald-500 to-teal-500",
            trend: "+48 " + (language === 'ar' ? "منذ الأمس" : "since yesterday")
        },
        {
            label: language === 'ar' ? "طلبات قيد الانتظار" : "Pending Requests",
            value: stats?.pendingRequests || 0,
            icon: Clock,
            gradient: "from-amber-500 to-orange-500",
            trend: language === 'ar' ? "تحتاج تدخل" : "Requires action",
            isAlert: (stats?.pendingRequests || 0) > 0
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
            style: 'currency',
            currency: 'SAR',
        }).format(amount / 100);
    };

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto min-h-screen bg-slate-950/50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                                {language === 'ar' ? "نظام إدارة المنصة" : "Platform Management System"}
                            </h1>
                            <p className="text-slate-400 text-sm font-medium">
                                {language === 'ar' ? "مرحباً بك في لوحة تحكم الإدارة العليا" : "Welcome to the Super Admin control hub"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="px-4 py-2 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-semibold backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mr-2 ml-2" />
                        {language === 'ar' ? "جميع الأنظمة تعمل" : "All Systems Operational"}
                    </Badge>
                    <div className="h-10 w-[1px] bg-white/10 hidden md:block" />
                    <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                        <Filter className="h-4 w-4 mr-2 ml-2" />
                        {language === 'ar' ? "تصفية" : "Filter"}
                    </Button>
                </div>
            </div>

            {/* KPI Section */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => (
                    <Card key={index} className="glass border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${kpi.gradient} opacity-[0.03] rounded-full -mr-16 -mt-16 group-hover:opacity-[0.07] transition-opacity`} />
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-br ${kpi.gradient} shadow-lg shadow-black/20`}>
                                    <kpi.icon className="h-5 w-5 text-white" />
                                </div>
                                {kpi.isAlert && (
                                    <div className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <CardDescription className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">
                                    {kpi.label}
                                </CardDescription>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-bold text-white tracking-tight">
                                        {statsLoading ? <Skeleton className="h-8 w-16" /> : kpi.value}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 font-medium">
                                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                                    <span className="text-emerald-400">{kpi.trend}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            {/* Dashboard Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1 w-full md:w-auto h-auto grid grid-cols-2 md:inline-flex">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg px-6 py-2">
                        {language === 'ar' ? "نظرة عامة" : "Overview"}
                    </TabsTrigger>
                    <TabsTrigger value="offices" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg px-6 py-2">
                        {language === 'ar' ? "إدارة المكاتب" : "Offices"}
                    </TabsTrigger>
                    <TabsTrigger value="financials" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg px-6 py-2">
                        {language === 'ar' ? "التقارير المالية" : "Financials"}
                    </TabsTrigger>
                    <TabsTrigger value="subscriptions" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg px-6 py-2">
                        {language === 'ar' ? "الاشتراكات" : "Subscriptions"}
                    </TabsTrigger>
                    <TabsTrigger value="support" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg px-6 py-2">
                        {language === 'ar' ? "الدعم الفني" : "Support"}
                    </TabsTrigger>
                    <TabsTrigger value="workflow" className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg px-6 py-2">
                        {language === 'ar' ? "العمليات" : "Operations"}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Growth Chart */}
                        <Card className="lg:col-span-2 glass border-white/5 shadow-2xl overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5 text-indigo-400" />
                                            {language === 'ar' ? "مؤشرات النمو" : "Growth Indicators"}
                                        </CardTitle>
                                        <CardDescription>{language === 'ar' ? "الأرباح والمشتركين لآخر 6 أشهر" : "Profits and subscribers for the last 6 months"}</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={growthData}>
                                            <defs>
                                                <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis
                                                dataKey="month"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                                tickFormatter={(val) => `$${val}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#0f172a',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '12px',
                                                    color: '#fff'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="profits"
                                                stroke="#6366f1"
                                                strokeWidth={3}
                                                fill="url(#profitGradient)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Platform Health / Secondary Metrics */}
                        <Card className="glass border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white text-lg flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-teal-400" />
                                    {language === 'ar' ? "حالة النظام" : "System Health"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">{language === 'ar' ? "استخدام الذاكرة" : "Memory usage"}</span>
                                        <span className="text-white font-medium">42%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[42%]" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">{language === 'ar' ? "زمن الاستجابة" : "API Response Time"}</span>
                                        <span className="text-white font-medium">124ms</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500 w-[15%]" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <Sparkles className="h-8 w-8 text-indigo-400" />
                                        <div>
                                            <p className="text-white font-semibold">{language === 'ar' ? "تقرير ذكي" : "AI Insights"}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {language === 'ar' ? "زيادة متوقعة بنسبة 15% في الطلبات الأسبوع القادم" : "Projected 15% increase in requests next week"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="offices" className="outline-none">
                    <Card className="glass border-white/5">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-white">{language === 'ar' ? "دليل المكاتب" : "Offices Directory"}</CardTitle>
                                    <CardDescription>{language === 'ar' ? "إدارة واعتماد مقدمي الخدمات الجدد" : "Manage and approve new service providers"}</CardDescription>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder={language === 'ar' ? "البحث عن مكتب..." : "Search offices..."}
                                        className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "المكتب" : "Office"}</th>
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "المالك" : "Owner"}</th>
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "الحالة" : "Status"}</th>
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "التاريخ" : "Date"}</th>
                                            <th className="px-6 py-4 font-semibold text-right">{language === 'ar' ? "الإجراءات" : "Actions"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {officesLoading ? Array(5).fill(0).map((_, i) => (
                                            <tr key={i}><td colSpan={5} className="px-6 py-4"><Skeleton className="h-10 w-full" /></td></tr>
                                        )) : offices.map((office) => (
                                            <tr key={office.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{office.name}</td>
                                                <td className="px-6 py-4 text-slate-400">{office.ownerId}</td>
                                                <td className="px-6 py-4">
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            office.approvalStatus === 'approved' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                                                office.approvalStatus === 'pending' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                                    "bg-red-500/10 text-red-400 border-red-500/20"
                                                        }
                                                    >
                                                        {office.approvalStatus || 'pending'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">{new Date(office.createdAt!).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {office.approvalStatus === 'pending' && (
                                                            <>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                                                                    onClick={() => approveMutation.mutate(office.id)}
                                                                >
                                                                    <CheckCircle2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-8 w-8 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                                                                    onClick={() => rejectMutation.mutate(office.id)}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:bg-white/10 hover:text-white">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="financials" className="outline-none space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="glass border-white/5 bg-emerald-500/5 shadow-lg shadow-emerald-500/5">
                            <CardContent className="p-6">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{language === 'ar' ? "إجمالي الإيرادات" : "Total Revenue"}</p>
                                <h3 className="text-2xl font-bold text-emerald-400">{formatCurrency(financialReports?.totalRevenue || 0)}</h3>
                                <p className="text-[10px] text-slate-500 mt-2">{language === 'ar' ? "جميع المبيعات منذ البداية" : "All sales since inception"}</p>
                            </CardContent>
                        </Card>
                        <Card className="glass border-white/5 bg-indigo-500/5 shadow-lg shadow-indigo-500/5">
                            <CardContent className="p-6">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{language === 'ar' ? "صافي الربح" : "Net Profit"}</p>
                                <h3 className="text-2xl font-bold text-indigo-400">{formatCurrency(financialReports?.netProfit || 0)}</h3>
                                <p className="text-[10px] text-slate-500 mt-2">{language === 'ar' ? "بعد خصم العمولات والضرائب" : "After commissions and taxes"}</p>
                            </CardContent>
                        </Card>
                        <Card className="glass border-white/5 bg-violet-500/5 shadow-lg shadow-violet-500/5">
                            <CardContent className="p-6">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{language === 'ar' ? "المستحقات للفروع" : "Office Payouts"}</p>
                                <h3 className="text-2xl font-bold text-violet-400">{formatCurrency(financialReports?.payoutsPending || 0)}</h3>
                                <p className="text-[10px] text-slate-500 mt-2">{language === 'ar' ? "مدفوعات قيد التحويل للمكاتب" : "Pending transfers to office owners"}</p>
                            </CardContent>
                        </Card>
                        <Card className="glass border-white/5 bg-amber-500/5 shadow-lg shadow-amber-500/5">
                            <CardContent className="p-6">
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">{language === 'ar' ? "إجمالي العمولات" : "Platform Commissions"}</p>
                                <h3 className="text-2xl font-bold text-amber-400">{formatCurrency(financialReports?.commissions || 0)}</h3>
                                <p className="text-[10px] text-slate-500 mt-2">{language === 'ar' ? "إجمالي رسوم المنصة المجموعة" : "Total platform usage fees collected"}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="glass border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <ClipboardList className="h-5 w-5 text-indigo-400" />
                                {language === 'ar' ? "سجل المدفوعات" : "Payment Logs"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                                    <thead>
                                        <tr className="border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "رقم الطلب" : "Order ID"}</th>
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "الخدمة" : "Service"}</th>
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "المبلغ" : "Amount"}</th>
                                            <th className="px-6 py-4 font-semibold">{language === 'ar' ? "الحالة" : "Status"}</th>
                                            <th className="px-6 py-4 font-semibold text-right">{language === 'ar' ? "التاريخ" : "Date"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {paymentLogs.map((log) => (
                                            <tr key={log.id} className="group hover:bg-white/[0.01]">
                                                <td className="px-6 py-4 text-white font-mono text-xs">#{log.id}</td>
                                                <td className="px-6 py-4 text-slate-300">Service {log.serviceId}</td>
                                                <td className="px-6 py-4 font-semibold text-emerald-400">{formatCurrency(log.quotedPrice)}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className={log.status === 'paid' ? "text-emerald-400 border-emerald-400/20" : "text-amber-400 border-amber-400/20"}>
                                                        {log.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-right text-slate-500">{new Date(log.createdAt!).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="subscriptions" className="outline-none space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { name: 'Starter', price: '499', features: ['5 Users', '1 Office', 'Standard Support'] },
                            { name: 'Professional', price: '1299', features: ['20 Users', '3 Offices', 'Priority Support'] },
                            { name: 'Enterprise', price: '2999', features: ['Unlimited Users', 'Unlimited Offices', '24/7 Support'] },
                        ].map((plan) => (
                            <Card key={plan.name} className="glass border-white/5 hover:border-indigo-500/50 transition-all group">
                                <CardHeader>
                                    <CardTitle className="text-white">{plan.name}</CardTitle>
                                    <CardDescription>{language === 'ar' ? "خطة الاشتراك الرئيسية" : "Main subscription plan"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-white mb-6">
                                        {plan.price} <span className="text-sm font-normal text-slate-500">SAR / mo</span>
                                    </div>
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map(f => (
                                            <li key={f} className="text-sm text-slate-400 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10">
                                        {language === 'ar' ? "تعديل الخطة" : "Edit Plan"}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="support" className="outline-none space-y-6">
                    <Card className="glass border-white/5">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-400" />
                                {language === 'ar' ? "تذاكر الدعم الفني" : "Support Tickets"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">{language === 'ar' ? "لا توجد تذاكر نشطة حالياً" : "No active support tickets found"}</p>
                                <Button variant="outline" className="mt-4 border-white/10 text-white">{language === 'ar' ? "تحديث" : "Refresh"}</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="workflow" className="outline-none space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="glass border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white text-md flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-cyan-400" />
                                    {language === 'ar' ? "مراقبة المهام" : "Task Monitor"}
                                </CardTitle>
                                <CardDescription>{language === 'ar' ? "توزيع المهام عبر المؤسسة بالكامل" : "Enterprise-wide task distribution"}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-48 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
                                    <p className="text-slate-500 text-sm">Task flow visualization coming soon</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass border-white/5">
                            <CardHeader>
                                <CardTitle className="text-white text-md flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-indigo-400" />
                                    {language === 'ar' ? "سجل الأمان" : "Security Log"}
                                </CardTitle>
                                <CardDescription>{language === 'ar' ? "نشاط الإداريين والوصول للنظام" : "Admin activity and system access"}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-white/5">
                                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-400">AU</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white"><span className="font-semibold">Admin User</span> updated permissions for Finance Module</p>
                                            <p className="text-[10px] text-slate-500 mt-1">2 hours ago • IP 192.168.1.1</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
