import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  Search,
  Gift,
  Briefcase,
  Home,
  CreditCard,
  Mail,
  Globe,
  User,
  DoorOpen,
  Bell,
  Monitor,
} from "lucide-react";
import logoUrl from "@/assets/logo-welcome.png";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Office, User as UserType } from "@shared/schema";
import { useLanguage, type Language } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

export default function Welcome() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { language, setLanguage, isRTL } = useLanguage();

  const { data: offices = [], isError: isOfficesError } = useQuery<Office[]>({
    queryKey: ['/api/public/offices'],
  });

  const { data: allUsers = [], isError: isUsersError } = useQuery<UserType[]>({
    queryKey: ['/api/users'],
  });

  const defaultUsers = [
    { name: 'Somira', initial: 'S' },
    { name: 'Legal Hub', initial: 'L' },
    { name: 'Finance Pro', initial: 'F' },
    { name: 'Finance Pro', initial: 'F' },
    { name: 'Osamo Pro', initial: 'O' },
    { name: 'Sliamo Pro', initial: 'S' },
    { name: 'قذفورك', initial: 'ق' },
    { name: 'لايزن', initial: 'ل' },
  ];

  // Mock data fallback if DB is down/empty
  const displayOffices = (offices.length > 0 && !isOfficesError) ? offices : [
    { id: 1, name: "Tech Hub KSA", slug: "tech-hub", description: "Premium technology workspace in Riyadh", isActive: true }
  ];

  const displayUsers = (allUsers.length > 0 && !isUsersError) ? allUsers : defaultUsers.map((u, i) => ({
    id: i,
    username: u.name,
    firstName: u.name,
    profileImageUrl: null,
    email: u.name
  }));

  const featuredOffices = displayOffices.slice(0, 2);
  const featuredUsers = displayUsers.slice(0, 8);

  const quickActions = [
    { icon: User, label: language === 'ar' ? 'دخول المؤقت' : 'Temp Login', href: "/employee-portal", color: "text-amber-500" },
    user
      ? {
        icon: Home,
        label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard',
        href: user.role === 'visitor' ? "/profile/visitor" : "/dashboard",
        color: "text-blue-500"
      }
      : {
        icon: DoorOpen,
        label: language === 'ar' ? 'دخول المكتب' : 'Office Login',
        href: "/api/login?role=office_renter&type=office",
        color: "text-amber-500"
      },
  ];

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const newsItems = [
    { icon: Bell, text: language === 'ar' ? 'تعمل المنصة على أتمتة الإجراءات' : 'Platform automates procedures' },
    { icon: Monitor, text: language === 'ar' ? 'تم إضافة قاعات التدريب والبث المباشر' : 'Training rooms and live streaming added' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <div className={`min-h-screen bg-[#0B0F19] text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        className="max-w-lg mx-auto p-4 space-y-6 pb-28"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >

        {/* Header */}
        <motion.header variants={itemVariants} className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
              <img src={logoUrl} alt="DeskTown" className="relative h-10 w-10 object-contain drop-shadow-lg" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">DeskTown</span>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9 bg-white/5 backdrop-blur-sm rounded-full" data-testid="button-language-switcher">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="bg-[#1a1f2e]/95 backdrop-blur-xl border-white/10">
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('en')}
                  className={`text-white hover:bg-white/10 cursor-pointer ${language === 'en' ? 'bg-amber-500/20 text-amber-500' : ''}`}
                  data-testid="menu-item-english"
                >
                  English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleLanguageChange('ar')}
                  className={`text-white hover:bg-white/10 cursor-pointer ${language === 'ar' ? 'bg-amber-500/20 text-amber-500' : ''}`}
                  data-testid="menu-item-arabic"
                >
                  العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-9 w-9 bg-white/5 backdrop-blur-sm rounded-full">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </motion.header>

        {/* Search Section */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className={`flex items-center ${isRTL ? 'justify-end' : 'justify-start'}`}>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              {language === 'ar' ? 'البحث السريع' : 'Quick Search'}
            </h2>
          </div>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-orange-600/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative">
              <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500/70`} />
              <Input
                placeholder={language === 'ar' ? 'ابحث عن المكاتب والخدمات...' : 'Search for offices & services...'}
                className={`${isRTL ? 'pr-11 pl-4' : 'pl-11 pr-4'} h-12 bg-[#1a1f2e] border-white/5 focus:border-amber-500/50 text-white placeholder:text-gray-500 rounded-xl text-sm transition-all shadow-xl`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-welcome-search"
              />
            </div>
          </div>
        </motion.div>

        {/* User Avatars Scroll */}
        <motion.div variants={itemVariants}>
          <ScrollArea className="w-full whitespace-nowrap -mx-4 px-4 overflow-visible">
            <div className="flex gap-4 pb-4 px-1">
              {(featuredUsers.length > 0 ? featuredUsers : defaultUsers.map((u, i) => ({ id: i, firstName: u.name, profileImageUrl: null, email: u.name }))).map((u: any, index) => (
                <motion.div
                  key={u.id || index}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center gap-2 min-w-[64px]"
                >
                  <div className="relative">
                    <div className="absolute -inset-[2px] bg-gradient-to-b from-amber-500 to-transparent rounded-full opacity-50"></div>
                    <Avatar className="h-14 w-14 border-2 border-[#0B0F19] relative">
                      <AvatarImage src={u.profileImageUrl || ''} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-[#1a1f2e] to-[#2a2f3e] text-white text-sm font-medium">
                        {(u.firstName?.[0] || u.email?.[0] || defaultUsers[index]?.initial || 'U').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#0B0F19] rounded-full"></div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 truncate max-w-[70px] text-center bg-white/5 rounded-full px-2 py-0.5">
                    {u.firstName || defaultUsers[index]?.name || 'User'}
                  </span>
                </motion.div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </motion.div>

        {/* Hero Banner */}
        <motion.div variants={itemVariants} className="relative rounded-2xl overflow-hidden group shadow-2xl shadow-amber-900/10">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent z-10"></div>
          <div
            className="h-44 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-700"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(11,15,25,0.3), rgba(11,15,25,0.9)), url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80')`
            }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
              {language === 'ar' ? 'افتح مكتبك السحابي الآن' : 'Open Your Cloud Office Now'}
            </h2>
            <div className="h-1 w-12 bg-amber-500 rounded-full mb-3"></div>
            <p className="text-gray-200 text-sm font-medium bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              {language === 'ar' ? 'بدون إيجار تقليدي • وصول فوري • دعم كامل' : 'No Traditional Rent • Instant Access • Full Support'}
            </p>
          </div>
        </motion.div>

        {/* Quick Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#1a1f2e] border-white/5 text-white hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-500 transition-all rounded-full px-5 py-2 h-10 gap-2 shadow-lg"
                data-testid={`button-quick-action-${index}`}
              >
                <action.icon className={`h-4 w-4 ${action.color}`} />
                <span className="font-medium text-xs">{action.label}</span>
              </Button>
            </Link>
          ))}
        </motion.div>

        {/* Featured Ad + News Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          {/* Featured Ad Card */}
          <Card className="bg-gradient-to-br from-[#1a1f2e] to-[#161a26] border-amber-500/20 overflow-hidden relative group" data-testid="card-featured-ad">
            <div className="absolute top-0 right-0 p-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <Gift className="h-12 w-12 text-white/5 rotate-12" />
            </div>
            <CardContent className="p-5 flex flex-col items-center justify-between h-full text-center">
              <div className="p-3 rounded-2xl bg-amber-500/10 mb-2 group-hover:scale-110 transition-transform duration-300">
                <Gift className="h-6 w-6 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  {language === 'ar' ? 'إعلان مميز' : 'Featured Ad'}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {language === 'ar' ? 'عزز حضورك الرقمي واحصل على عملاء جدد' : 'Boost your digital presence & get clients'}
                </p>
              </div>
              <Button
                size="sm"
                className="w-full mt-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs"
              >
                {language === 'ar' ? 'التفاصيل' : 'Details'}
              </Button>
            </CardContent>
          </Card>

          {/* News Card */}
          <Card className="bg-[#1a1f2e] border-white/5" data-testid="card-news">
            <CardContent className="p-4 h-full flex flex-col">
              <h3 className={`text-xs font-bold mb-3 flex items-center gap-1.5 text-amber-500 uppercase tracking-wider ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Bell className="h-3 w-3" />
                <span>{language === 'ar' ? 'تحديثات' : 'Updates'}</span>
              </h3>
              <div className="space-y-3 flex-1">
                {newsItems.map((item, index) => (
                  <div key={index} className="bg-black/20 p-2 rounded-lg border border-white/5 hover:border-amber-500/30 transition-colors">
                    <p className={`text-[10px] text-gray-300 leading-relaxed ${isRTL ? 'text-right' : 'text-left'}`}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Virtual Offices Section */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-500" />
              {language === 'ar' ? 'المكاتب المميزة' : 'Featured Offices'}
            </h2>
            <Link href="/visitor/offices">
              <span className="text-xs text-amber-500 hover:text-amber-400 cursor-pointer">{language === 'ar' ? 'عرض الكل' : 'View All'}</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {featuredOffices.length > 0 ? (
              featuredOffices.map((office: any) => (
                <Link key={office.id} href={`/office/${office.slug}`}>
                  <Card className="bg-[#1a1f2e] border-white/5 overflow-hidden cursor-pointer hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all group" data-testid={`card-office-${office.id}`}>
                    <CardContent className="p-0">
                      <div className="h-16 bg-gray-800 relative">
                        {/* Placeholder for cover or pattern */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                        <div className="absolute bottom-[-16px] left-3">
                          <Avatar className="h-10 w-10 border-2 border-[#1a1f2e] shadow-sm">
                            <AvatarFallback className="bg-amber-500 text-white text-xs font-bold">
                              {(office.name || 'VO').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <div className="mt-5 p-3 pt-1">
                        <h3 className="font-bold text-white text-xs mb-1 truncate group-hover:text-amber-500 transition-colors">{office.name || 'Virtual Office'}</h3>
                        <p className="text-[10px] text-gray-400 line-clamp-2 min-h-[2.5em]">{office.description || 'Professional virtual office space.'}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] border-green-500/30 text-green-400 bg-green-500/10 px-1.5 py-0 h-4 rounded-md">
                            {language === 'ar' ? 'متاح' : 'Open'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Link href="/visitor/offices" className="col-span-2">
                <Card className="bg-[#1a1f2e] border-dashed border-2 border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group" data-testid="card-browse-offices">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all">
                      <Search className="h-5 w-5 text-gray-400 group-hover:text-amber-500" />
                    </div>
                    <h3 className="font-bold text-white text-sm mb-1">
                      {language === 'ar' ? 'استكشف المكاتب' : 'Explore Offices'}
                    </h3>
                    <p className="text-gray-500 text-xs max-w-[200px]">
                      {language === 'ar' ? 'اضغط هنا لعرض جميع المكاتب المتاحة' : 'Tap here to browse all available virtual offices'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d1117]/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom pb-safe"
        aria-label={language === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
        data-testid="nav-bottom-bar"
      >
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {[
              { href: "/welcome", icon: Home, label: { ar: 'الرئيسية', en: 'Home' }, active: true },
              { href: "/visitor/offices", icon: Building2, label: { ar: 'المكاتب', en: 'Offices' } },
              { href: "/visitor/services", icon: CreditCard, label: { ar: 'الخدمات', en: 'Services' } },
              { href: "/careers", icon: Briefcase, label: { ar: 'الوظائف', en: 'Jobs' } },
              { href: "/visitor/contact", icon: Mail, label: { ar: 'تواصل', en: 'Contact' } },
            ].map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${item.active
                  ? 'text-amber-500 bg-amber-500/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
              >
                <item.icon className="h-5 w-5" strokeWidth={item.active ? 2.5 : 2} />
                <span className="text-[9px] font-medium">{language === 'ar' ? item.label.ar : item.label.en}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
