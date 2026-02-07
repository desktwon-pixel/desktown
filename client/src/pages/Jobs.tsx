import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { JobPostingCard } from "@/components/JobPostingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, UserPlus, Upload, Mail, Phone, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage, translations } from "@/lib/i18n";
import type { JobPosting } from "@shared/schema";

export default function Jobs() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [registerDialogOpen, setRegisterDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    location: "Remote",
    type: "full-time",
    salary: "",
    description: "",
    requirements: "",
  });
  const [applicant, setApplicant] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
    experience: "",
    resume: "",
    coverLetter: "",
  });

  const { data: jobs = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/jobs"],
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: typeof newJob) => {
      return await apiRequest("POST", "/api/jobs", {
        title: data.title,
        department: data.department,
        location: data.location,
        type: data.type,
        salary: data.salary,
        description: data.description,
        requirements: data.requirements,
        status: "draft",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setNewJob({ title: "", department: "", location: "Remote", type: "full-time", salary: "", description: "", requirements: "" });
      setDialogOpen(false);
      toast({ title: t.jobs.jobCreated, description: t.jobs.jobCreatedDesc });
    },
    onError: () => {
      toast({ title: t.jobs.error, description: t.jobs.failedCreate, variant: "destructive" });
    },
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/jobs/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
  });

  const handleCreateJob = () => {
    if (newJob.title && newJob.department) {
      createJobMutation.mutate(newJob);
    }
  };

  const handleTogglePublish = (id: string, published: boolean) => {
    updateJobMutation.mutate({ id: parseInt(id), status: published ? "published" : "draft" });
  };

  const handleRegisterApplicant = () => {
    if (applicant.fullName && applicant.email && applicant.position) {
      toast({ 
        title: t.jobs.applicationSubmitted, 
        description: t.jobs.applicationSubmittedDesc 
      });
      setApplicant({
        fullName: "",
        email: "",
        phone: "",
        position: "",
        experience: "",
        resume: "",
        coverLetter: "",
      });
      setRegisterDialogOpen(false);
    } else {
      toast({ 
        title: t.jobs.missingInfo, 
        description: t.jobs.fillRequired, 
        variant: "destructive" 
      });
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "published" && job.status === "published") ||
      (filter === "draft" && job.status === "draft");
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const publishedCount = jobs.filter((j) => j.status === "published").length;
  const draftCount = jobs.filter((j) => j.status === "draft").length;

  const formatJob = (job: JobPosting) => {
    const daysAgo = job.createdAt ? Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    return {
      id: String(job.id),
      title: job.title,
      department: job.department,
      location: job.location || t.jobs.remote,
      type: job.type || t.jobs.fullTime,
      salary: job.salary || "Competitive",
      postedDays: daysAgo,
      isPublished: job.status === "published",
    };
  };

  const iconMargin = isRTL ? "ml-1" : "mr-1";
  const iconMargin2 = isRTL ? "ml-2" : "mr-2";
  const searchIconPosition = isRTL ? "right-3" : "left-3";
  const searchInputPadding = isRTL ? "pr-9" : "pl-9";

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">{t.jobs.title}</h1>
          <p className="text-muted-foreground mt-1">{t.jobs.subtitle}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-job">
              <Plus className={`h-4 w-4 ${iconMargin}`} />
              {t.jobs.newJobPosting}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.jobs.createJobPosting}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="title">{t.jobs.jobTitle}</Label>
                <Input
                  id="title"
                  placeholder={t.jobs.jobTitlePlaceholder}
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  data-testid="input-job-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">{t.jobs.department}</Label>
                <Select value={newJob.department} onValueChange={(v) => setNewJob({ ...newJob, department: v })}>
                  <SelectTrigger data-testid="select-department">
                    <SelectValue placeholder={t.jobs.selectDepartment} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">{t.jobs.engineering}</SelectItem>
                    <SelectItem value="Design">{t.jobs.design}</SelectItem>
                    <SelectItem value="Product">{t.jobs.product}</SelectItem>
                    <SelectItem value="Marketing">{t.jobs.marketing}</SelectItem>
                    <SelectItem value="Sales">{t.jobs.sales}</SelectItem>
                    <SelectItem value="HR">{t.jobs.hr}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">{t.jobs.location}</Label>
                  <Select value={newJob.location} onValueChange={(v) => setNewJob({ ...newJob, location: v })}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Remote">{t.jobs.remote}</SelectItem>
                      <SelectItem value="Hybrid">{t.jobs.hybrid}</SelectItem>
                      <SelectItem value="On-site">{t.jobs.onSite}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">{t.jobs.type}</Label>
                  <Select value={newJob.type} onValueChange={(v) => setNewJob({ ...newJob, type: v })}>
                    <SelectTrigger data-testid="select-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">{t.jobs.fullTime}</SelectItem>
                      <SelectItem value="part-time">{t.jobs.partTime}</SelectItem>
                      <SelectItem value="contract">{t.jobs.contract}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary">{t.jobs.salary}</Label>
                <Input
                  id="salary"
                  placeholder={t.jobs.salaryPlaceholder}
                  value={newJob.salary}
                  onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                  data-testid="input-salary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t.jobs.description}</Label>
                <Textarea
                  id="description"
                  placeholder={t.jobs.descriptionPlaceholder}
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="min-h-[100px]"
                  data-testid="textarea-job-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.jobs.cancel}</Button>
              <Button 
                onClick={handleCreateJob} 
                disabled={createJobMutation.isPending}
                data-testid="button-submit-job"
              >
                {createJobMutation.isPending ? t.jobs.creating : t.jobs.createDraft}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
          <Input
            placeholder={t.jobs.searchJobs}
            className={searchInputPadding}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-jobs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            {t.jobs.all} ({jobs.length})
          </Button>
          <Button
            variant={filter === "published" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("published")}
          >
            {t.jobs.published} ({publishedCount})
          </Button>
          <Button
            variant={filter === "draft" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("draft")}
          >
            {t.jobs.drafts} ({draftCount})
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobPostingCard
              key={job.id}
              {...formatJob(job)}
              isEditable
              onTogglePublish={handleTogglePublish}
              onEdit={(id) => console.log("Edit job:", id)}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {search ? t.jobs.noJobsMatch : `${t.jobs.noJobs} ${t.jobs.createFirst}`}
          </div>
        )}
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10" data-testid="card-job-registration">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{t.jobs.jobRegistration}</CardTitle>
              <CardDescription>{t.jobs.jobRegistrationDesc}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{publishedCount} {t.jobs.openPositions}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.jobs.submitApplicationDesc}
              </p>
            </div>
            <Dialog open={registerDialogOpen} onOpenChange={setRegisterDialogOpen}>
              <DialogTrigger asChild>
                <Button className="shrink-0" data-testid="button-open-registration">
                  <UserPlus className={`h-4 w-4 ${iconMargin2}`} />
                  {t.jobs.registerNow}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    {t.jobs.applicationForm}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t.jobs.fullName} *</Label>
                    <Input
                      id="fullName"
                      placeholder={t.jobs.fullNamePlaceholder}
                      value={applicant.fullName}
                      onChange={(e) => setApplicant({ ...applicant, fullName: e.target.value })}
                      data-testid="input-applicant-name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">{t.jobs.email} *</Label>
                      <div className="relative">
                        <Mail className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="email"
                          type="email"
                          placeholder={t.jobs.emailPlaceholder}
                          className={searchInputPadding}
                          value={applicant.email}
                          onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                          data-testid="input-applicant-email"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t.jobs.phone}</Label>
                      <div className="relative">
                        <Phone className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder={t.jobs.phonePlaceholder}
                          className={searchInputPadding}
                          value={applicant.phone}
                          onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                          data-testid="input-applicant-phone"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">{t.jobs.positionInterested} *</Label>
                    <Select 
                      value={applicant.position} 
                      onValueChange={(v) => setApplicant({ ...applicant, position: v })}
                    >
                      <SelectTrigger data-testid="select-applicant-position">
                        <SelectValue placeholder={t.jobs.selectPosition} />
                      </SelectTrigger>
                      <SelectContent>
                        {jobs.filter(j => j.status === "published").map((job) => (
                          <SelectItem key={job.id} value={job.title}>
                            {job.title} - {job.department}
                          </SelectItem>
                        ))}
                        <SelectItem value="General Application">{t.jobs.generalApplication}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">{t.jobs.yearsExperience}</Label>
                    <Select 
                      value={applicant.experience} 
                      onValueChange={(v) => setApplicant({ ...applicant, experience: v })}
                    >
                      <SelectTrigger data-testid="select-applicant-experience">
                        <SelectValue placeholder={t.jobs.selectExperience} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">{t.jobs.exp01}</SelectItem>
                        <SelectItem value="1-3">{t.jobs.exp13}</SelectItem>
                        <SelectItem value="3-5">{t.jobs.exp35}</SelectItem>
                        <SelectItem value="5-10">{t.jobs.exp510}</SelectItem>
                        <SelectItem value="10+">{t.jobs.exp10plus}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resume">{t.jobs.resumeLink}</Label>
                    <div className="relative">
                      <Upload className={`absolute ${searchIconPosition} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                      <Input
                        id="resume"
                        placeholder={t.jobs.resumePlaceholder}
                        className={searchInputPadding}
                        value={applicant.resume}
                        onChange={(e) => setApplicant({ ...applicant, resume: e.target.value })}
                        data-testid="input-applicant-resume"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coverLetter">{t.jobs.coverLetter}</Label>
                    <Textarea
                      id="coverLetter"
                      placeholder={t.jobs.coverLetterPlaceholder}
                      value={applicant.coverLetter}
                      onChange={(e) => setApplicant({ ...applicant, coverLetter: e.target.value })}
                      className="min-h-[100px]"
                      data-testid="textarea-applicant-cover"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRegisterDialogOpen(false)}>
                    {t.jobs.cancel}
                  </Button>
                  <Button onClick={handleRegisterApplicant} data-testid="button-submit-application">
                    {t.jobs.submitApplication}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
