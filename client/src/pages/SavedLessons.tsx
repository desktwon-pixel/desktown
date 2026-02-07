import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Filter,
    Play,
    Download,
    Heart,
    Share2,
    Clock,
    Eye,
    Star,
    ChevronDown,
    BookOpen,
    TrendingUp,
    Calendar,
} from "lucide-react";

interface Lesson {
    id: string;
    thumbnail: string;
    title: {
        ar: string;
        en: string;
    };
    instructor: {
        name: string;
        avatar: string;
    };
    duration: string;
    progress: number;
    publishedDate: string;
    viewCount: number;
    rating: number;
    category: string;
    tags: string[];
    isNew?: boolean;
}

const mockLessons: Lesson[] = [
    {
        id: "1",
        thumbnail: "/api/placeholder/400/225",
        title: {
            ar: "تطوير القيادة الاستراتيجية",
            en: "Strategic Leadership Development",
        },
        instructor: {
            name: "د. أحمد المنصوري / Dr. Ahmad Al-Mansouri",
            avatar: "/api/placeholder/40/40",
        },
        duration: "45:30",
        progress: 75,
        publishedDate: "2024-10-24",
        viewCount: 1200,
        rating: 4.8,
        category: "القيادة / Leadership",
        tags: ["قيادة", "إدارة", "استراتيجية"],
        isNew: true,
    },
    {
        id: "2",
        thumbnail: "/api/placeholder/400/225",
        title: {
            ar: "التحليل المالي لغير الماليين",
            en: "Financial Analysis for Non-Finance",
        },
        instructor: {
            name: "سارة الخالدي / Sarah Al-Khalidi",
            avatar: "/api/placeholder/40/40",
        },
        duration: "52:15",
        progress: 23,
        publishedDate: "2024-10-20",
        viewCount: 850,
        rating: 4.6,
        category: "المالية / Finance",
        tags: ["مالية", "تحليل", "محاسبة"],
    },
    {
        id: "3",
        thumbnail: "/api/placeholder/400/225",
        title: {
            ar: "خصوصية البيانات والامتثال",
            en: "Data Privacy and Compliance",
        },
        instructor: {
            name: "م. خالد العتيبي / Eng. Khaled Al-Otaibi",
            avatar: "/api/placeholder/40/40",
        },
        duration: "38:45",
        progress: 100,
        publishedDate: "2024-10-15",
        viewCount: 2100,
        rating: 4.9,
        category: "التقنية / Technology",
        tags: ["أمن", "بيانات", "امتثال"],
        isNew: true,
    },
    {
        id: "4",
        thumbnail: "/api/placeholder/400/225",
        title: {
            ar: "التواصل الفعال للفرق",
            en: "Effective Team Communication",
        },
        instructor: {
            name: "نورة السالم / Noura Al-Salem",
            avatar: "/api/placeholder/40/40",
        },
        duration: "41:20",
        progress: 60,
        publishedDate: "2024-10-10",
        viewCount: 1500,
        rating: 4.7,
        category: "التواصل / Communication",
        tags: ["تواصل", "فرق", "مهارات"],
    },
    {
        id: "5",
        thumbnail: "/api/placeholder/400/225",
        title: {
            ar: "إدارة المشاريع الرشيقة",
            en: "Agile Project Management",
        },
        instructor: {
            name: "د. محمد الشمري / Dr. Mohammed Al-Shammari",
            avatar: "/api/placeholder/40/40",
        },
        duration: "55:00",
        progress: 0,
        publishedDate: "2024-10-05",
        viewCount: 980,
        rating: 4.5,
        category: "الإدارة / Management",
        tags: ["مشاريع", "أجايل", "إدارة"],
    },
    {
        id: "6",
        thumbnail: "/api/placeholder/400/225",
        title: {
            ar: "الذكاء الاصطناعي في الأعمال",
            en: "AI in Business",
        },
        instructor: {
            name: "د. فاطمة الدوسري / Dr. Fatima Al-Dosari",
            avatar: "/api/placeholder/40/40",
        },
        duration: "48:30",
        progress: 15,
        publishedDate: "2024-09-28",
        viewCount: 3200,
        rating: 5.0,
        category: "التقنية / Technology",
        tags: ["AI", "تقنية", "ابتكار"],
        isNew: true,
    },
];

const categories = [
    "الكل / All",
    "القيادة / Leadership",
    "التواصل / Communication",
    "التقنية / Technology",
    "المبيعات / Sales",
    "المالية / Finance",
    "الإدارة / Management",
];

export default function SavedLessons() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("الكل / All");
    const [sortBy, setSortBy] = useState("newest");
    const [showFilters, setShowFilters] = useState(false);

    const filteredLessons = mockLessons.filter((lesson) => {
        const matchesSearch =
            lesson.title.ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.title.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lesson.instructor.name.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === "الكل / All" || lesson.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white" dir="rtl">
            {/* Header */}
            <div className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
                                    الدروس المحفوظة
                                </h1>
                                <p className="text-sm text-gray-400">Saved Lessons Library</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-105">
                                <Download className="w-4 h-4 ml-2" />
                                تحميل الكل / Download All
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="ابحث عن الدروس... / Search lessons..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-teal-500 rounded-xl h-12"
                            />
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white/5 border border-white/10 text-white rounded-xl px-6 pr-12 h-12 cursor-pointer hover:bg-white/10 transition-colors focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="newest" className="bg-gray-800">الأحدث / Newest</option>
                                <option value="mostViewed" className="bg-gray-800">الأكثر مشاهدة / Most Viewed</option>
                                <option value="alphabetical" className="bg-gray-800">أبجدي / Alphabetical</option>
                                <option value="rating" className="bg-gray-800">التقييم / Rating</option>
                            </select>
                            <ChevronDown className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Filter Toggle */}
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className="border-white/10 hover:bg-white/10 text-white h-12 px-6"
                        >
                            <Filter className="w-5 h-5 ml-2" />
                            فلاتر / Filters
                        </Button>
                    </div>

                    {/* Category Filters */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-sm font-semibold text-gray-400 mb-3">التصنيفات / Categories</h3>
                            <div className="flex flex-wrap gap-2">
                                {categories.map((category) => (
                                    <Badge
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${selectedCategory === category
                                                ? "bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-lg shadow-teal-500/30"
                                                : "bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10"
                                            }`}
                                    >
                                        {category}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/5 border-teal-500/20 backdrop-blur-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">إجمالي الدروس / Total Lessons</p>
                                <p className="text-3xl font-bold text-teal-400">{filteredLessons.length}</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-teal-500/20 flex items-center justify-center">
                                <BookOpen className="w-7 h-7 text-teal-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 backdrop-blur-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">ساعات التعلم / Learning Hours</p>
                                <p className="text-3xl font-bold text-blue-400">24.5</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                <Clock className="w-7 h-7 text-blue-400" />
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 backdrop-blur-md p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1">معدل الإكمال / Completion Rate</p>
                                <p className="text-3xl font-bold text-purple-400">68%</p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                <TrendingUp className="w-7 h-7 text-purple-400" />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Lessons Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLessons.map((lesson) => (
                        <LessonCard key={lesson.id} lesson={lesson} />
                    ))}
                </div>

                {/* Empty State */}
                {filteredLessons.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                            <Search className="w-12 h-12 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                            لم يتم العثور على نتائج
                        </h3>
                        <p className="text-gray-500">No results found. Try adjusting your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function LessonCard({ lesson }: { lesson: Lesson }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);

    return (
        <Card
            className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden hover:border-teal-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/20 hover:-translate-y-2 cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden bg-gray-800">
                <img
                    src={lesson.thumbnail}
                    alt={lesson.title.en}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center shadow-2xl shadow-teal-500/50 transform transition-transform duration-300 hover:scale-110">
                            <Play className="w-8 h-8 text-white mr-1" />
                        </div>
                    </div>
                </div>

                {/* Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {lesson.isNew && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-3 py-1 shadow-lg">
                            جديد / New
                        </Badge>
                    )}
                    <Badge className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 border border-white/20">
                        {lesson.duration}
                    </Badge>
                </div>

                {/* Quick Actions */}
                {isHovered && (
                    <div className="absolute top-3 left-3 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsFavorite(!isFavorite);
                            }}
                            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        </button>
                        <button className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Share2 className="w-4 h-4 text-white" />
                        </button>
                        <button className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                            <Download className="w-4 h-4 text-white" />
                        </button>
                    </div>
                )}

                {/* Progress Bar */}
                {lesson.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/40">
                        <div
                            className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500"
                            style={{ width: `${lesson.progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {/* Category */}
                <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30 text-xs mb-3">
                    {lesson.category}
                </Badge>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-teal-400 transition-colors">
                    {lesson.title.ar}
                </h3>
                <p className="text-sm text-gray-400 mb-4 line-clamp-1">{lesson.title.en}</p>

                {/* Instructor */}
                <div className="flex items-center gap-3 mb-4">
                    <img
                        src={lesson.instructor.avatar}
                        alt={lesson.instructor.name}
                        className="w-8 h-8 rounded-full border-2 border-white/10"
                    />
                    <span className="text-sm text-gray-300 line-clamp-1">{lesson.instructor.name}</span>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{lesson.viewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-yellow-400 font-semibold">{lesson.rating}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(lesson.publishedDate).toLocaleDateString('ar-SA')}</span>
                    </div>
                </div>

                {/* Progress Text */}
                {lesson.progress > 0 && (
                    <div className="text-xs text-gray-400 mb-3">
                        {lesson.progress === 100 ? (
                            <span className="text-green-400 font-semibold">✓ مكتمل / Completed</span>
                        ) : (
                            <span>{lesson.progress}% مكتمل / Complete</span>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <Button className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg shadow-teal-500/20 transition-all hover:scale-105">
                    <Play className="w-4 h-4 ml-2" />
                    {lesson.progress === 100 ? 'إعادة المشاهدة / Rewatch' : lesson.progress > 0 ? 'متابعة / Continue' : 'مشاهدة الآن / Watch Now'}
                </Button>
            </div>
        </Card>
    );
}
