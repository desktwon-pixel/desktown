import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Clock,
  MapPin,
  Search,
  Send,
  Check,
  DollarSign,
  Users,
  Mail,
  Phone,
  Upload,
  FileText,
  Sparkles,
  Home,
  User,
} from "lucide-react";
import logoUrl from "@/assets/office-logo.png";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, translations } from "@/lib/i18n";
import type { JobPosting } from "@shared/schema";

function JobApplicationDialog({ job, children, t, language }: { job: JobPosting; children: React.ReactNode; t: typeof translations.en.careers; language: string }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const [applicant, setApplicant] = useState({
    fullName: "",
    email: "",
    phone: "",
    experience: "",
    resume: "",
    coverLetter: "",
  });
  const isRTL = language === 'ar';

  const submitApplication = useMutation({
    mutationFn: async (data: typeof applicant) => {
      await apiRequest("POST", `/api/public/jobs/${job.id}/apply`, {
        ...data,
        jobTitle: job.title,
        department: job.department,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: t.applicationSubmitted,
        description: t.applicationSubmittedDesc,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.failedSubmit,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (applicant.fullName && applicant.email) {
      submitApplication.mutate(applicant);
    } else {
      toast({
        title: t.missingInfo,
        description: t.fillNameEmail,
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setSubmitted(false);
      setApplicant({
        fullName: "",
        email: "",
        phone: "",
        experience: "",
        resume: "",
        coverLetter: "",
      });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">{t.applicationSubmitted}</DialogTitle>
              <DialogDescription className="text-center">
                {t.thankYouApply.replace("{title}", job.title)}
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose} className="mt-6">
              {t.close}
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Briefcase className="h-5 w-5 text-primary" />
                {t.applyFor} {job.title}
              </DialogTitle>
              <DialogDescription>
                {job.department} · {job.location || t.remote}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t.fullName} *</Label>
                <Input
                  id="fullName"
                  placeholder={t.fullNamePlaceholder}
                  value={applicant.fullName}
                  onChange={(e) => setApplicant({ ...applicant, fullName: e.target.value })}
                  data-testid="input-career-applicant-name"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.emailAddress} *</Label>
                  <div className="relative">
                    <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t.emailPlaceholder}
                      className={isRTL ? 'pr-9' : 'pl-9'}
                      value={applicant.email}
                      onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                      data-testid="input-career-applicant-email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.phoneNumber}</Label>
                  <div className="relative">
                    <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t.phonePlaceholder}
                      className={isRTL ? 'pr-9' : 'pl-9'}
                      value={applicant.phone}
                      onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                      data-testid="input-career-applicant-phone"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">{t.yearsExperience}</Label>
                <Select 
                  value={applicant.experience} 
                  onValueChange={(v) => setApplicant({ ...applicant, experience: v })}
                >
                  <SelectTrigger data-testid="select-career-applicant-experience">
                    <SelectValue placeholder={t.selectExperience} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">{t.exp01}</SelectItem>
                    <SelectItem value="1-3">{t.exp13}</SelectItem>
                    <SelectItem value="3-5">{t.exp35}</SelectItem>
                    <SelectItem value="5-10">{t.exp510}</SelectItem>
                    <SelectItem value="10+">{t.exp10plus}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume">{t.resumeLink}</Label>
                <div className="relative">
                  <Upload className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                  <Input
                    id="resume"
                    placeholder={t.resumePlaceholder}
                    className={isRTL ? 'pr-9' : 'pl-9'}
                    value={applicant.resume}
                    onChange={(e) => setApplicant({ ...applicant, resume: e.target.value })}
                    data-testid="input-career-applicant-resume"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverLetter">{t.coverLetter}</Label>
                <Textarea
                  id="coverLetter"
                  placeholder={t.coverLetterPlaceholder}
                  value={applicant.coverLetter}
                  onChange={(e) => setApplicant({ ...applicant, coverLetter: e.target.value })}
                  className="min-h-[100px]"
                  data-testid="textarea-career-applicant-cover"
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t.cancel}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={submitApplication.isPending}
                className="gap-2"
                data-testid="button-submit-career-application"
              >
                {submitApplication.isPending ? (
                  t.submitting
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    {t.submitApplication}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function JobCard({ job, t, language }: { job: JobPosting; t: typeof translations.en.careers; language: string }) {
  const isRTL = language === 'ar';
  const daysAgo = job.createdAt 
    ? Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)) 
    : 0;

  const jobTypeLabels: Record<string, string> = {
    "full-time": t.fullTime,
    "part-time": t.partTime,
    "contract": t.contract,
    "internship": t.internship,
  };

  const formatPostedDate = () => {
    if (daysAgo === 0) return t.postedToday;
    return t.postedDaysAgo.replace("{days}", String(daysAgo));
  };

  return (
    <Card className="hover-elevate transition-all duration-300" data-testid={`card-career-job-${job.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-semibold text-lg">{job.title}</h3>
              <Badge variant="secondary" className="text-xs">
                {jobTypeLabels[job.type || "full-time"] || job.type}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {job.department}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location || t.remote}
              </span>
              {job.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {job.salary}
                </span>
              )}
            </div>
            {job.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {job.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatPostedDate()}
              </span>
              <JobApplicationDialog job={job} t={t} language={language}>
                <Button size="sm" className="gap-1" data-testid={`button-apply-job-${job.id}`}>
                  {t.applyNow}
                  <Send className="h-3 w-3" />
                </Button>
              </JobApplicationDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Careers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language].careers;
  const isRTL = language === 'ar';

  const { data: jobs = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/public/jobs"],
  });

  const publishedJobs = jobs.filter(job => job.status === "published");

  const filteredJobs = publishedJobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "remote") return matchesSearch && job.location?.toLowerCase().includes("remote");
    return matchesSearch && job.type === activeFilter;
  });

  const departments = Array.from(new Set(publishedJobs.map(j => j.department).filter(Boolean)));

  const filterOptions = [
    { id: "all", label: t.allJobs },
    { id: "full-time", label: t.fullTime },
    { id: "part-time", label: t.partTime },
    { id: "contract", label: t.contract },
    { id: "remote", label: t.remote },
  ];

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <BackArrow className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="DeskTown" className="h-8 w-8 object-contain" />
              <span className="font-semibold text-lg">{t.headerTitle}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 ${isRTL ? 'right-1/4' : 'left-1/4'} w-96 h-96 bg-orange-500/10 rounded-full blur-3xl`} />
          <div className={`absolute bottom-1/4 ${isRTL ? 'left-1/4' : 'right-1/4'} w-96 h-96 bg-primary/10 rounded-full blur-3xl`} />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 border-orange-500/30 bg-orange-500/10">
            <Sparkles className={`h-3 w-3 ${isRTL ? 'ml-2' : 'mr-2'} text-orange-400`} />
            <span className="text-orange-400 text-xs">{t.joinPartners}</span>
          </Badge>
          
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            {t.findNext}
            <span className="block text-primary">{t.careerOpportunity}</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.subtitle}
          </p>

          <div className="max-w-2xl mx-auto relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-primary/20 rounded-2xl blur-xl" />
            <div className="relative bg-card rounded-2xl p-2 border">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`} />
                  <Input
                    type="search"
                    placeholder={t.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${isRTL ? 'pr-12' : 'pl-12'} h-12 bg-transparent border-0 focus-visible:ring-0 text-base`}
                    data-testid="input-search-careers"
                  />
                </div>
                <Button size="lg" className="h-12 px-6 gap-2" data-testid="button-search-careers">
                  <Search className="h-4 w-4" />
                  {t.search}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-8 mt-10">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{publishedJobs.length}</p>
              <p className="text-sm text-muted-foreground">{t.openPositions}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold">{departments.length}</p>
              <p className="text-sm text-muted-foreground">{t.departments}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-center">
              <p className="text-3xl font-bold">100%</p>
              <p className="text-sm text-muted-foreground">{t.verified}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-16 max-w-5xl">
        <ScrollArea className="w-full whitespace-nowrap mb-6">
          <div className="flex gap-2 pb-2">
            {filterOptions.map((option) => (
              <Button
                key={option.id}
                variant={activeFilter === option.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(option.id)}
                className="rounded-full"
                data-testid={`filter-career-${option.id}`}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => <JobCard key={job.id} job={job} t={t} language={language} />)
          ) : (
            <Card className="p-12 text-center">
              <Briefcase className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold mb-2">{t.noJobsFound}</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || activeFilter !== "all"
                  ? t.adjustSearch
                  : t.checkBack}
              </p>
              {(searchQuery || activeFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                >
                  {t.clearFilters}
                </Button>
              )}
            </Card>
          )}
        </div>

      </main>

      <footer className="border-t bg-muted/50 py-8 pb-24">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} DeskTown. {t.allRightsReserved}</p>
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
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-gray-400 hover:text-amber-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
              data-testid="nav-bottom-offices"
            >
              <Building2 className="h-5 w-5" />
              <span className="text-[10px] font-medium">{language === 'ar' ? 'المكاتب' : 'Offices'}</span>
            </Link>
            <Link 
              href="/careers"
              className="flex flex-col items-center gap-1 p-2 min-w-[60px] text-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg"
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
