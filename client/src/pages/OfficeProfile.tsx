import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { 
  Building2, Check, Plus, X, Home, Briefcase, Play, UserCircle, User, Users, ArrowLeft, LogOut, DoorOpen
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

const officeTypes = [
  { value: "legal", labelAr: "مكتب محاماة", labelEn: "Law Firm" },
  { value: "accounting", labelAr: "مكتب محاسبة", labelEn: "Accounting Firm" },
  { value: "consulting", labelAr: "مكتب استشارات", labelEn: "Consulting Firm" },
  { value: "engineering", labelAr: "مكتب هندسي", labelEn: "Engineering Office" },
  { value: "medical", labelAr: "عيادة طبية", labelEn: "Medical Clinic" },
  { value: "real_estate", labelAr: "مكتب عقاري", labelEn: "Real Estate Office" },
  { value: "tech", labelAr: "شركة تقنية", labelEn: "Tech Company" },
  { value: "marketing", labelAr: "وكالة تسويق", labelEn: "Marketing Agency" },
  { value: "other", labelAr: "أخرى", labelEn: "Other" },
];

const defaultServices = [
  { labelAr: "استشارات قانونية", labelEn: "Legal Consulting" },
  { labelAr: "خدمات محاسبية", labelEn: "Accounting Services" },
  { labelAr: "تصميم جرافيك", labelEn: "Graphic Design" },
  { labelAr: "تطوير برمجيات", labelEn: "Software Development" },
  { labelAr: "إدارة مشاريع", labelEn: "Project Management" },
];

export default function OfficeProfile() {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [officeName, setOfficeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [officeType, setOfficeType] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [profileImage, setProfileImage] = useState("");

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('officeProfile');
    if (savedData) {
      const data = JSON.parse(savedData);
      setOfficeName(data.officeName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setDescription(data.description || "");
      setOfficeType(data.officeType || "");
      setYearsExperience(data.yearsExperience || "");
      setServices(data.services || []);
      setTwoFactorEnabled(data.twoFactorEnabled || false);
      setProfileImage(data.profileImage || "");
    }
  }, []);

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  const [, setLocation] = useLocation();

  const handleSave = () => {
    // Save to localStorage
    const profileData = {
      officeName,
      email,
      phone,
      description,
      officeType,
      yearsExperience,
      services,
      twoFactorEnabled,
      profileImage,
    };
    localStorage.setItem('officeProfile', JSON.stringify(profileData));
    localStorage.setItem('loggedInAs', 'office');
    
    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: language === 'ar' ? 'تم حفظ بيانات المكتب بنجاح' : 'Office profile saved successfully',
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
      <div className="bg-gradient-to-b from-amber-600/20 to-transparent p-6 pt-8">
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
            {language === 'ar' ? 'بروفايل المكتب' : 'Office Profile'}
          </h1>
          <div className="w-10" />
        </div>
        
        {/* Account Type Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{language === 'ar' ? 'حساب مكتب' : 'Office Account'}</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          {language === 'ar' ? 'إدارة بيانات المكتب والخدمات المقدمة' : 'Manage office data and services'}
        </p>

        {/* Dashboard Login Button */}
        <Button
          variant="outline"
          onClick={() => window.location.href = "/api/login?role=office_renter&type=office"}
          className="w-full mt-4 border-amber-500/50 text-amber-400 hover:bg-amber-500/10 rounded-xl py-3"
          data-testid="button-dashboard-login"
        >
          <DoorOpen className="h-4 w-4 ml-2" />
          {language === 'ar' ? 'دخول لوحة التحكم' : 'Enter Dashboard'}
        </Button>

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full mt-2 border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl py-3"
          data-testid="button-logout-office"
        >
          <LogOut className="h-4 w-4 ml-2" />
          {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </Button>
      </div>

      <div className="px-4 space-y-4">
        {/* Basic Account Settings */}
        <Card className="bg-[#1a1f2e] border-0 rounded-2xl overflow-hidden">
          <div className="bg-amber-600 px-4 py-3">
            <h2 className="text-white font-bold text-lg">
              {language === 'ar' ? 'إعدادات الحساب الأساسية' : 'Basic Account Settings'}
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Office" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-12 w-12 text-white" />
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                data-testid="button-update-office-photo"
              >
                {language === 'ar' ? 'تحديث الصورة' : 'Update Photo'}
              </Button>
            </div>

            {/* Office Name */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'اسم المكتب' : 'Office Name'}
              </Label>
              <Input
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل اسم المكتب' : 'Enter office name'}
                className="bg-[#0B0F19] border-white/10 text-white"
                data-testid="input-office-name"
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
                data-testid="input-office-email"
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
                data-testid="input-office-phone"
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
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  data-testid="button-change-office-password"
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
                data-testid="switch-office-2fa"
              />
            </div>
          </CardContent>
        </Card>

        {/* Office Identity Settings */}
        <Card className="bg-[#1a1f2e] border-0 rounded-2xl overflow-hidden">
          <div className="bg-amber-700 px-4 py-3">
            <h2 className="text-white font-bold text-lg">
              {language === 'ar' ? 'إعدادات هوية المكتب' : 'Office Identity Settings'}
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'نبذة تعريفية عن المكتب' : 'Office Description'}
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب نبذة عن المكتب والخدمات...' : 'Write about the office and services...'}
                className="bg-[#0B0F19] border-white/10 text-white min-h-[100px]"
                data-testid="textarea-office-description"
              />
            </div>

            {/* Office Type */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'نوع المكتب' : 'Office Type'}
              </Label>
              <Select value={officeType} onValueChange={setOfficeType}>
                <SelectTrigger className="bg-[#0B0F19] border-white/10 text-white" data-testid="select-office-type">
                  <SelectValue placeholder={language === 'ar' ? 'اختر نوع المكتب' : 'Select office type'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {officeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white">
                      {language === 'ar' ? type.labelAr : type.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Services */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'الخدمات المقدمة' : 'Services Offered'}
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {services.map((service) => (
                  <Badge 
                    key={service} 
                    className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1"
                  >
                    {service}
                    <button onClick={() => removeService(service)} className="mr-2">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف خدمة جديدة' : 'Add new service'}
                  className="bg-[#0B0F19] border-white/10 text-white flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addService()}
                  data-testid="input-new-office-service"
                />
                <Button 
                  onClick={addService}
                  size="icon"
                  className="bg-amber-500 hover:bg-amber-600"
                  data-testid="button-add-office-service"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Years of Experience */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'سنوات الخبرة' : 'Years of Experience'}
              </Label>
              <Input
                type="number"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل عدد سنوات الخبرة' : 'Enter years of experience'}
                className="bg-[#0B0F19] border-white/10 text-white"
                data-testid="input-office-experience"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 rounded-full text-lg font-bold shadow-lg mb-24"
          data-testid="button-save-office-profile"
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
              href="/profile/office"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-amber-400"
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
