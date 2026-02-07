import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Search,
  Star,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  Send,
  Check,
  Briefcase,
  FileText,
  Headphones,
  Package,
  Shield,
  Clock,
  Users,
  Zap,
  ChevronRight,
  Filter,
  Home,
  User,
} from "lucide-react";
import logoUrl from "@/assets/office-logo.png";
import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { OfficeService } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";

interface PublicService extends OfficeService {
  officeName: string;
  officeSlug: string | null;
}

const requestFormSchema = z.object({
  visitorName: z.string().min(2, "Name must be at least 2 characters"),
  visitorEmail: z.string().email("Please enter a valid email"),
  visitorPhone: z.string().optional(),
  message: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

function ServiceRequestDialog({ service, children }: { service: PublicService; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].storefront;
  const isRTL = language === 'ar';

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      visitorName: "",
      visitorEmail: "",
      visitorPhone: "",
      message: "",
    },
  });

  const submitRequest = useMutation({
    mutationFn: async (data: RequestFormValues) => {
      await apiRequest("POST", `/api/public/services/${service.id}/request`, data);
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: t.requestSubmitted,
        description: t.requestSubmittedDesc,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.failedSubmitRequest,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestFormValues) => {
    submitRequest.mutate(data);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      form.reset();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">{t.requestSubmitted}</DialogTitle>
              <DialogDescription className="text-center">
                {t.thankYouInterest} "{service.title}". {t.officeWillContact}
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose} className="mt-6">
              {t.close}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t.requestServiceTitle}</DialogTitle>
              <DialogDescription>
                {t.fillFormToRequest} "{service.title}" {t.fromOffice} {service.officeName}.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="visitorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.yourName}</FormLabel>
                      <FormControl>
                        <Input placeholder={t.namePlaceholder} {...field} data-testid="input-request-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visitorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.emailAddress}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t.emailPlaceholder} {...field} data-testid="input-request-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="visitorPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.phoneOptional}</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder={t.phonePlaceholder} {...field} data-testid="input-request-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t.messageOptional}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t.messagePlaceholder}
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-request-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                    {t.cancel}
                  </Button>
                  <Button type="submit" disabled={submitRequest.isPending} className="flex-1 gap-2" data-testid="button-submit-request">
                    {submitRequest.isPending ? (
                      t.submitting
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        {t.submitRequest}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ServiceCard({ service }: { service: PublicService }) {
  const { language } = useLanguage();
  const t = translations[language].storefront;
  const isRTL = language === 'ar';

  const formatPrice = (price: number | null, priceType: string | null) => {
    if (!price) return t.contactForPricing;
    if (priceType === "free") return t.free;
    
    const formattedPrice = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    
    if (priceType === "hourly") return `${formattedPrice} ${t.sar}${t.hourly}`;
    if (priceType === "negotiable") return `${t.from} ${formattedPrice} ${t.sar}`;
    return `${formattedPrice} ${t.sar}`;
  };

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <Card className="glass border-white/5 overflow-hidden hover-glow transition-all duration-300 h-full flex flex-col group" data-testid={`card-service-${service.id}`}>
      <div className="relative">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.title}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
            <Package className="h-12 w-12 text-cyan-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {service.isFeatured && (
          <Badge className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} bg-amber-500/90 border-0 gap-1`}>
            <Star className="h-3 w-3" />
            {t.featured}
          </Badge>
        )}
        <div className={`absolute bottom-3 ${isRTL ? 'right-3' : 'left-3'}`}>
          <Badge variant="outline" className="bg-black/40 backdrop-blur-sm border-white/20 text-white text-xs">
            {service.category || t.service}
          </Badge>
        </div>
      </div>
      <CardContent className="p-5 flex flex-col flex-1">
        <h3 className="font-semibold text-base mb-1 line-clamp-1">{service.title}</h3>
        <p className={`text-xs text-muted-foreground mb-3 flex items-center gap-1`}>
          <Building2 className="h-3 w-3" />
          {service.officeName}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {service.description || (language === 'ar' ? "خدمة احترافية مقدمة من مكتبنا الشريك." : "Professional service provided by our partner office.")}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          <p className="text-lg font-bold text-cyan-400">{formatPrice(service.price, service.priceType)}</p>
          <ServiceRequestDialog service={service}>
            <Button size="sm" className="gap-1" data-testid={`button-request-service-${service.id}`}>
              {t.requestService} <ArrowIcon className="h-3 w-3" />
            </Button>
          </ServiceRequestDialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Storefront() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].storefront;
  const isRTL = language === 'ar';

  const serviceCategories = [
    { id: "all", label: t.allCategories, icon: Package },
    { id: "legal", label: t.legal, icon: FileText },
    { id: "administrative", label: t.administrative, icon: Briefcase },
    { id: "support", label: t.supportCategory, icon: Headphones },
    { id: "consulting", label: t.consulting, icon: Users },
  ];

  const { data: services = [], isLoading } = useQuery<PublicService[]>({
    queryKey: ["/api/public/services"],
  });

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.officeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || service.category?.toLowerCase() === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredServices = services.filter((s) => s.isFeatured);

  const handleLogin = () => {
    localStorage.setItem("cloudoffice_redirect", "/");
    window.location.href = "/api/login";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA').format(num);
  };

  const stats = [
    { icon: Package, value: formatNumber(services.length), label: t.servicesAvailable },
    { icon: Building2, value: formatNumber(new Set(services.map((s) => s.officeId)).size), label: t.partnerOffices },
    { icon: Shield, value: "100%", label: t.verifiedPartners },
    { icon: Clock, value: "24/7", label: t.support247 },
  ];

  const monthlyFeatures = [t.listUnlimitedServices, t.receiveServiceRequests, t.customerMessaging, t.basicAnalytics];
  const annualFeatures = [t.everythingInMonthly, t.featuredListings, t.prioritySupport, t.advancedAnalytics];

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className={`flex items-center gap-3`}>
            <img src={logoUrl} alt="DeskTown" className="h-9 w-9" />
            <span className="text-lg font-bold gradient-text">DeskTown</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#services" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.services}
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t.pricing}
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button size="sm" onClick={handleLogin} className="gap-2" data-testid="button-login">
              <Zap className="h-4 w-4" />
              {t.signIn}
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 ${isRTL ? 'right-1/4' : 'left-1/4'} w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl`} />
          <div className={`absolute bottom-1/4 ${isRTL ? 'left-1/4' : 'right-1/4'} w-96 h-96 bg-teal-500/10 rounded-full blur-3xl`} />
        </div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-cyan-500/30 bg-cyan-500/10">
            <Sparkles className={`h-3 w-3 ${isRTL ? 'ml-2' : 'mr-2'} text-cyan-400`} />
            <span className="text-cyan-400 text-xs">{t.professionalServices}</span>
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {t.heroTitle1}
            <span className="block gradient-text">{t.heroTitle2}</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.heroSubtitle}
          </p>

          <div className="relative max-w-xl mx-auto mb-12">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-2xl blur-xl" />
            <div className="relative glass rounded-2xl p-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    type="search"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? 'pr-12' : 'pl-12'} h-12 bg-transparent border-0 focus-visible:ring-0 text-base`}
                    data-testid="input-search-services"
                  />
                </div>
                <Button size="lg" className="h-12 px-6 gap-2" data-testid="button-search">
                  <Search className="h-4 w-4" />
                  {t.searchButton}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 mb-3">
                  <stat.icon className="h-6 w-6 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-16">
          {featuredServices.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{t.featuredServices}</h2>
                    <p className="text-sm text-muted-foreground">{t.featuredServicesDesc}</p>
                  </div>
                </div>
              </div>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-4 pb-4`}>
                  {featuredServices.map((service) => (
                    <div key={service.id} className="w-[320px] shrink-0">
                      <ServiceCard service={service} />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </section>
          )}

          <section id="services">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{t.allServices}</h2>
                  <p className="text-sm text-muted-foreground">{t.allServicesDesc}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                {serviceCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(cat.id)}
                    className="gap-1.5 whitespace-nowrap"
                    data-testid={`button-category-${cat.id}`}
                  >
                    <cat.icon className="h-3.5 w-3.5" />
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="glass border-white/5">
                    <Skeleton className="h-40 rounded-t-lg bg-white/5" />
                    <CardContent className="p-5 space-y-3">
                      <Skeleton className="h-5 w-3/4 bg-white/5" />
                      <Skeleton className="h-4 w-1/2 bg-white/5" />
                      <Skeleton className="h-4 w-full bg-white/5" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredServices.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <Card className="glass border-white/5 p-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                <h3 className="text-lg font-semibold mb-2">{t.noServices}</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || activeCategory !== "all"
                    ? t.noServicesDesc
                    : t.servicesWillAppear}
                </p>
                {(searchQuery || activeCategory !== "all") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                  >
                    {t.clearFilters}
                  </Button>
                )}
              </Card>
            )}
          </section>

          <section id="pricing" className="py-12">
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 px-4 py-1.5 border-cyan-500/30 bg-cyan-500/10">
                <span className="text-cyan-400 text-xs">{t.forOfficePartners}</span>
              </Badge>
              <h2 className="text-3xl font-bold mb-4">{t.partnerWithUs}</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">
                {t.partnerDescription}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Card className="glass border-white/5 p-8 relative overflow-hidden">
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full -translate-y-1/2 ${isRTL ? '-translate-x-1/2' : 'translate-x-1/2'}`} />
                <h3 className="text-xl font-semibold mb-2">{t.monthly}</h3>
                <p className="text-muted-foreground text-sm mb-6">{t.perfectForStarting}</p>
                <p className="text-4xl font-bold mb-1">
                  {language === 'ar' ? '٤٩٩' : '499'} <span className="text-lg font-normal text-muted-foreground">{t.sar}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-6">{t.perMonth}</p>
                <ul className="space-y-3 mb-8">
                  {monthlyFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant="outline" onClick={handleLogin}>
                  {t.getStarted}
                </Button>
              </Card>

              <Card className="glass border-cyan-500/30 p-8 relative overflow-hidden">
                <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-32 h-32 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 rounded-full -translate-y-1/2 ${isRTL ? '-translate-x-1/2' : 'translate-x-1/2'}`} />
                <Badge className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} bg-cyan-500`}>{t.bestValue}</Badge>
                <h3 className="text-xl font-semibold mb-2">{t.annual}</h3>
                <p className="text-muted-foreground text-sm mb-6">{t.saveWithYearly}</p>
                <p className="text-4xl font-bold mb-1">
                  {language === 'ar' ? '٣٬٠٠٠' : '3,000'} <span className="text-lg font-normal text-muted-foreground">{t.sar}</span>
                </p>
                <p className="text-sm text-muted-foreground mb-6">{t.perYear}</p>
                <ul className="space-y-3 mb-8">
                  {annualFeatures.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center">
                        <Check className="h-3 w-3 text-cyan-400" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={handleLogin}>
                  {t.getStarted}
                </Button>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <Card className="glass border-white/5 p-6 max-w-2xl mx-auto">
                <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{t.advertising}</h4>
                    <p className="text-sm text-muted-foreground">{t.advertisingDesc}</p>
                  </div>
                  <div className={isRTL ? 'text-left' : 'text-right'}>
                    <p className="text-2xl font-bold text-purple-400">{language === 'ar' ? '٥٠٠' : '500'} {t.sar}</p>
                    <p className="text-xs text-muted-foreground">{t.threeDayPlacement}</p>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </div>

      <footer className="border-t border-white/5 bg-background/50 py-12 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="DeskTown" className="h-8 w-8" />
              <span className="font-semibold">DeskTown</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#services" className="hover:text-foreground transition-colors">
                {t.services}
              </a>
              <a href="#pricing" className="hover:text-foreground transition-colors">
                {t.pricing}
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Mail className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} DeskTown. {t.allRightsReserved}</p>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-white/10"
        aria-label={language === 'ar' ? 'التنقل السريع' : 'Quick Navigation'}
        data-testid="nav-bottom-bar"
      >
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            <Link 
              href="/"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-home"
            >
              <Home className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'الرئيسية' : 'Home'}</span>
            </Link>
            <Link 
              href="/storefront"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-offices"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'المكاتب' : 'Offices'}</span>
            </Link>
            <Link 
              href="/careers"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-careers"
            >
              <Briefcase className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'الوظائف' : 'Jobs'}</span>
            </Link>
            <Link 
              href="/employee-portal"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-employee"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'الموظف' : 'Employee'}</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
