import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Star,
  ExternalLink,
  Settings,
  Globe,
  MessageCircle,
  Upload,
  Loader2,
  ImageIcon,
  FolderTree,
  Layers,
  ChevronDown,
  ChevronRight,
  Video,
  Phone,
  PhoneOff,
  Send,
  User,
  Clock,
  CheckCheck,
  RefreshCw,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, translations } from "@/lib/i18n";
import type { Office, OfficeService, InsertOffice, InsertOfficeService, CompanyDepartment, CompanySection, InsertCompanyDepartment, InsertCompanySection, OfficeMessage, VideoCall } from "@shared/schema";

async function uploadImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  
  const response = await fetch('/api/upload/media', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileType: fileExt }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }
  
  const { uploadUrl, objectPath } = await response.json();
  
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  
  if (!uploadResponse.ok) {
    throw new Error('Failed to upload file');
  }
  
  return objectPath;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function formatPrice(price: number, language: string): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function OfficeForm({
  office,
  onSuccess,
  onCancel,
}: {
  office?: Office;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!office?.slug);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: office?.name || '',
    slug: office?.slug || '',
    description: office?.description || '',
    logoUrl: office?.logoUrl || '',
    coverUrl: office?.coverUrl || '',
    location: office?.location || '',
    category: office?.category || 'general',
    contactEmail: office?.contactEmail || '',
    contactPhone: office?.contactPhone || '',
    workingHours: office?.workingHours || '',
    isPublished: office?.isPublished || false,
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: language === 'ar' ? 'يرجى اختيار ملف صورة' : 'Please select an image file', variant: 'destructive' });
      return;
    }
    
    setLogoUploading(true);
    try {
      const objectPath = await uploadImage(file);
      setFormData(prev => ({ ...prev, logoUrl: objectPath }));
      toast({ title: language === 'ar' ? 'تم رفع الشعار بنجاح' : 'Logo uploaded successfully' });
    } catch (error) {
      toast({ title: language === 'ar' ? 'فشل رفع الشعار' : 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: language === 'ar' ? 'يرجى اختيار ملف صورة' : 'Please select an image file', variant: 'destructive' });
      return;
    }
    
    setCoverUploading(true);
    try {
      const objectPath = await uploadImage(file);
      setFormData(prev => ({ ...prev, coverUrl: objectPath }));
      toast({ title: language === 'ar' ? 'تم رفع صورة الغلاف بنجاح' : 'Cover image uploaded successfully' });
    } catch (error) {
      toast({ title: language === 'ar' ? 'فشل رفع صورة الغلاف' : 'Failed to upload cover image', variant: 'destructive' });
    } finally {
      setCoverUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertOffice>) => {
      return await apiRequest('POST', '/api/offices', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices'] });
      toast({ title: t.officeManagement?.officeCreated || 'Office created successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: t.officeManagement?.failedCreate || 'Failed to create office', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertOffice>) => {
      return await apiRequest('PATCH', `/api/offices/${office!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices'] });
      toast({ title: t.officeManagement?.officeUpdated || 'Office updated successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: t.officeManagement?.failedUpdate || 'Failed to update office', description: error.message, variant: 'destructive' });
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t.officeManagement?.officeNameRequired || 'Office name is required';
    }
    
    const finalSlug = formData.slug || generateSlug(formData.name);
    if (!finalSlug || finalSlug.length < 3) {
      newErrors.slug = t.officeManagement?.slugMinLength || 'Slug must be at least 3 characters';
    } else if (!/^[a-z0-9-]+$/.test(finalSlug)) {
      newErrors.slug = t.officeManagement?.slugInvalid || 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const data = {
      ...formData,
      slug: formData.slug || generateSlug(formData.name),
    };
    
    if (office) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  const isFormValid = formData.name.trim().length > 0;

  const handleNameChange = (name: string) => {
    setErrors((prev) => ({ ...prev, name: '', slug: '' }));
    setFormData((prev) => ({
      ...prev,
      name,
      slug: slugManuallyEdited ? prev.slug : generateSlug(name),
    }));
  };

  const handleSlugChange = (slug: string) => {
    setErrors((prev) => ({ ...prev, slug: '' }));
    setSlugManuallyEdited(true);
    setFormData((prev) => ({ ...prev, slug }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t.officeManagement?.officeName || "Office Name"} *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="My Virtual Office"
            className={errors.name ? 'border-destructive' : ''}
            data-testid="input-office-name"
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">{t.officeManagement?.urlSlug || "URL Slug"}</Label>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="my-virtual-office"
            className={errors.slug ? 'border-destructive' : ''}
            data-testid="input-office-slug"
          />
          <p className="text-xs text-muted-foreground">
            {t.officeManagement?.slugHint || "Auto-generated from name. Only lowercase letters, numbers, and hyphens allowed."}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.officeManagement?.visitorsAccessAt || "Visitors will access at:"} /office/{formData.slug || generateSlug(formData.name) || 'your-slug'}
          </p>
          {errors.slug && (
            <p className="text-xs text-destructive">{errors.slug}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.officeManagement?.description || "Description"}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder={language === 'ar' ? "صف مكتبك الافتراضي وخدماتك..." : "Describe your virtual office and services..."}
          rows={3}
          data-testid="input-office-description"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">{t.officeManagement?.category || "Category"}</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger data-testid="select-office-category">
              <SelectValue placeholder={t.officeManagement?.selectCategory || "Select category"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">{t.officeManagement?.categoryGeneral || "General"}</SelectItem>
              <SelectItem value="legal">{t.officeManagement?.categoryLegal || "Legal Services"}</SelectItem>
              <SelectItem value="tech">{t.officeManagement?.categoryTech || "Technology"}</SelectItem>
              <SelectItem value="consulting">{t.officeManagement?.categoryConsulting || "Consulting"}</SelectItem>
              <SelectItem value="medical">{t.officeManagement?.categoryMedical || "Medical"}</SelectItem>
              <SelectItem value="financial">{t.officeManagement?.categoryFinancial || "Financial"}</SelectItem>
              <SelectItem value="marketing">{t.officeManagement?.categoryMarketing || "Marketing"}</SelectItem>
              <SelectItem value="hr">{t.officeManagement?.categoryHR || "Human Resources"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">{t.officeManagement?.location || "Location"}</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
            placeholder={language === 'ar' ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
            data-testid="input-office-location"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contactEmail">{t.officeManagement?.contactEmail || "Contact Email"}</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
            placeholder="contact@office.com"
            data-testid="input-office-email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactPhone">{t.officeManagement?.contactPhone || "Contact Phone"}</Label>
          <Input
            id="contactPhone"
            value={formData.contactPhone}
            onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
            placeholder="+966 xx xxx xxxx"
            data-testid="input-office-phone"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="workingHours">{t.officeManagement?.workingHours || "Working Hours"}</Label>
        <Input
          id="workingHours"
          value={formData.workingHours}
          onChange={(e) => setFormData((prev) => ({ ...prev, workingHours: e.target.value }))}
          placeholder={language === 'ar' ? "أحد-خميس 9ص-5م" : "Sun-Thu 9AM-5PM"}
          data-testid="input-office-hours"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'شعار الشركة' : 'Company Logo'}</Label>
          <input
            type="file"
            ref={logoInputRef}
            onChange={handleLogoUpload}
            accept="image/*"
            className="hidden"
            data-testid="input-office-logo-file"
          />
          <div className="flex items-center gap-3">
            {formData.logoUrl ? (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                <img 
                  src={formData.logoUrl.startsWith('/objects/') ? formData.logoUrl : formData.logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
              data-testid="button-upload-logo"
            >
              {logoUploading ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
              ) : (
                <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              )}
              {language === 'ar' ? 'رفع شعار' : 'Upload Logo'}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'صورة الغلاف' : 'Cover Image'}</Label>
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            className="hidden"
            data-testid="input-office-cover-file"
          />
          <div className="flex items-center gap-3">
            {formData.coverUrl ? (
              <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-border">
                <img 
                  src={formData.coverUrl.startsWith('/objects/') ? formData.coverUrl : formData.coverUrl} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => coverInputRef.current?.click()}
              disabled={coverUploading}
              data-testid="button-upload-cover"
            >
              {coverUploading ? (
                <Loader2 className={`h-4 w-4 animate-spin ${isRTL ? 'ml-2' : 'mr-2'}`} />
              ) : (
                <Upload className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              )}
              {language === 'ar' ? 'رفع صورة غلاف' : 'Upload Cover'}
            </Button>
          </div>
        </div>
      </div>

      <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
        <Switch
          id="isPublished"
          checked={formData.isPublished}
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublished: checked }))}
          data-testid="switch-office-published"
        />
        <Label htmlFor="isPublished">{t.officeManagement?.publishOffice || "Publish office (visible to visitors)"}</Label>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-office">
          {t.officeManagement?.cancel || "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-office"
        >
          {createMutation.isPending || updateMutation.isPending
            ? (office ? t.officeManagement?.updating || "Updating..." : t.officeManagement?.creating || "Creating...")
            : (office ? t.officeManagement?.updateOffice || "Update Office" : t.officeManagement?.createOffice || "Create Office")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ServiceForm({
  officeId,
  service,
  onSuccess,
  onCancel,
}: {
  officeId: number;
  service?: OfficeService;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [formData, setFormData] = useState({
    title: service?.title || '',
    description: service?.description || '',
    price: service?.price?.toString() || '',
    priceType: service?.priceType || 'fixed',
    category: service?.category || '',
    imageUrl: service?.imageUrl || '',
    isFeatured: service?.isFeatured || false,
    isActive: service?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<InsertOfficeService>) => {
      return await apiRequest('POST', `/api/offices/${officeId}/services`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: t.officeManagement?.serviceAdded || 'Service added successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: t.officeManagement?.failedAddService || 'Failed to add service', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertOfficeService>) => {
      return await apiRequest('PATCH', `/api/offices/${officeId}/services/${service!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: t.officeManagement?.serviceUpdated || 'Service updated successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: t.officeManagement?.failedUpdateService || 'Failed to update service', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      officeId,
      price: formData.price ? parseInt(formData.price) : null,
    };

    if (service) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <Label htmlFor="title">{t.officeManagement?.serviceTitle || "Service Title"} *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder={language === 'ar' ? "استشارة قانونية" : "Legal Consultation"}
          required
          data-testid="input-service-title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.officeManagement?.description || "Description"}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder={language === 'ar' ? "صف الخدمة..." : "Describe the service..."}
          rows={3}
          data-testid="input-service-description"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">{t.officeManagement?.priceSAR || "Price (SAR)"}</Label>
          <Input
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="100"
            data-testid="input-service-price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceType">{t.officeManagement?.priceType || "Price Type"}</Label>
          <Select
            value={formData.priceType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, priceType: value }))}
          >
            <SelectTrigger data-testid="select-service-pricetype">
              <SelectValue placeholder={t.officeManagement?.selectType || "Select type"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">{t.officeManagement?.fixedPrice || "Fixed Price"}</SelectItem>
              <SelectItem value="hourly">{t.officeManagement?.perHour || "Per Hour"}</SelectItem>
              <SelectItem value="negotiable">{t.officeManagement?.negotiable || "Negotiable"}</SelectItem>
              <SelectItem value="free">{t.officeManagement?.free || "Free"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">{t.officeManagement?.category || "Category"}</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            placeholder={language === 'ar' ? "استشارات، قانونية، إلخ." : "Consulting, Legal, etc."}
            data-testid="input-service-category"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">{t.officeManagement?.imageUrl || "Image URL"}</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://..."
            data-testid="input-service-image"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            data-testid="switch-service-active"
          />
          <Label htmlFor="isActive">{t.officeManagement?.active || "Active"}</Label>
        </div>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <Switch
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
            data-testid="switch-service-featured"
          />
          <Label htmlFor="isFeatured">{t.officeManagement?.featured || "Featured"}</Label>
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-service">
          {t.officeManagement?.cancel || "Cancel"}
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-service"
        >
          {createMutation.isPending || updateMutation.isPending
            ? (service ? t.officeManagement?.updating || "Updating..." : t.officeManagement?.creating || "Creating...")
            : (service ? t.officeManagement?.editService || "Update Service" : t.officeManagement?.addService || "Add Service")}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ServiceCard({
  service,
  officeId,
  onEdit,
}: {
  service: OfficeService;
  officeId: number;
  onEdit: () => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/offices/${officeId}/services/${service.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: t.officeManagement?.serviceDeleted || 'Service deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t.officeManagement?.failedDeleteService || 'Failed to delete service', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card className="hover-elevate" data-testid={`card-manage-service-${service.id}`}>
      <CardContent className="p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-start gap-4">
          {service.imageUrl ? (
            <img
              src={service.imageUrl}
              alt={service.title}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{service.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {service.category && (
                    <Badge variant="secondary" className="text-xs">
                      {service.category}
                    </Badge>
                  )}
                  {service.isFeatured && (
                    <Badge className="text-xs">
                      <Star className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.officeManagement?.featured || "Featured"}
                    </Badge>
                  )}
                  {!service.isActive && (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.officeManagement?.hidden || "Hidden"}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit} data-testid={`button-edit-service-${service.id}`}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-delete-service-${service.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.officeManagement?.deleteService || "Delete Service"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.officeManagement?.deleteServiceConfirm || `Are you sure you want to delete "${service.title}"? This action cannot be undone.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.officeManagement?.cancel || "Cancel"}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        data-testid="button-confirm-delete-service"
                      >
                        {t.officeManagement?.delete || "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            {service.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {service.description}
              </p>
            )}
            {service.price && (
              <div className="mt-2">
                <span className="font-medium">{formatPrice(service.price, language)}</span>
                {service.priceType && service.priceType !== 'fixed' && (
                  <span className="text-sm text-muted-foreground"> / {service.priceType}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OfficeCard({
  office,
  onManage,
}: {
  office: Office;
  onManage: () => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/offices/${office.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices'] });
      toast({ title: t.officeManagement?.officeDeleted || 'Office deleted successfully' });
    },
    onError: (error: Error) => {
      toast({ title: t.officeManagement?.failedDelete || 'Failed to delete office', description: error.message, variant: 'destructive' });
    },
  });

  return (
    <Card className="hover-elevate" data-testid={`card-office-${office.id}`}>
      <CardContent className="p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex items-start gap-4">
          {office.logoUrl ? (
            <img
              src={office.logoUrl}
              alt={office.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold truncate">{office.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {office.category && (
                    <Badge variant="secondary" className="text-xs capitalize">
                      {office.category}
                    </Badge>
                  )}
                  {office.isPublished ? (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                      <Eye className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.officeManagement?.published || "Published"}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      <EyeOff className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      {t.officeManagement?.draft || "Draft"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {office.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {office.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={onManage} data-testid={`button-manage-office-${office.id}`}>
                <Settings className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t.officeManagement?.manage || "Manage"}
              </Button>
              {office.isPublished && (
                <a href={`/office/${office.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" data-testid={`button-view-office-${office.id}`}>
                    <ExternalLink className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {t.officeManagement?.view || "View"}
                  </Button>
                </a>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" data-testid={`button-delete-office-${office.id}`}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.officeManagement?.deleteOffice || "Delete Office"}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t.officeManagement?.deleteConfirm || `Are you sure you want to delete "${office.name}"?`} {t.officeManagement?.deleteWarning || "This will also delete all services, media, and messages. This action cannot be undone."}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.officeManagement?.cancel || "Cancel"}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      data-testid="button-confirm-delete-office"
                    >
                      {t.officeManagement?.delete || "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartmentsPanel({ officeId }: { officeId: number }) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';

  const [addingDepartment, setAddingDepartment] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<CompanyDepartment | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<number>>(new Set());
  const [addingSectionTo, setAddingSectionTo] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<CompanySection | null>(null);

  const [deptForm, setDeptForm] = useState({ name: '', nameAr: '', description: '', descriptionAr: '' });
  const [sectionForm, setSectionForm] = useState({ name: '', nameAr: '', description: '', descriptionAr: '' });

  const { data: departments = [], isLoading: deptsLoading } = useQuery<CompanyDepartment[]>({
    queryKey: ['/api/offices', officeId, 'departments'],
  });

  const createDeptMutation = useMutation({
    mutationFn: async (data: Partial<InsertCompanyDepartment>) => {
      return apiRequest('POST', `/api/offices/${officeId}/departments`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'departments'] });
      toast({ title: language === 'ar' ? 'تم إنشاء الإدارة بنجاح' : 'Department created successfully' });
      setAddingDepartment(false);
      setDeptForm({ name: '', nameAr: '', description: '', descriptionAr: '' });
    },
    onError: () => {
      toast({ title: language === 'ar' ? 'فشل في إنشاء الإدارة' : 'Failed to create department', variant: 'destructive' });
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCompanyDepartment> }) => {
      return apiRequest('PATCH', `/api/offices/${officeId}/departments/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'departments'] });
      toast({ title: language === 'ar' ? 'تم تحديث الإدارة بنجاح' : 'Department updated successfully' });
      setEditingDepartment(null);
    },
    onError: () => {
      toast({ title: language === 'ar' ? 'فشل في تحديث الإدارة' : 'Failed to update department', variant: 'destructive' });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/offices/${officeId}/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'departments'] });
      toast({ title: language === 'ar' ? 'تم حذف الإدارة بنجاح' : 'Department deleted successfully' });
    },
    onError: () => {
      toast({ title: language === 'ar' ? 'فشل في حذف الإدارة' : 'Failed to delete department', variant: 'destructive' });
    },
  });

  const toggleExpanded = (deptId: number) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) {
        next.delete(deptId);
      } else {
        next.add(deptId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t.officeManagement?.departments || "Departments"}</h3>
        <Dialog open={addingDepartment} onOpenChange={setAddingDepartment}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-department">
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.officeManagement?.addDepartment || "Add Department"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t.officeManagement?.addDepartment || "Add Department"}</DialogTitle>
              <DialogDescription>{t.officeManagement?.createFirstDepartment || "Create departments to organize your company structure"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t.officeManagement?.departmentName || "Department Name"} (English)</Label>
                <Input
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g., Human Resources"
                  data-testid="input-department-name"
                />
              </div>
              <div>
                <Label>{t.officeManagement?.departmentName || "Department Name"} (العربية)</Label>
                <Input
                  value={deptForm.nameAr}
                  onChange={(e) => setDeptForm({ ...deptForm, nameAr: e.target.value })}
                  placeholder="مثال: الموارد البشرية"
                  dir="rtl"
                  data-testid="input-department-name-ar"
                />
              </div>
              <div>
                <Label>{t.officeManagement?.description || "Description"} (English)</Label>
                <Textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Description of this department..."
                  data-testid="input-department-description"
                />
              </div>
              <div>
                <Label>{t.officeManagement?.description || "Description"} (العربية)</Label>
                <Textarea
                  value={deptForm.descriptionAr}
                  onChange={(e) => setDeptForm({ ...deptForm, descriptionAr: e.target.value })}
                  placeholder="وصف هذه الإدارة..."
                  dir="rtl"
                  data-testid="input-department-description-ar"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddingDepartment(false)}>{t.officeManagement?.cancel || "Cancel"}</Button>
              <Button
                onClick={() => createDeptMutation.mutate(deptForm)}
                disabled={!deptForm.name || createDeptMutation.isPending}
                data-testid="button-save-department"
              >
                {createDeptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t.officeManagement?.save || "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {deptsLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">{t.officeManagement?.noDepartments || "No departments yet"}</h3>
            <p className="text-muted-foreground mb-4">{t.officeManagement?.createFirstDepartment || "Create departments to organize your company structure"}</p>
            <Button onClick={() => setAddingDepartment(true)} data-testid="button-add-first-department">
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.officeManagement?.addDepartment || "Add Department"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              department={dept}
              expanded={expandedDepartments.has(dept.id)}
              onToggle={() => toggleExpanded(dept.id)}
              onEdit={() => setEditingDepartment(dept)}
              onDelete={() => deleteDeptMutation.mutate(dept.id)}
              onAddSection={() => setAddingSectionTo(dept.id)}
              onEditSection={(section) => setEditingSection(section)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editingDepartment} onOpenChange={(open) => !open && setEditingDepartment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.officeManagement?.editDepartment || "Edit Department"}</DialogTitle>
          </DialogHeader>
          {editingDepartment && (
            <DepartmentFormEdit
              department={editingDepartment}
              onSave={(data) => updateDeptMutation.mutate({ id: editingDepartment.id, data })}
              onCancel={() => setEditingDepartment(null)}
              isPending={updateDeptMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <SectionDialogs
        addingSectionTo={addingSectionTo}
        editingSection={editingSection}
        officeId={officeId}
        onCloseAdd={() => setAddingSectionTo(null)}
        onCloseEdit={() => setEditingSection(null)}
      />
    </div>
  );
}

function DepartmentFormEdit({
  department,
  onSave,
  onCancel,
  isPending,
}: {
  department: CompanyDepartment;
  onSave: (data: Partial<InsertCompanyDepartment>) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const { language } = useLanguage();
  const t = translations[language];
  const [form, setForm] = useState({
    name: department.name,
    nameAr: department.nameAr || '',
    description: department.description || '',
    descriptionAr: department.descriptionAr || '',
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>{t.officeManagement?.departmentName || "Department Name"} (English)</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-edit-department-name" />
      </div>
      <div>
        <Label>{t.officeManagement?.departmentName || "Department Name"} (العربية)</Label>
        <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" data-testid="input-edit-department-name-ar" />
      </div>
      <div>
        <Label>{t.officeManagement?.description || "Description"} (English)</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="input-edit-department-description" />
      </div>
      <div>
        <Label>{t.officeManagement?.description || "Description"} (العربية)</Label>
        <Textarea value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl" data-testid="input-edit-department-description-ar" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>{t.officeManagement?.cancel || "Cancel"}</Button>
        <Button onClick={() => onSave(form)} disabled={!form.name || isPending} data-testid="button-update-department">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t.officeManagement?.save || "Save"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function DepartmentCard({
  department,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onAddSection,
  onEditSection,
}: {
  department: CompanyDepartment;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddSection: () => void;
  onEditSection: (section: CompanySection) => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';

  const { data: sections = [], isLoading: sectionsLoading } = useQuery<CompanySection[]>({
    queryKey: ['/api/departments', department.id, 'sections'],
    enabled: expanded,
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments', department.id, 'sections'] });
      toast({ title: language === 'ar' ? 'تم حذف القسم بنجاح' : 'Section deleted successfully' });
    },
    onError: () => {
      toast({ title: language === 'ar' ? 'فشل في حذف القسم' : 'Failed to delete section', variant: 'destructive' });
    },
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" onClick={onToggle} data-testid={`button-toggle-department-${department.id}`}>
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
            <div>
              <h4 className="font-semibold">{isRTL && department.nameAr ? department.nameAr : department.name}</h4>
              <p className="text-sm text-muted-foreground">
                {isRTL && department.descriptionAr ? department.descriptionAr : department.description || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={onAddSection} data-testid={`button-add-section-${department.id}`}>
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">{t.officeManagement?.addSection || "Add Section"}</span>
            </Button>
            <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-department-${department.id}`}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" data-testid={`button-delete-department-${department.id}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.officeManagement?.deleteDepartment || "Delete Department"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === 'ar' ? 'هل أنت متأكد؟ سيتم حذف جميع الأقسام التابعة.' : 'Are you sure? All sections within this department will also be deleted.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.officeManagement?.cancel || "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t.officeManagement?.delete || "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {expanded && (
          <div className={`mt-4 ${isRTL ? 'pr-8 border-r' : 'pl-8 border-l'} border-border`}>
            {sectionsLoading ? (
              <Skeleton className="h-10" />
            ) : sections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">{t.officeManagement?.noSections || "No sections yet"}</p>
            ) : (
              <div className="space-y-2">
                {sections.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{isRTL && section.nameAr ? section.nameAr : section.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => onEditSection(section)} data-testid={`button-edit-section-${section.id}`}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteSectionMutation.mutate(section.id)} data-testid={`button-delete-section-${section.id}`}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SectionDialogs({
  addingSectionTo,
  editingSection,
  officeId,
  onCloseAdd,
  onCloseEdit,
}: {
  addingSectionTo: number | null;
  editingSection: CompanySection | null;
  officeId: number;
  onCloseAdd: () => void;
  onCloseEdit: () => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = translations[language];
  
  const [addForm, setAddForm] = useState({ name: '', nameAr: '', description: '', descriptionAr: '' });
  const [editForm, setEditForm] = useState({ name: '', nameAr: '', description: '', descriptionAr: '' });

  // Reset edit form when editing section changes using useEffect to avoid state update during render
  useEffect(() => {
    if (editingSection) {
      setEditForm({
        name: editingSection.name,
        nameAr: editingSection.nameAr || '',
        description: editingSection.description || '',
        descriptionAr: editingSection.descriptionAr || '',
      });
    }
  }, [editingSection]);

  const createSectionMutation = useMutation({
    mutationFn: async ({ departmentId, data }: { departmentId: number; data: Partial<InsertCompanySection> }) => {
      return apiRequest('POST', `/api/departments/${departmentId}/sections`, data);
    },
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments', departmentId, 'sections'] });
      toast({ title: language === 'ar' ? 'تم إنشاء القسم بنجاح' : 'Section created successfully' });
      onCloseAdd();
      setAddForm({ name: '', nameAr: '', description: '', descriptionAr: '' });
    },
    onError: () => {
      toast({ title: language === 'ar' ? 'فشل في إنشاء القسم' : 'Failed to create section', variant: 'destructive' });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ id, departmentId, data }: { id: number; departmentId: number; data: Partial<InsertCompanySection> }) => {
      return apiRequest('PATCH', `/api/sections/${id}`, data);
    },
    onSuccess: (_, { departmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/departments', departmentId, 'sections'] });
      toast({ title: language === 'ar' ? 'تم تحديث القسم بنجاح' : 'Section updated successfully' });
      onCloseEdit();
    },
    onError: () => {
      toast({ title: language === 'ar' ? 'فشل في تحديث القسم' : 'Failed to update section', variant: 'destructive' });
    },
  });

  return (
    <>
      <Dialog open={addingSectionTo !== null} onOpenChange={(open) => !open && onCloseAdd()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.officeManagement?.addSection || "Add Section"}</DialogTitle>
            <DialogDescription>{t.officeManagement?.createFirstSection || "Create sections within departments"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.officeManagement?.sectionName || "Section Name"} (English)</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="e.g., Recruitment"
                data-testid="input-section-name"
              />
            </div>
            <div>
              <Label>{t.officeManagement?.sectionName || "Section Name"} (العربية)</Label>
              <Input
                value={addForm.nameAr}
                onChange={(e) => setAddForm({ ...addForm, nameAr: e.target.value })}
                placeholder="مثال: التوظيف"
                dir="rtl"
                data-testid="input-section-name-ar"
              />
            </div>
            <div>
              <Label>{t.officeManagement?.description || "Description"} (English)</Label>
              <Textarea
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                data-testid="input-section-description"
              />
            </div>
            <div>
              <Label>{t.officeManagement?.description || "Description"} (العربية)</Label>
              <Textarea
                value={addForm.descriptionAr}
                onChange={(e) => setAddForm({ ...addForm, descriptionAr: e.target.value })}
                dir="rtl"
                data-testid="input-section-description-ar"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseAdd}>{t.officeManagement?.cancel || "Cancel"}</Button>
            <Button
              onClick={() => addingSectionTo && createSectionMutation.mutate({ departmentId: addingSectionTo, data: addForm })}
              disabled={!addForm.name || createSectionMutation.isPending}
              data-testid="button-save-section"
            >
              {createSectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.officeManagement?.save || "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingSection !== null} onOpenChange={(open) => !open && onCloseEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.officeManagement?.editSection || "Edit Section"}</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div>
                <Label>{t.officeManagement?.sectionName || "Section Name"} (English)</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} data-testid="input-edit-section-name" />
              </div>
              <div>
                <Label>{t.officeManagement?.sectionName || "Section Name"} (العربية)</Label>
                <Input value={editForm.nameAr} onChange={(e) => setEditForm({ ...editForm, nameAr: e.target.value })} dir="rtl" data-testid="input-edit-section-name-ar" />
              </div>
              <div>
                <Label>{t.officeManagement?.description || "Description"} (English)</Label>
                <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} data-testid="input-edit-section-description" />
              </div>
              <div>
                <Label>{t.officeManagement?.description || "Description"} (العربية)</Label>
                <Textarea value={editForm.descriptionAr} onChange={(e) => setEditForm({ ...editForm, descriptionAr: e.target.value })} dir="rtl" data-testid="input-edit-section-description-ar" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={onCloseEdit}>{t.officeManagement?.cancel || "Cancel"}</Button>
                <Button
                  onClick={() => updateSectionMutation.mutate({ id: editingSection.id, departmentId: editingSection.departmentId, data: editForm })}
                  disabled={!editForm.name || updateSectionMutation.isPending}
                  data-testid="button-update-section"
                >
                  {updateSectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t.officeManagement?.save || "Save"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// =====================
// Messages Panel - Service Provider Chat Interface
// =====================
function MessagesPanel({ officeId }: { officeId: number }) {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  const { toast } = useToast();
  
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: messages = [], isLoading, refetch } = useQuery<OfficeMessage[]>({
    queryKey: ['/api/offices', officeId, 'messages'],
    refetchInterval: 5000,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['/api/offices', officeId, 'messages', 'unread'],
    refetchInterval: 5000,
  });

  const replyMutation = useMutation({
    mutationFn: async (data: { sessionId: string; content: string }) => {
      return await apiRequest('POST', `/api/offices/${officeId}/messages`, data);
    },
    onSuccess: () => {
      setReplyContent('');
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'messages', 'unread'] });
      toast({ title: isRTL ? 'تم إرسال الرد' : 'Reply sent' });
    },
    onError: () => {
      toast({ title: isRTL ? 'فشل إرسال الرد' : 'Failed to send reply', variant: 'destructive' });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return await apiRequest('POST', `/api/offices/${officeId}/messages/${sessionId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'messages', 'unread'] });
    },
  });

  const handleSelectSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    const info = getSessionInfo(sessionId);
    if (info.unreadCount > 0) {
      markReadMutation.mutate(sessionId);
    }
  };

  const sessions = Array.from(new Set(messages.map((m) => m.sessionId)));
  
  const getSessionMessages = (sessionId: string) => {
    return messages.filter((m) => m.sessionId === sessionId);
  };

  const getSessionInfo = (sessionId: string) => {
    const sessionMessages = getSessionMessages(sessionId);
    const visitorMessage = sessionMessages.find((m) => m.senderType === 'visitor');
    const unreadCount = sessionMessages.filter((m) => m.senderType === 'visitor' && !m.isRead).length;
    const lastMessage = sessionMessages[sessionMessages.length - 1];
    return {
      visitorName: visitorMessage?.senderName || (isRTL ? 'زائر' : 'Visitor'),
      visitorEmail: visitorMessage?.senderEmail || '',
      unreadCount,
      lastMessage,
      messageCount: sessionMessages.length,
    };
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendReply = () => {
    if (!selectedSession || !replyContent.trim()) return;
    replyMutation.mutate({ sessionId: selectedSession, content: replyContent.trim() });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-2">{isRTL ? 'لا توجد محادثات' : 'No Conversations'}</h3>
          <p className="text-muted-foreground">
            {isRTL ? 'ستظهر رسائل الزوار هنا عندما يتواصلون معك' : 'Visitor messages will appear here when they contact you'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="md:col-span-1">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{isRTL ? 'المحادثات' : 'Conversations'}</CardTitle>
            {(unreadData?.count ?? 0) > 0 && (
              <Badge variant="destructive">{unreadData?.count}</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => refetch()} data-testid="button-refresh-messages">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {sessions.map((sessionId) => {
              const info = getSessionInfo(sessionId);
              const isSelected = selectedSession === sessionId;
              return (
                <div
                  key={sessionId}
                  onClick={() => handleSelectSession(sessionId)}
                  className={`p-3 border-b cursor-pointer transition-colors hover-elevate ${
                    isSelected ? 'bg-accent' : ''
                  }`}
                  data-testid={`conversation-${sessionId}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{info.visitorName}</span>
                        {info.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">{info.unreadCount}</Badge>
                        )}
                      </div>
                      {info.lastMessage && (
                        <p className="text-sm text-muted-foreground truncate">
                          {info.lastMessage.content}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {info.lastMessage && formatTime(info.lastMessage.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        {selectedSession ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{getSessionInfo(selectedSession).visitorName}</CardTitle>
                  {getSessionInfo(selectedSession).visitorEmail && (
                    <p className="text-sm text-muted-foreground">{getSessionInfo(selectedSession).visitorEmail}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="h-[300px] p-4">
              <div className="space-y-4">
                {getSessionMessages(selectedSession).map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'receptionist' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderType === 'receptionist'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 text-xs ${
                        message.senderType === 'receptionist' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(message.createdAt)}</span>
                        {message.senderType === 'receptionist' && message.isRead && (
                          <CheckCheck className="h-3 w-3" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={isRTL ? 'اكتب ردك...' : 'Type your reply...'}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  data-testid="input-reply-message"
                />
                <Button
                  onClick={handleSendReply}
                  disabled={!replyContent.trim() || replyMutation.isPending}
                  data-testid="button-send-reply"
                >
                  {replyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isRTL ? 'اختر محادثة للبدء' : 'Select a conversation to start'}
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

// =====================
// Video Calls Panel - Service Provider Video Call Management
// =====================
function VideoCallsPanel({ officeId }: { officeId: number }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();

  const { data: calls = [], isLoading, refetch } = useQuery<VideoCall[]>({
    queryKey: ['/api/offices', officeId, 'video-calls'],
    refetchInterval: 5000,
  });

  const acceptMutation = useMutation({
    mutationFn: async (callId: number) => {
      const res = await apiRequest('POST', `/api/offices/${officeId}/video-calls/${callId}/accept`, {});
      return res.json() as Promise<VideoCall>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'video-calls'] });
      toast({ title: isRTL ? 'تم قبول المكالمة' : 'Call accepted' });
      if (data?.roomId) {
        window.open(`/video-call/${data.roomId}`, '_blank');
      }
    },
    onError: () => {
      toast({ title: isRTL ? 'فشل قبول المكالمة' : 'Failed to accept call', variant: 'destructive' });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (callId: number) => {
      return await apiRequest('POST', `/api/offices/${officeId}/video-calls/${callId}/decline`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'video-calls'] });
      toast({ title: isRTL ? 'تم رفض المكالمة' : 'Call declined' });
    },
    onError: () => {
      toast({ title: isRTL ? 'فشل رفض المكالمة' : 'Failed to decline call', variant: 'destructive' });
    },
  });

  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleString(isRTL ? 'ar-SA' : 'en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">{isRTL ? 'قيد الانتظار' : 'Pending'}</Badge>;
      case 'active':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">{isRTL ? 'نشط' : 'Active'}</Badge>;
      case 'ended':
        return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">{isRTL ? 'منتهي' : 'Ended'}</Badge>;
      case 'declined':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">{isRTL ? 'مرفوض' : 'Declined'}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingCalls = calls.filter((c) => c.status === 'pending');
  const otherCalls = calls.filter((c) => c.status !== 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Video className="h-5 w-5" />
          {isRTL ? 'طلبات مكالمات الفيديو' : 'Video Call Requests'}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => refetch()} data-testid="button-refresh-video-calls">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {pendingCalls.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4 text-yellow-500 animate-pulse" />
              {isRTL ? 'طلبات معلقة' : 'Pending Requests'} ({pendingCalls.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background border"
                data-testid={`video-call-${call.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{call.visitorName || (isRTL ? 'زائر' : 'Visitor')}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(call.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => declineMutation.mutate(call.id)}
                    disabled={declineMutation.isPending}
                    data-testid={`button-decline-call-${call.id}`}
                  >
                    <PhoneOff className="h-4 w-4 text-destructive" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptMutation.mutate(call.id)}
                    disabled={acceptMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                    data-testid={`button-accept-call-${call.id}`}
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                    <span className={isRTL ? 'mr-1' : 'ml-1'}>{isRTL ? 'قبول' : 'Accept'}</span>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {otherCalls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{isRTL ? 'سجل المكالمات' : 'Call History'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {otherCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  data-testid={`video-call-history-${call.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{call.visitorName || (isRTL ? 'زائر' : 'Visitor')}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(call.createdAt)}</p>
                    </div>
                  </div>
                  {getStatusBadge(call.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {calls.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">{isRTL ? 'لا توجد مكالمات' : 'No Video Calls'}</h3>
            <p className="text-muted-foreground">
              {isRTL ? 'ستظهر طلبات مكالمات الفيديو هنا عندما يطلب الزوار محادثة' : 'Video call requests will appear here when visitors request a call'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function OfficeManagementPanel({
  office,
  onBack,
}: {
  office: Office;
  onBack: () => void;
}) {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [editingOffice, setEditingOffice] = useState(false);
  const [addingService, setAddingService] = useState(false);
  const [editingService, setEditingService] = useState<OfficeService | null>(null);

  const { data: services = [], isLoading: servicesLoading } = useQuery<OfficeService[]>({
    queryKey: ['/api/offices', office.id, 'services'],
  });

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-to-offices">
            <Building2 className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{office.name}</h2>
            <p className="text-sm text-muted-foreground">{t.officeManagement?.manageYourOffice || "Manage your office and services"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {office.isPublished && (
            <a href={`/office/${office.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" data-testid="button-preview-office">
                <Globe className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.officeManagement?.viewPublicPage || "View Public Page"}
              </Button>
            </a>
          )}
          <Dialog open={editingOffice} onOpenChange={setEditingOffice}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-edit-office">
                <Pencil className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.officeManagement?.editOffice || "Edit Office"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t.officeManagement?.editOffice || "Edit Office"}</DialogTitle>
                <DialogDescription>{t.officeManagement?.updateServiceInfo || "Update your office information"}</DialogDescription>
              </DialogHeader>
              <OfficeForm
                office={office}
                onSuccess={() => setEditingOffice(false)}
                onCancel={() => setEditingOffice(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="services">
        <TabsList data-testid="tabs-office-management">
          <TabsTrigger value="services" data-testid="tab-manage-services">
            <Package className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.officeManagement?.servicesCount || "Services"} ({services.length})
          </TabsTrigger>
          <TabsTrigger value="departments" data-testid="tab-manage-departments">
            <FolderTree className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t.officeManagement?.departments || "Departments"}
          </TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-manage-messages">
            <MessageCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'الرسائل' : 'Messages'}
          </TabsTrigger>
          <TabsTrigger value="video-calls" data-testid="tab-manage-video-calls">
            <Video className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {isRTL ? 'مكالمات الفيديو' : 'Video Calls'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{t.officeManagement?.services || "Services"}</h3>
            <Dialog open={addingService} onOpenChange={setAddingService}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-service">
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t.officeManagement?.addService || "Add Service"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t.officeManagement?.addNewService || "Add New Service"}</DialogTitle>
                  <DialogDescription>
                    {t.officeManagement?.addNewServiceDesc || "Create a new service that visitors can see and rate"}
                  </DialogDescription>
                </DialogHeader>
                <ServiceForm
                  officeId={office.id}
                  onSuccess={() => setAddingService(false)}
                  onCancel={() => setAddingService(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {servicesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">{t.officeManagement?.noServicesYet || "No Services Yet"}</h3>
                <p className="text-muted-foreground mb-4">
                  {t.officeManagement?.addServicesDescription || "Add services that visitors can view and rate"}
                </p>
                <Button onClick={() => setAddingService(true)} data-testid="button-add-first-service">
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t.officeManagement?.addFirstService || "Add First Service"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  officeId={office.id}
                  onEdit={() => setEditingService(service)}
                />
              ))}
            </div>
          )}

          <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{t.officeManagement?.editService || "Edit Service"}</DialogTitle>
                <DialogDescription>{t.officeManagement?.updateServiceInfo || "Update service information"}</DialogDescription>
              </DialogHeader>
              {editingService && (
                <ServiceForm
                  officeId={office.id}
                  service={editingService}
                  onSuccess={() => setEditingService(null)}
                  onCancel={() => setEditingService(null)}
                />
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="departments" className="mt-6">
          <DepartmentsPanel officeId={office.id} />
        </TabsContent>

        <TabsContent value="messages" className="mt-6">
          <MessagesPanel officeId={office.id} />
        </TabsContent>

        <TabsContent value="video-calls" className="mt-6">
          <VideoCallsPanel officeId={office.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function OfficeManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [creatingOffice, setCreatingOffice] = useState(false);

  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ['/api/offices'],
  });

  if (selectedOffice) {
    const currentOffice = offices.find((o) => o.id === selectedOffice.id) || selectedOffice;
    return (
      <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <OfficeManagementPanel
          office={currentOffice}
          onBack={() => setSelectedOffice(null)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.officeManagement?.title || "Office Management"}</h1>
          <p className="text-muted-foreground">
            {t.officeManagement?.subtitle || "Manage your virtual offices and services for visitors"}
          </p>
        </div>
        <Dialog open={creatingOffice} onOpenChange={setCreatingOffice}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-office">
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.officeManagement?.createOffice || "Create Office"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t.officeManagement?.createNewOffice || "Create New Office"}</DialogTitle>
              <DialogDescription>
                {t.officeManagement?.createNewOfficeDesc || "Set up a new virtual office that visitors can browse on the marketplace"}
              </DialogDescription>
            </DialogHeader>
            <OfficeForm
              onSuccess={() => setCreatingOffice(false)}
              onCancel={() => setCreatingOffice(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : offices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">{t.officeManagement?.noOffices || "No Offices Yet"}</h3>
            <p className="text-muted-foreground mb-4">
              {t.officeManagement?.createFirstOffice || "Create your first virtual office to start offering services to visitors"}
            </p>
            <Button onClick={() => setCreatingOffice(true)} data-testid="button-create-first-office">
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.officeManagement?.createYourFirstOffice || "Create Your First Office"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {offices.map((office) => (
            <OfficeCard
              key={office.id}
              office={office}
              onManage={() => setSelectedOffice(office)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
