import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Users, Plus, X, Home, Building2, Briefcase, Play, UserCircle, User, ArrowLeft, LogOut
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

const departments = [
  { value: "legal", labelAr: "القسم القانوني", labelEn: "Legal Department" },
  { value: "accounting", labelAr: "قسم المحاسبة", labelEn: "Accounting" },
  { value: "hr", labelAr: "الموارد البشرية", labelEn: "Human Resources" },
  { value: "tech", labelAr: "قسم التقنية", labelEn: "Technology" },
  { value: "marketing", labelAr: "قسم التسويق", labelEn: "Marketing" },
  { value: "sales", labelAr: "قسم المبيعات", labelEn: "Sales" },
  { value: "operations", labelAr: "قسم العمليات", labelEn: "Operations" },
  { value: "admin", labelAr: "الإدارة", labelEn: "Administration" },
];

const skills = [
  { labelAr: "إدارة المشاريع", labelEn: "Project Management" },
  { labelAr: "التحليل المالي", labelEn: "Financial Analysis" },
  { labelAr: "التسويق الرقمي", labelEn: "Digital Marketing" },
  { labelAr: "البرمجة", labelEn: "Programming" },
  { labelAr: "خدمة العملاء", labelEn: "Customer Service" },
  { labelAr: "التصميم", labelEn: "Design" },
];

export default function EmployeeProfilePage() {
  const { toast } = useToast();
  const { language } = useLanguage();
  
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [availableForProjects, setAvailableForProjects] = useState(true);

  // Load saved data on mount
  useEffect(() => {
    const savedData = localStorage.getItem('employeeProfile');
    if (savedData) {
      const data = JSON.parse(savedData);
      setFullName(data.fullName || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setJobTitle(data.jobTitle || "");
      setDepartment(data.department || "");
      setOfficeName(data.officeName || "");
      setBio(data.bio || "");
      setSelectedSkills(data.selectedSkills || []);
      setTwoFactorEnabled(data.twoFactorEnabled || false);
      setAvailableForProjects(data.availableForProjects !== false);
    }
  }, []);

  const addSkill = () => {
    if (newSkill.trim() && !selectedSkills.includes(newSkill.trim())) {
      setSelectedSkills([...selectedSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const [, setLocation] = useLocation();

  const handleSave = () => {
    // Save to localStorage
    const profileData = {
      fullName,
      email,
      phone,
      jobTitle,
      department,
      officeName,
      bio,
      selectedSkills,
      twoFactorEnabled,
      availableForProjects,
    };
    localStorage.setItem('employeeProfile', JSON.stringify(profileData));
    localStorage.setItem('loggedInAs', 'employee');
    
    toast({
      title: language === 'ar' ? 'تم الحفظ' : 'Saved',
      description: language === 'ar' ? 'تم حفظ بيانات الموظف بنجاح' : 'Employee profile saved successfully',
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
      <div className="bg-gradient-to-b from-emerald-600/20 to-transparent p-6 pt-8">
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
            {language === 'ar' ? 'بروفايل الموظف' : 'Employee Profile'}
          </h1>
          <div className="w-10" />
        </div>
        
        {/* Account Type Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="font-medium">{language === 'ar' ? 'حساب موظف' : 'Employee Account'}</span>
          </div>
        </div>

        <p className="text-gray-400 text-sm">
          {language === 'ar' ? 'إدارة بياناتك الوظيفية ومهاراتك' : 'Manage your job data and skills'}
        </p>

        {/* Employee Portal Login Button */}
        <Link href="/employee-portal">
          <Button
            variant="outline"
            className="w-full mt-4 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 rounded-xl py-3"
            data-testid="button-employee-portal-login"
          >
            <Users className="h-4 w-4 ml-2" />
            {language === 'ar' ? 'دخول القسم المؤقت' : 'Enter Department (Temp)'}
          </Button>
        </Link>

        {/* Logout Button */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full mt-2 border-red-500/50 text-red-400 hover:bg-red-500/10 rounded-xl py-3"
          data-testid="button-logout-employee"
        >
          <LogOut className="h-4 w-4 ml-2" />
          {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
        </Button>
      </div>

      <div className="px-4 space-y-4">
        {/* Basic Information */}
        <Card className="bg-[#1a1f2e] border-0 rounded-2xl overflow-hidden">
          <div className="bg-emerald-600 px-4 py-3">
            <h2 className="text-white font-bold text-lg">
              {language === 'ar' ? 'البيانات الشخصية' : 'Personal Information'}
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center overflow-hidden">
                  <Users className="h-12 w-12 text-white" />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                data-testid="button-update-employee-photo"
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
                data-testid="input-employee-name"
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
                data-testid="input-employee-email"
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
                data-testid="input-employee-phone"
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
                  className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                  data-testid="button-change-employee-password"
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
                data-testid="switch-employee-2fa"
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Information */}
        <Card className="bg-[#1a1f2e] border-0 rounded-2xl overflow-hidden">
          <div className="bg-emerald-700 px-4 py-3">
            <h2 className="text-white font-bold text-lg">
              {language === 'ar' ? 'البيانات الوظيفية' : 'Job Information'}
            </h2>
          </div>
          <CardContent className="p-4 space-y-4">
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
                data-testid="input-employee-office"
              />
            </div>

            {/* Job Title */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}
              </Label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder={language === 'ar' ? 'أدخل المسمى الوظيفي' : 'Enter job title'}
                className="bg-[#0B0F19] border-white/10 text-white"
                data-testid="input-employee-job-title"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'القسم' : 'Department'}
              </Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="bg-[#0B0F19] border-white/10 text-white" data-testid="select-employee-department">
                  <SelectValue placeholder={language === 'ar' ? 'اختر القسم' : 'Select department'} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1f2e] border-white/10">
                  {departments.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value} className="text-white">
                      {language === 'ar' ? dept.labelAr : dept.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'نبذة مهنية' : 'Professional Bio'}
              </Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب نبذة عن خبراتك المهنية...' : 'Write about your professional experience...'}
                className="bg-[#0B0F19] border-white/10 text-white min-h-[80px]"
                data-testid="textarea-employee-bio"
              />
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="text-gray-300">
                {language === 'ar' ? 'المهارات' : 'Skills'}
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSkills.map((skill) => (
                  <Badge 
                    key={skill} 
                    className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="mr-2">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder={language === 'ar' ? 'أضف مهارة جديدة' : 'Add new skill'}
                  className="bg-[#0B0F19] border-white/10 text-white flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  data-testid="input-new-employee-skill"
                />
                <Button 
                  onClick={addSkill}
                  size="icon"
                  className="bg-emerald-500 hover:bg-emerald-600"
                  data-testid="button-add-employee-skill"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Available for Projects */}
            <div className="flex items-center justify-between p-3 bg-[#0B0F19] rounded-xl">
              <div>
                <Label className="text-gray-300">
                  {language === 'ar' ? 'متاح للمشاريع' : 'Available for Projects'}
                </Label>
                <p className="text-xs text-gray-500">
                  {language === 'ar' ? 'أظهر للمكاتب أنك متاح للعمل' : 'Show offices you are available for work'}
                </p>
              </div>
              <Switch
                checked={availableForProjects}
                onCheckedChange={setAvailableForProjects}
                data-testid="switch-employee-available"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-full text-lg font-bold shadow-lg mb-24"
          data-testid="button-save-employee-profile"
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
              href="/profile/employee"
              className="flex flex-col items-center gap-0.5 p-2 min-w-[50px] text-emerald-400"
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
