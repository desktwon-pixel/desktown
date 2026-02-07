import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Search,
  Briefcase,
  Gift,
  User,
  UserCircle,
  DoorOpen,
  Bell,
  Monitor,
  Globe,
  Home,
  Play,
  X,
  Users,
  Plus,
  Video,
  Clock,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logoUrl from "/assets/logo.png";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Advertisement, Office, Story } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const partners = [
  { id: 1, name: "Somira", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" },
  { id: 2, name: "Legal Hub", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" },
  { id: 3, name: "Finance Pro", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" },
  { id: 4, name: "Finance Pro", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop" },
  { id: 5, name: "Osamo Pro", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" },
  { id: 6, name: "Sliamo Pro", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop" },
  { id: 7, name: "قدوه.رائد", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&h=100&fit=crop" },
  { id: 8, name: "لايزي", avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop" },
];

export default function Landing() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewedAds, setViewedAds] = useState<Set<number>>(new Set());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { language, setLanguage, isRTL } = useLanguage();

  // Check which profile is logged in
  const [loggedInProfile, setLoggedInProfile] = useState<'office' | 'visitor' | 'employee' | null>(null);

  useEffect(() => {
    const loggedInAs = localStorage.getItem('loggedInAs');

    if (loggedInAs === 'office') {
      setLoggedInProfile('office');
    } else if (loggedInAs === 'visitor') {
      setLoggedInProfile('visitor');
    } else if (loggedInAs === 'employee') {
      setLoggedInProfile('employee');
    } else {
      setLoggedInProfile(null);
    }
  }, [showProfileModal]);

  // Handle redirect after social login
  useEffect(() => {
    const pendingProfileType = localStorage.getItem('pendingProfileType');
    if (pendingProfileType) {
      // Clear the pending type
      localStorage.removeItem('pendingProfileType');
      // Set as logged in
      localStorage.setItem('loggedInAs', pendingProfileType);
      // Redirect to the appropriate profile page
      if (pendingProfileType === 'office') {
        setLocation('/profile/office');
      } else if (pendingProfileType === 'visitor') {
        setLocation('/profile/visitor');
      } else if (pendingProfileType === 'employee') {
        setLocation('/profile/employee');
      }
    }
  }, [setLocation]);

  const newsItems = [
    { icon: Bell, text: language === 'ar' ? 'تعمل المنصة على أتمتة الإجراءات' : 'Platform automates procedures' },
    { icon: Monitor, text: language === 'ar' ? 'تم إضافة قاعات التدريب والبث المباشر' : 'Training rooms and live streaming added' },
  ];

  const { data: activeAds = [] } = useQuery<Advertisement[]>({
    queryKey: ['/api/advertisements/active'],
  });

  const { data: realOffices = [] } = useQuery<Office[]>({
    queryKey: ['/api/public/offices'],
  });

  // Stories query
  const { data: activeStories = [] } = useQuery<(Story & { author?: { firstName?: string; lastName?: string; profileImageUrl?: string } })[]>({
    queryKey: ['/api/public/stories'],
  });

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Story types with author info
  type StoryWithAuthor = Story & { author?: { firstName?: string | null; lastName?: string | null; profileImageUrl?: string | null } };

  const [selectedStory, setSelectedStory] = useState<StoryWithAuthor | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentUserStories, setCurrentUserStories] = useState<StoryWithAuthor[]>([]);

  // Group stories by author
  const groupedStories = activeStories.reduce((acc, story) => {
    const authorId = story.authorId;
    if (!acc[authorId]) {
      acc[authorId] = {
        author: story.author,
        authorId,
        stories: []
      };
    }
    acc[authorId].stories.push(story);
    return acc;
  }, {} as Record<string, { author?: { firstName?: string; lastName?: string; profileImageUrl?: string }; authorId: string; stories: typeof activeStories }>);

  const userGroups = Object.values(groupedStories);

  // Handle opening stories for a user
  const openUserStories = (authorId: string) => {
    const userStories = groupedStories[authorId]?.stories || [];
    if (userStories.length > 0) {
      setCurrentUserStories(userStories);
      setCurrentStoryIndex(0);
      setSelectedStory(userStories[0]);
    }
  };

  // Navigate to next story
  const nextStory = () => {
    if (currentStoryIndex < currentUserStories.length - 1) {
      const newIndex = currentStoryIndex + 1;
      setCurrentStoryIndex(newIndex);
      setSelectedStory(currentUserStories[newIndex]);
    } else {
      // Close when all stories are viewed
      setSelectedStory(null);
      setCurrentUserStories([]);
      setCurrentStoryIndex(0);
    }
  };

  // Navigate to previous story
  const prevStory = () => {
    if (currentStoryIndex > 0) {
      const newIndex = currentStoryIndex - 1;
      setCurrentStoryIndex(newIndex);
      setSelectedStory(currentUserStories[newIndex]);
    }
  };

  // Close story viewer
  const closeStoryViewer = () => {
    setSelectedStory(null);
    setCurrentUserStories([]);
    setCurrentStoryIndex(0);
  };

  const trackAdView = async (adId: number) => {
    if (!viewedAds.has(adId)) {
      setViewedAds(prev => new Set(prev).add(adId));
      try {
        await apiRequest('POST', `/api/advertisements/${adId}/view`);
      } catch (error) {
        console.error('Failed to track ad view:', error);
      }
    }
  };

  const handleAdClick = async (ad: Advertisement) => {
    try {
      await apiRequest('POST', `/api/advertisements/${ad.id}/click`);
    } catch (error) {
      console.error('Failed to track ad click:', error);
    }
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  useEffect(() => {
    if (activeAds && activeAds.length > 0) {
      activeAds.forEach(ad => trackAdView(ad.id));
    }
  }, [activeAds]);

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    setLanguage(lang);
  };

  const displayOffices = realOffices.length > 0
    ? realOffices.slice(0, 2).map(office => ({
      id: office.id,
      name: office.name,
      slug: office.slug,
      description: office.description || 'Virtual Office',
      tenant: office.name,
    }))
    : [
      { id: 1, name: 'Virtual Office', slug: 'virtual-1', description: 'Ooon dell usd lifrendi', tenant: 'Sep Haytt' },
      { id: 2, name: 'Virtual Office', slug: 'virtual-2', description: 'Ooon dell usd lifrendi', tenant: 'Sepsi Ink' },
    ];

  return (
    <div className={`min-h-screen bg-[#0B0F19] text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 md:px-6 lg:px-8 space-y-5 pb-24">

        {/* Header */}
        <header className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9" data-testid="button-language-switcher">
                  <Globe className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#1a1f2e] border-white/10">
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('en')}
                  className={`text-white hover:bg-white/10 ${language === 'en' ? 'bg-amber-500/20' : ''}`}
                  data-testid="menu-item-english"
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('ar')}
                  className={`text-white hover:bg-white/10 ${language === 'ar' ? 'bg-amber-500/20' : ''}`}
                  data-testid="menu-item-arabic"
                >
                  العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">DeskTown</span>
            <img src={logoUrl} alt="DeskTown" className="h-8 w-8 object-contain" />
          </div>
        </header>

        {/* Search Bar with Title */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-white whitespace-nowrap">{language === 'ar' ? 'الحالات' : 'Cases'}</h2>
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500`} />
            <Input
              placeholder={language === 'ar' ? 'ابحث عن المكاتب الافتراضية...' : 'Search for virtual offices...'}
              className={`${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} h-11 bg-[#1a1f2e] border-0 text-white placeholder:text-gray-500 rounded-xl text-sm`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Stories Section */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-2">

            {/* Active Stories - Grouped by User */}
            {userGroups.length > 0 ? (
              userGroups.map((group) => (
                <div
                  key={group.authorId}
                  className="flex flex-col items-center gap-1.5 min-w-[60px] cursor-pointer"
                  onClick={() => openUserStories(group.authorId)}
                  data-testid={`story-user-${group.authorId}`}
                >
                  <div className="relative">
                    {/* Rainbow ring for stories */}
                    <div className="h-14 w-14 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-500">
                      <Avatar className="h-full w-full ring-2 ring-[#0B0F19]">
                        <AvatarImage src={group.author?.profileImageUrl || ''} className="object-cover" />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs">
                          {group.author?.firstName?.[0] || group.author?.lastName?.[0] || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {/* Story count badge */}
                    {group.stories.length > 1 && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                        <span className="text-[10px] text-white font-bold">{group.stories.length}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 truncate max-w-[60px] text-center">
                    {group.author?.firstName || (language === 'ar' ? 'مستخدم' : 'User')}
                  </span>
                </div>
              ))
            ) : (
              // Fallback partners when no stories
              partners.map((partner) => (
                <div key={partner.id} className="flex flex-col items-center gap-1.5 min-w-[60px]">
                  <Avatar className="h-12 w-12 ring-2 ring-amber-500/60">
                    <AvatarImage src={partner.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-medium">
                      {partner.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] text-gray-400 truncate max-w-[60px] text-center">
                    {partner.name}
                  </span>
                </div>
              ))
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden">
          <div
            className="h-40 md:h-52 lg:h-64 bg-cover bg-center"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(11,15,25,0.2), rgba(11,15,25,0.85)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80')`
            }}
          />
          <div className="absolute inset-0 flex flex-col justify-center px-4 md:px-8 items-start text-left">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-1 md:mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {language === 'ar' ? 'افتح مكتبك السحابي الآن' : 'Open Your Cloud Office Now'}
            </h2>
            <p className="text-amber-500 text-2xl md:text-3xl lg:text-4xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {language === 'ar' ? '- بدون إيجار تقليدي' : '- No Traditional Rent'}
            </p>
          </div>
        </div>

        {/* Featured Ad + News Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {/* Featured Ad Card - Expanded */}
          {activeAds.length > 0 ? (
            activeAds.slice(0, 1).map((ad) => (
              <Card
                key={ad.id}
                className="bg-[#1a1f2e] border border-amber-500/40 rounded-2xl cursor-pointer"
                onClick={() => handleAdClick(ad)}
                data-testid={`card-ad-${ad.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <Gift className="h-12 w-12 text-amber-500" />
                    <div>
                      <h3 className="text-lg font-bold text-white mb-2">{ad.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3">{ad.description}</p>
                      <Button
                        className="bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-amber-700 text-white rounded-full text-sm px-6 py-2 h-auto font-bold shadow-lg shadow-amber-600/40 ring-1 ring-amber-400/50 border-t border-amber-300/30"
                        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ad.linkUrl) {
                            window.open(ad.linkUrl, '_blank');
                          }
                        }}
                        data-testid={`button-ad-link-${ad.id}`}
                      >
                        {language === 'ar' ? 'اعرف أكثر' : 'Learn More'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-[#1a1f2e] border border-amber-500/40 rounded-2xl" data-testid="card-featured-ad">
              <CardContent className="p-6">
                <div className={`flex items-center gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold text-white mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'إعلان مميز هنّا' : 'Featured Ad Here'}
                    </h3>
                    <p className={`text-gray-400 text-sm leading-relaxed font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                      {language === 'ar' ? 'اعرف عنّا للحصول على مزيد العملاء' : 'Learn about us to get more customers'}
                    </p>
                  </div>
                  <Gift className="h-12 w-12 text-amber-500 flex-shrink-0" />
                </div>
                <Button
                  className="w-full bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-amber-700 text-white rounded-full text-sm py-3 h-auto font-bold shadow-lg shadow-amber-600/40 ring-1 ring-amber-400/50 border-t border-amber-300/30"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {language === 'ar' ? 'اعرف أكثر' : 'Learn More'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* News Card */}
          <Card className="bg-[#1a1f2e] border border-amber-500/40 rounded-2xl cursor-pointer hover:bg-[#21283b] transition-all" onClick={() => setLocation("/news")} data-testid="card-news">
            <CardContent className="p-6">
              <h3 className={`text-sm font-bold mb-3 text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'مقتطفات آخر الأخبار' : 'Latest News'}
              </h3>
              <div className="space-y-3">
                {newsItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 text-[11px] text-gray-300 font-bold text-right flex-row-reverse" dir="rtl">
                    <item.icon className="h-4 w-4 text-white flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Virtual Offices Section */}
        <div>
          <h2 className={`text-base font-bold mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
            {language === 'ar' ? 'وصول عالمي: مكتبك الافتراضي' : 'Global Reach: Your Virtual Office'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {displayOffices.map((office) => (
              <Link key={office.id} href={`/office/${office.slug}`}>
                <Card className="bg-white text-gray-900 overflow-hidden" data-testid={`card-office-${office.id}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs">{office.name}</h3>
                        <p className="text-[9px] text-gray-500 truncate">{office.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gray-100 text-gray-600 text-[8px]">
                          {office.tenant.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[10px] font-medium text-gray-900">{office.tenant}</p>
                        <Badge variant="outline" className="text-[8px] bg-amber-50 text-amber-700 border-amber-200 px-1.5 py-0 h-4">
                          {language === 'ar' ? 'مستأجر' : 'Renter'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117]/95 backdrop-blur-xl border-t border-white/5 safe-area-inset-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label={language === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
        data-testid="nav-bottom-bar"
      >
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-2 py-2">
          <div className="flex items-center justify-around">
            <Link
              href="/"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-home"
            >
              <Home className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <Link
              href="/storefront"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-offices"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'المكاتب' : 'Offices'}</span>
            </Link>
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-profile"
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'حسابي' : 'Profile'}</span>
            </button>
            <Link
              href="/careers"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-careers"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'الوظائف' : 'Jobs'}</span>
            </Link>
            <Link
              href="/videos"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-videos"
            >
              <Play className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'المقاطع' : 'Reels'}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Profile Selection Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            className="w-full max-w-md bg-[#1a1f2e] rounded-t-3xl p-6 pb-8 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {language === 'ar' ? 'اختر نوع الحساب' : 'Choose Account Type'}
              </h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                data-testid="button-close-profile-modal"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {/* Office Login - Show only if no one logged in OR office is logged in */}
              {(loggedInProfile === null || loggedInProfile === 'office') && (
                <>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      if (loggedInProfile === 'office') {
                        // Already logged in, go to profile
                        setLocation('/profile/office');
                      } else {
                        // Store pending profile type and redirect to social login
                        localStorage.setItem('pendingProfileType', 'office');
                        window.location.href = '/api/login?role=office_renter&type=office';
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl hover:border-amber-400 transition-all"
                    data-testid="button-office-login"
                  >
                    <div className="p-3 rounded-full bg-amber-500">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right flex-1">
                      <h3 className="text-white font-bold text-lg">
                        {language === 'ar' ? (loggedInProfile === 'office' ? 'بروفايل المكتب' : 'دخول المكتب') : (loggedInProfile === 'office' ? 'Office Profile' : 'Office Login')}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {language === 'ar' ? 'عبر Google أو Apple أو الإيميل' : 'Via Google, Apple or Email'}
                      </p>
                    </div>
                  </button>

                  {/* Google Login for Office */}
                  {loggedInProfile === null && (
                    <Button
                      onClick={() => {
                        localStorage.setItem('pendingProfileType', 'office');
                        window.location.href = '/api/auth/google';
                      }}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl py-2 h-auto gap-2"
                      data-testid="button-google-office-login"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>{language === 'ar' ? 'الدخول عبر جوجل' : 'Login with Google'}</span>
                    </Button>
                  )}
                </>
              )}

              {/* Visitor Login - Show only if no one logged in OR visitor is logged in */}
              {(loggedInProfile === null || loggedInProfile === 'visitor') && (
                <>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      if (loggedInProfile === 'visitor') {
                        // Already logged in, go to profile
                        setLocation('/profile/visitor');
                      } else {
                        // Store pending profile type and redirect to social login
                        localStorage.setItem('pendingProfileType', 'visitor');
                        window.location.href = '/api/login?role=visitor&type=visitor';
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl hover:border-blue-400 transition-all"
                    data-testid="button-visitor-login"
                  >
                    <div className="p-3 rounded-full bg-blue-500">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right flex-1">
                      <h3 className="text-white font-bold text-lg">
                        {language === 'ar' ? (loggedInProfile === 'visitor' ? 'بروفايل الزائر' : 'دخول الزائر') : (loggedInProfile === 'visitor' ? 'Visitor Profile' : 'Visitor Login')}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {language === 'ar' ? 'عبر Google أو Apple أو الإيميل' : 'Via Google, Apple or Email'}
                      </p>
                    </div>
                  </button>

                  {/* Google Login for Visitor */}
                  {loggedInProfile === null && (
                    <Button
                      onClick={() => {
                        localStorage.setItem('pendingProfileType', 'visitor');
                        window.location.href = '/api/auth/google';
                      }}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl py-2 h-auto gap-2"
                      data-testid="button-google-visitor-login"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>{language === 'ar' ? 'الدخول عبر جوجل' : 'Login with Google'}</span>
                    </Button>
                  )}
                </>
              )}

              {/* Employee Login - Show only if no one logged in OR employee is logged in */}
              {(loggedInProfile === null || loggedInProfile === 'employee') && (
                <>
                  <button
                    onClick={() => {
                      setShowProfileModal(false);
                      if (loggedInProfile === 'employee') {
                        // Already logged in, go to profile
                        setLocation('/profile/employee');
                      } else {
                        // Store pending profile type and redirect to social login
                        localStorage.setItem('pendingProfileType', 'employee');
                        window.location.href = '/api/login?role=member&type=employee';
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl hover:border-emerald-400 transition-all"
                    data-testid="button-employee-login"
                  >
                    <div className="p-3 rounded-full bg-emerald-500">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right flex-1">
                      <h3 className="text-white font-bold text-lg">
                        {language === 'ar' ? (loggedInProfile === 'employee' ? 'بروفايل الموظف' : 'دخول الموظف') : (loggedInProfile === 'employee' ? 'Employee Profile' : 'Employee Login')}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {language === 'ar' ? 'عبر Google أو Apple أو الإيميل' : 'Via Google, Apple or Email'}
                      </p>
                    </div>
                  </button>

                  {/* Google Login for Employee */}
                  {loggedInProfile === null && (
                    <Button
                      onClick={() => {
                        localStorage.setItem('pendingProfileType', 'employee');
                        window.location.href = '/api/auth/google';
                      }}
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl py-2 h-auto gap-2"
                      data-testid="button-google-employee-login"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>{language === 'ar' ? 'الدخول عبر جوجل' : 'Login with Google'}</span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal - Choose between Videos or Stories */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div
            className="bg-[#1a1f2e] rounded-3xl p-6 w-full max-w-md border border-white/10"
            onClick={(e) => e.stopPropagation()}
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {language === 'ar' ? 'رفع محتوى جديد' : 'Upload New Content'}
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
                data-testid="button-close-upload-modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              {language === 'ar' ? 'اختر نوع المحتوى الذي تريد رفعه:' : 'Choose the type of content you want to upload:'}
            </p>

            <div className="space-y-4">
              {/* Videos (Reels) Option */}
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setLocation('/social?upload=reel');
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/10 border border-purple-500/30 rounded-2xl hover:border-purple-400 transition-all"
                data-testid="button-upload-video"
              >
                <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                  <Video className="h-6 w-6 text-white" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-white font-bold text-lg">
                    {language === 'ar' ? 'قسم المقاطع' : 'Videos Section'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {language === 'ar' ? 'يظهر في صفحة المقاطع للجميع' : 'Appears in the Videos page for everyone'}
                  </p>
                </div>
                <Play className="h-5 w-5 text-purple-400" />
              </button>

              {/* Stories Option */}
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setLocation('/social?upload=story');
                }}
                className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-2xl hover:border-amber-400 transition-all"
                data-testid="button-upload-story"
              >
                <div className="p-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-500">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h3 className="text-white font-bold text-lg">
                    {language === 'ar' ? 'الحالات اليومية' : 'Daily Stories'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {language === 'ar' ? 'تختفي بعد 24 ساعة' : 'Disappears after 24 hours'}
                  </p>
                </div>
                <Upload className="h-5 w-5 text-amber-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Story Viewer Modal - Snapchat Style */}
      {selectedStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white z-20 hover:bg-white/10 rounded-full p-2 transition-colors"
            onClick={closeStoryViewer}
            data-testid="button-close-story"
          >
            <X className="h-8 w-8" />
          </button>

          {/* Previous button */}
          {currentStoryIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-20 hover:bg-white/10 rounded-full p-2 transition-colors"
              onClick={(e) => { e.stopPropagation(); prevStory(); }}
              data-testid="button-prev-story"
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          {/* Next button */}
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-20 hover:bg-white/10 rounded-full p-2 transition-colors"
            onClick={(e) => { e.stopPropagation(); nextStory(); }}
            data-testid="button-next-story"
          >
            <ChevronRight className="h-10 w-10" />
          </button>

          {/* Story content */}
          <div className="w-full h-full max-w-lg mx-auto relative" onClick={nextStory}>
            {/* Progress bars for all stories */}
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
              {currentUserStories.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-white transition-all duration-300 ${idx < currentStoryIndex ? 'w-full' :
                      idx === currentStoryIndex ? 'w-full animate-[progress_5s_linear_forwards]' :
                        'w-0'
                      }`}
                  />
                </div>
              ))}
            </div>

            {/* User info header */}
            <div className="absolute top-10 left-4 right-16 flex items-center gap-3 z-10">
              <Avatar className="h-10 w-10 ring-2 ring-white/50">
                <AvatarImage src={selectedStory.author?.profileImageUrl || ''} />
                <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm">
                  {selectedStory.author?.firstName?.[0] || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-white font-medium text-sm">
                  {selectedStory.author?.firstName} {selectedStory.author?.lastName}
                </span>
                <span className="text-white/60 text-xs">
                  {currentStoryIndex + 1} / {currentUserStories.length}
                </span>
              </div>
            </div>

            {selectedStory.mediaType === 'video' ? (
              <video
                key={selectedStory.id}
                src={selectedStory.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                muted
                playsInline
                controls
                onEnded={nextStory}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                key={selectedStory.id}
                src={selectedStory.mediaUrl}
                alt={selectedStory.caption || 'Story'}
                className="w-full h-full object-contain"
              />
            )}

            {selectedStory.caption && (
              <div className="absolute bottom-8 left-4 right-4 text-center">
                <p className="text-white text-lg font-medium bg-black/50 rounded-lg px-4 py-2">
                  {selectedStory.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
