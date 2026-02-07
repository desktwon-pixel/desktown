import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage, translations } from "@/lib/i18n";
import { 
  Check, 
  CreditCard, 
  Smartphone, 
  Building2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Shield,
  Zap,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Calendar,
  Briefcase,
  Monitor,
  Mail,
  Video,
  Bell,
  Globe,
  Headphones,
  Lock,
  Palette
} from "lucide-react";
import { SiApplepay, SiVisa } from "react-icons/si";
import type { Subscription } from "@shared/schema";

const ADD_ON_SERVICES = [
  { key: "advanced_analytics", nameKey: "advancedAnalytics", icon: BarChart3, descKey: "advancedAnalyticsDesc" },
  { key: "priority_support", nameKey: "prioritySupport", icon: Zap, descKey: "prioritySupportDesc" },
  { key: "team_collaboration", nameKey: "teamCollaboration", icon: Users, descKey: "teamCollaborationDesc" },
  { key: "document_management", nameKey: "documentManagement", icon: FileText, descKey: "documentManagementDesc" },
  { key: "video_conferencing", nameKey: "videoConferencing", icon: MessageSquare, descKey: "videoConferencingDesc" },
  { key: "calendar_sync", nameKey: "calendarIntegration", icon: Calendar, descKey: "calendarIntegrationDesc" },
  { key: "hr_tools", nameKey: "hrManagement", icon: Briefcase, descKey: "hrManagementDesc" },
];

const PAYMENT_METHODS = [
  { key: "apple_pay", nameKey: "applePay", icon: SiApplepay, descKey: "applePayDesc" },
  { key: "visa", nameKey: "visa", icon: SiVisa, descKey: "visaDesc" },
  { key: "credit_card", nameKey: "creditCard", icon: CreditCard, descKey: "creditCardDesc" },
];

export default function Subscription() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>("apple_pay");
  const [step, setStep] = useState<1 | 2>(1);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPricing = () => ({
    monthly: {
      base: 499,
      addOn: 50,
      label: t.subscription?.monthly || "Monthly",
      period: t.subscription?.perMonth || "/month",
      savings: null
    },
    yearly: {
      base: 3000,
      addOn: 200,
      label: t.subscription?.yearly || "Yearly",
      period: t.subscription?.perYear || "/year",
      savings: `${t.subscription?.save || "Save"} 2,988 SAR`
    }
  });

  const getAddOnServiceName = (nameKey: string) => {
    const names: Record<string, { en: string; ar: string }> = {
      advancedAnalytics: { en: "Advanced Analytics", ar: "تحليلات متقدمة" },
      prioritySupport: { en: "Priority Support", ar: "دعم أولوي" },
      teamCollaboration: { en: "Team Collaboration Tools", ar: "أدوات تعاون الفريق" },
      documentManagement: { en: "Document Management", ar: "إدارة المستندات" },
      videoConferencing: { en: "Video Conferencing", ar: "مؤتمرات الفيديو" },
      calendarIntegration: { en: "Calendar Integration", ar: "تكامل التقويم" },
      hrManagement: { en: "HR Management", ar: "إدارة الموارد البشرية" },
    };
    return names[nameKey]?.[language] || names[nameKey]?.en || nameKey;
  };

  const getAddOnServiceDesc = (descKey: string) => {
    const descs: Record<string, { en: string; ar: string }> = {
      advancedAnalyticsDesc: { en: "Detailed reports and insights", ar: "تقارير ورؤى تفصيلية" },
      prioritySupportDesc: { en: "24/7 dedicated support team", ar: "فريق دعم مخصص على مدار الساعة" },
      teamCollaborationDesc: { en: "Enhanced team features", ar: "ميزات فريق محسنة" },
      documentManagementDesc: { en: "Secure file storage", ar: "تخزين ملفات آمن" },
      videoConferencingDesc: { en: "HD video meetings", ar: "اجتماعات فيديو عالية الدقة" },
      calendarIntegrationDesc: { en: "Sync with external calendars", ar: "مزامنة مع التقويمات الخارجية" },
      hrManagementDesc: { en: "Employee management tools", ar: "أدوات إدارة الموظفين" },
    };
    return descs[descKey]?.[language] || descs[descKey]?.en || descKey;
  };

  const getPaymentMethodName = (nameKey: string) => {
    const names: Record<string, { en: string; ar: string }> = {
      applePay: { en: "Apple Pay", ar: "Apple Pay" },
      visa: { en: "Visa", ar: "فيزا" },
      creditCard: { en: "Credit Card", ar: "بطاقة ائتمان" },
    };
    return names[nameKey]?.[language] || names[nameKey]?.en || nameKey;
  };

  const getPaymentMethodDesc = (descKey: string) => {
    const descs: Record<string, { en: string; ar: string }> = {
      applePayDesc: { en: "Fast and secure", ar: "سريع وآمن" },
      visaDesc: { en: "Credit/Debit card", ar: "بطاقة ائتمان/خصم" },
      creditCardDesc: { en: "Mastercard, Mada, etc.", ar: "ماستركارد، مدى، إلخ." },
    };
    return descs[descKey]?.[language] || descs[descKey]?.en || descKey;
  };

  const { data: existingSubscription, isLoading: checkingSubscription } = useQuery<Subscription | null>({
    queryKey: ['/api/subscriptions/active'],
  });

  const createSubscription = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/subscriptions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      toast({
        title: language === 'ar' ? "تم تفعيل الاشتراك" : "Subscription Activated",
        description: language === 'ar' 
          ? "اشتراك مكتبك نشط الآن. جاري إعداد مساحة العمل..."
          : "Your office subscription is now active. Setting up your workspace...",
      });
      setTimeout(() => {
        setLocation("/departments");
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: language === 'ar' ? "فشل الاشتراك" : "Subscription Failed",
        description: error.message || (language === 'ar' 
          ? "فشل معالجة الاشتراك. يرجى المحاولة مرة أخرى."
          : "Failed to process subscription. Please try again."),
        variant: "destructive",
      });
    },
  });

  const pricing = getPricing()[billingCycle];
  const basePrice = pricing.base;
  const addOnPrice = selectedAddOns.length * (billingCycle === "monthly" ? 50 : 200);
  const totalPrice = basePrice + addOnPrice;

  const toggleAddOn = (key: string) => {
    setSelectedAddOns(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const handleSubscribe = () => {
    createSubscription.mutate({
      billingCycle,
      basePrice,
      addOnCount: selectedAddOns.length,
      addOnPrice,
      totalPrice,
      currency: "SAR",
      paymentMethod,
      addOnServices: selectedAddOns,
    });
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const iconMarginStart = isRTL ? "mr-2" : "ml-2";
  const iconMarginEnd = isRTL ? "ml-2" : "mr-2";

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (existingSubscription) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>{t.subscription?.activeSubscription || "Already Subscribed"}</CardTitle>
            <CardDescription>
              {t.subscription?.alreadySubscribed || "You already have an active subscription. Continue to your workspace."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => setLocation("/departments")} data-testid="button-go-to-departments">
              {language === 'ar' ? "انتقل إلى الأقسام" : "Go to Departments"}
              <ArrowIcon className={`h-4 w-4 ${iconMarginStart}`} />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="font-semibold text-xl">DeskTown</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              {language === 'ar' ? "دفع آمن" : "Secure Checkout"}
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            {t.subscription?.title || "Choose Your Subscription Plan"}
          </h1>
          <p className="text-muted-foreground">
            {t.subscription?.subtitle || "Select a billing cycle and customize your office with add-on services"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-medium">1</span>
            <span className="text-sm font-medium">{t.subscription?.step1 || "Plan Selection"}</span>
          </div>
          <div className="w-8 h-0.5 bg-muted" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            <span className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center text-sm font-medium">2</span>
            <span className="text-sm font-medium">{t.subscription?.step2 || "Payment"}</span>
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? "اختر دورة الفوترة" : "Select Billing Cycle"}
                  </CardTitle>
                  <CardDescription>
                    {language === 'ar' ? "اختر عدد مرات الفوترة" : "Choose how often you'd like to be billed"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={billingCycle} 
                    onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className="relative">
                      <RadioGroupItem value="monthly" id="monthly" className="peer sr-only" />
                      <Label 
                        htmlFor="monthly" 
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        data-testid="radio-monthly"
                      >
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatCurrency(499)} <span className="text-sm font-normal text-muted-foreground">SAR</span></p>
                          <p className="text-muted-foreground text-sm">{t.subscription?.perMonth || "per month"}</p>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="relative">
                      <RadioGroupItem value="yearly" id="yearly" className="peer sr-only" />
                      <Label 
                        htmlFor="yearly" 
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        data-testid="radio-yearly"
                      >
                        <Badge className={`absolute -top-2 ${isRTL ? 'left-2' : 'right-2'}`} variant="default">
                          {language === 'ar' ? "أفضل قيمة" : "Best Value"}
                        </Badge>
                        <div className="text-center">
                          <p className="text-2xl font-bold">{formatCurrency(3000)} <span className="text-sm font-normal text-muted-foreground">SAR</span></p>
                          <p className="text-muted-foreground text-sm">{t.subscription?.perYear || "per year"}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            {t.subscription?.save || "Save"} {formatCurrency(2988)} SAR
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.subscription?.addOns || "Add-On Services"}</CardTitle>
                  <CardDescription>
                    {language === 'ar' ? "عزز مكتبك بميزات إضافية" : "Enhance your office with additional features"}
                    <Badge variant="secondary" className={isRTL ? "mr-2" : "ml-2"}>
                      {billingCycle === "monthly" 
                        ? (language === 'ar' ? "50 ريال/شهر لكل خدمة" : "50 SAR/month each")
                        : (language === 'ar' ? "200 ريال/سنة لكل خدمة" : "200 SAR/year each")}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ADD_ON_SERVICES.map((service) => (
                      <div
                        key={service.key}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover-elevate transition-colors ${
                          selectedAddOns.includes(service.key) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border'
                        }`}
                        onClick={() => toggleAddOn(service.key)}
                        data-testid={`addon-${service.key}`}
                      >
                        <Checkbox 
                          checked={selectedAddOns.includes(service.key)}
                          onCheckedChange={() => toggleAddOn(service.key)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <service.icon className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">{getAddOnServiceName(service.nameKey)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{getAddOnServiceDesc(service.descKey)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? "ملخص الطلب" : "Order Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {t.subscription?.basePlan || "Base Plan"} ({pricing.label})
                    </span>
                    <span className="font-medium">{formatCurrency(basePrice)} SAR</span>
                  </div>
                  
                  {selectedAddOns.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {t.subscription?.addOns || "Add-ons"} ({selectedAddOns.length})
                      </span>
                      <span className="font-medium">{formatCurrency(addOnPrice)} SAR</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t.subscription?.totalPrice || "Total"}</span>
                    <div className={isRTL ? "text-left" : "text-right"}>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)} SAR</p>
                      <p className="text-xs text-muted-foreground">{pricing.period}</p>
                    </div>
                  </div>

                  {billingCycle === "yearly" && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {language === 'ar' 
                          ? `أنت توفر ${formatCurrency(2988)} ريال مع الفوترة السنوية`
                          : `You're saving ${formatCurrency(2988)} SAR with yearly billing`}
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => setStep(2)}
                    data-testid="button-continue-to-payment"
                  >
                    {t.subscription?.continue || "Continue to Payment"}
                    <ArrowIcon className={`h-4 w-4 ${iconMarginStart}`} />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.subscription?.paymentMethod || "Select Payment Method"}</CardTitle>
                  <CardDescription>
                    {language === 'ar' ? "اختر طريقة الدفع" : "Choose how you'd like to pay"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={setPaymentMethod}
                    className="space-y-3"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <div key={method.key} className="relative">
                        <RadioGroupItem value={method.key} id={method.key} className="peer sr-only" />
                        <Label 
                          htmlFor={method.key} 
                          className="flex items-center gap-4 rounded-lg border-2 border-muted bg-popover p-4 hover-elevate cursor-pointer peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                          data-testid={`payment-${method.key}`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <method.icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{getPaymentMethodName(method.nameKey)}</p>
                            <p className="text-sm text-muted-foreground">{getPaymentMethodDesc(method.descKey)}</p>
                          </div>
                          {paymentMethod === method.key && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>
                        {language === 'ar' 
                          ? "معلومات الدفع الخاصة بك مشفرة وآمنة"
                          : "Your payment information is encrypted and secure"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setStep(1)}
                  data-testid="button-back-to-plan"
                >
                  {t.subscription?.back || "Back to Plan Selection"}
                </Button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {language === 'ar' ? "ملخص الطلب" : "Order Summary"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {t.subscription?.basePlan || "Base Plan"} ({pricing.label})
                    </span>
                    <span className="font-medium">{formatCurrency(basePrice)} SAR</span>
                  </div>
                  
                  {selectedAddOns.length > 0 && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">
                          {t.subscription?.addOns || "Add-ons"} ({selectedAddOns.length})
                        </span>
                        <span className="font-medium">{formatCurrency(addOnPrice)} SAR</span>
                      </div>
                      <div className={isRTL ? "pr-4 space-y-1" : "pl-4 space-y-1"}>
                        {selectedAddOns.map(key => {
                          const service = ADD_ON_SERVICES.find(s => s.key === key);
                          return (
                            <p key={key} className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="h-3 w-3 text-green-500" />
                              {service ? getAddOnServiceName(service.nameKey) : key}
                            </p>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{t.subscription?.totalPrice || "Total"}</span>
                    <div className={isRTL ? "text-left" : "text-right"}>
                      <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)} SAR</p>
                      <p className="text-xs text-muted-foreground">{pricing.period}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{language === 'ar' ? "الدفع عبر:" : "Payment via:"}</span>
                    <Badge variant="secondary">
                      {PAYMENT_METHODS.find(m => m.key === paymentMethod) 
                        ? getPaymentMethodName(PAYMENT_METHODS.find(m => m.key === paymentMethod)!.nameKey)
                        : paymentMethod}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleSubscribe}
                    disabled={createSubscription.isPending}
                    data-testid="button-subscribe"
                  >
                    {createSubscription.isPending ? (
                      <>
                        <Loader2 className={`h-4 w-4 animate-spin ${iconMarginEnd}`} />
                        {t.subscription?.processing || "Processing..."}
                      </>
                    ) : (
                      <>
                        {t.subscription?.subscribe || "Subscribe Now"}
                        <ArrowIcon className={`h-4 w-4 ${iconMarginStart}`} />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}

        {/* Office Features Section */}
        <section className="mt-16 mb-8" data-testid="section-office-features">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold mb-2" data-testid="text-features-title">
              {t.subscription?.officeFeatures || "Your Virtual Office Features"}
            </h2>
            <p className="text-muted-foreground" data-testid="text-features-subtitle">
              {t.subscription?.officeFeaturesSubtitle || "Subscribe now and get all these features for your office"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Building2, titleKey: "featureVirtualOffice", descKey: "featureVirtualOfficeDesc" },
              { icon: Monitor, titleKey: "featureDashboard", descKey: "featureDashboardDesc" },
              { icon: Users, titleKey: "featureTeam", descKey: "featureTeamDesc" },
              { icon: FileText, titleKey: "featureTasks", descKey: "featureTasksDesc" },
              { icon: Mail, titleKey: "featureMail", descKey: "featureMailDesc" },
              { icon: MessageSquare, titleKey: "featureChat", descKey: "featureChatDesc" },
              { icon: Video, titleKey: "featureVideo", descKey: "featureVideoDesc" },
              { icon: Bell, titleKey: "featureNotifications", descKey: "featureNotificationsDesc" },
              { icon: Globe, titleKey: "featureStorefront", descKey: "featureStorefrontDesc" },
              { icon: Headphones, titleKey: "featureSupport", descKey: "featureSupportDesc" },
              { icon: Lock, titleKey: "featureAccess", descKey: "featureAccessDesc" },
              { icon: Palette, titleKey: "featureCustomize", descKey: "featureCustomizeDesc" }
            ].map((feature, index) => (
              <Card key={index} className="hover-elevate" data-testid={`card-feature-${index}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm" data-testid={`text-feature-title-${index}`}>
                        {(t.subscription as any)?.[feature.titleKey] || feature.titleKey}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-feature-desc-${index}`}>
                        {(t.subscription as any)?.[feature.descKey] || feature.descKey}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20" data-testid="card-subscribe-first">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <h3 className="font-semibold text-lg" data-testid="text-subscribe-first-title">
                    {t.subscription?.subscribeFirst || "Subscribe First, Then Create Your Office"}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm" data-testid="text-subscribe-first-desc">
                  {t.subscription?.subscribeFirstDesc || "After activating your subscription, you'll be able to create your virtual office, add your services, and fully manage your team."}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
