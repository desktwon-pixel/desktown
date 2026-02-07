import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, Plus, X, Home, Building2, Briefcase, Play, UserCircle, Users, ArrowLeft, LogOut
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const interestAreas = [
  { value: "legal", labelAr: "خدمات قانونية", labelEn: "Legal Services" },
  { value: "accounting", labelAr: "خدمات محاسبية", labelEn: "Accounting Services" },
  { value: "consulting", labelAr: "استشارات أعمال", labelEn: "Business Consulting" },
  { value: "tech", labelAr: "خدمات تقنية", labelEn: "Tech Services" },
  { value: "marketing", labelAr: "تسويق ودعاية", labelEn: "Marketing & Advertising" },
  { value: "real_estate", labelAr: "خدمات عقارية", labelEn: "Real Estate Services" },
  { value: "medical", labelAr: "خدمات طبية", labelEn: "Medical Services" },
  { value: "other", labelAr: "أخرى", labelEn: "Other" },
];

export default function VisitorProfile() {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('visitorProfile');
    if (savedData) {
      const data = JSON.parse(savedData);
      setFullName(data.fullName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setCity(data.city || "");
      setBio(data.bio || "");
      setInterests(data.interests || []);
      setLookingFor(data.lookingFor || "");
      setTwoFactorEnabled(data.twoFactorEnabled || false);
      setNotificationsEnabled(data.notificationsEnabled !== false);
    }
  }, []);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const [, setLocation] = useLocation();

  const handleSave = () => {
    // Save to localStorage
    const profileData = {
      fullName,
      email,
      phone,
      city,
      bio,
      interests,
      lookingFor,
      twoFactorEnabled,
      notificationsEnabled,
    };
    localStorage.setItem('visitorProfile', JSON.stringify(profileData));
    localStorage.setItem('loggedInAs', 'visitor');
    
    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: language === 'ar' ? 'تم حفظ بيانات الزائر بنجاح' : 'Visitor profile saved successfully',
    });
    setLocation('/');
  };

  const handleLogout = () => {
    // Only clear login status, keep profile data saved
    localStorage.removeItem('loggedInAs');
    
    toast({
      title: language === 'ar' ? 'تم تسجيل الخروج' : 'Logged Out',
      description: language === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Successfully logged out',
    });
    // Also logout from Replit Auth
    window.location.href = '/api/logout';
  };

  return (
    <div 
      className="min-h-screen bg-[#0B0F19] pb-24"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="bg-gradient-to-b from-blue-600/20 to-transparent p-6 pt-8">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={() => window.location.href = '/'}
            data-testid="button-back-home"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-white">
            {language === 'ar' ? 'بروفايل الزائر' : 'Visitor Profile'}
          </h1>
          <div className="w-10" />
        </div>
        
        {/* Account Type Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{language === 'ar' ? 'حساب زائر' : 'Visitor Account'}</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          {language === 'ar' ? 'إدارة بياناتك الشخصية واهتماماتك' : 'Manage your personal data and interests'}
        </p>

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full mt-4 border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl py-3"
          data-testid="button-logout-visitor"
        >
          <LogOut className="h-4 w-4 ml-2" />
          {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </Button>
      </div>

      <div className="px-4 space-y-4">
        {/* Basic Account Settings */}
        <Card className="bg-[#1a1f2e] border-0 rounded-2xl overflow-hidden">
          <div className="bg-blue-600 px-4 py-3">
            <h2 className="text-white font-bold text-lg">
              {language === 'ar' ? 'البيانات الشخصية' : 'Personal Information'}
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
                  <User className="h-12 w-12 text-white" />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                data-testid="button-update-visitor-photo"
              >
                {language === 'ar' ? 'تحديث الصورة' : 'Update Photo'}
              </Button>
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                className="bg-[#0B0F19] border-white/10 text-white"
                data-testid="input-visitor-name"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل البريد الإلكتروني' : 'Enter email'}
                className="bg-[#0B0F19] border-white/10 text-white"
                data-testid="input-visitor-email"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'رقم الجوال' : 'Phone Number'}
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل رقم الجوال' : 'Enter phone number'}
                className="bg-[#0B0F19] border-white/10 text-white"
                data-testid="input-visitor-phone"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'المدينة' : 'City'}
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل مدينتك' : 'Enter your city'}
                className="bg-[#0B0F19] border-white/10 text-white"
                data-testid="input-visitor-city"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'كلمة المرور' : 'Password'}
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value="••••••••"
                  disabled
                  className="bg-[#0B0F19] border-white/10 text-white flex-1"
                />
                <Button 
                  variant="outline"
                  className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                  data-testid="button-change-visitor-password"
                >
                  {language === 'ar' ? 'تغيير' : 'Change'}
                </Button>
              </div>
            </div>

            {/* 2FA */}
            <div className="flex items-center justify-between p-3 bg-[#0B0F19] rounded-xl">
              <div>
                <Label className="text-gray-300">
                  {language === 'ar' ? 'التحقق بخطوتين' : 'Two-Factor Authentication'}
                </Label>
                <p className="text-xs text-gray-500">
                  {language === 'ar' ? 'حماية إضافية لحسابك' : 'Extra security for your account'}
                </p>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={setTwoFactorEnabled}
                data-testid="switch-visitor-2fa"
              />
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3 bg-[#0B0F19] rounded-xl">
              <div>
                <Label className="text-gray-300">
                  {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                </Label>
                <p className="text-xs text-gray-500">
                  {language === 'ar' ? 'تلقي إشعارات عن العروض الجديدة' : 'Receive notifications about new offers'}
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                data-testid="switch-visitor-notifications"
              />
            </div>
          </CardContent>
        </Card>

        {/* Interests & Preferences */}
        <Card className="bg-[#1a1f2e] border-0 rounded-2xl overflow-hidden">
          <div className="bg-blue-700 px-4 py-3">
            <h2 className="text-white font-bold text-lg">
              {language === 'ar' ? 'الاهتمامات والتفضيلات' : 'Interests & Preferences'}
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'نبذة عنك' : 'About You'}
              </Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب نبذة قصيرة عنك...' : 'Write a short bio about yourself...'}
                className="bg-[#0B0F19] border-white/10 text-white min-h-[80px]"
                data-testid="textarea-visitor-bio"
              />
            </div>

            {/* Looking For */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'ماذا تبحث عنه؟' : 'What are you looking for?'}
              </Label>
              <Select value={lookingFor} onValueChange={setLookingFor}>
                <SelectTrigger className="bg-[#0B0F19] border-white/10 text-white" data-testid="select-visitor-looking-for">
                  <SelectValue placeholder={language === 'ar' ? 'اختر ما تبحث عنه' : 'Select what you are looking for'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {interestAreas.map((area) => (
                    <SelectItem key={area.value} value={area.value} className="text-white">
                      {language === 'ar' ? area.labelAr : area.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Interests */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'اهتماماتك' : 'Your Interests'}
              </Label>
              <div className="flex flex-wrap gap-2">
                {interestAreas.map((area) => (
                  <Badge 
                    key={area.value}
                    onClick={() => toggleInterest(area.value)}
                    className={`cursor-pointer px-3 py-1 transition-all ${
                      interests.includes(area.value)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-[#0B0F19] text-gray-400 border border-white/10 hover:border-blue-500/50'
                    }`}
                    data-testid={`badge-interest-${area.value}`}
                  >
                    {interests.includes(area.value) && <span className="ml-1">✓</span>}
                    {language === 'ar' ? area.labelAr : area.labelEn}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-full text-lg font-bold shadow-lg mb-24"
          data-testid="button-save-visitor-profile"
        >
          {language === 'ar' ? 'حفظ التحديثات' : 'Save Changes'}
        </Button>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-[#0B0F19]/95 backdrop-blur-md border-t border-white/10">
          <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
            <Link 
              href="/"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors"
              data-testid="nav-bottom-home"
            >
              <Home className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <Link 
              href="/storefront"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors"
              data-testid="nav-bottom-offices"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'المكاتب' : 'Offices'}</span>
            </Link>
            <Link 
              href="/profile/visitor"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-blue-400"
              data-testid="nav-bottom-profile"
            >
              <UserCircle className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'حسابي' : 'Profile'}</span>
            </Link>
            <Link 
              href="/careers"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors"
              data-testid="nav-bottom-careers"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'الوظائف' : 'Jobs'}</span>
            </Link>
            <Link 
              href="/videos"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-gray-500 hover:text-amber-400 transition-colors"
              data-testid="nav-bottom-videos"
            >
              <Play className="h-5 w-5" />
              <span className="text-[9px] font-medium">{language === 'ar' ? 'المقاطع' : 'Reels'}</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
