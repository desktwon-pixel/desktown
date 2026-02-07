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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Link2,
  Copy,
  Check,
  CreditCard,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Service, ServiceOrder } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

function ServiceForm({
  service,
  onSuccess,
  onCancel,
}: {
  service?: Service;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [formData, setFormData] = useState({
    name: service?.name || '',
    nameAr: service?.nameAr || '',
    description: service?.description || '',
    descriptionAr: service?.descriptionAr || '',
    price: service?.price ? (service.price / 100).toString() : '',
    currency: service?.currency || 'SAR',
    category: service?.category || 'general',
    imageUrl: service?.imageUrl || '',
    isActive: service?.isActive ?? true,
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest('POST', '/api/services', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: isRTL ? 'تمت إضافة الخدمة بنجاح' : 'Service added successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: isRTL ? 'فشل في إضافة الخدمة' : 'Failed to add service', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return await apiRequest('PATCH', `/api/services/${service!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: isRTL ? 'تم تحديث الخدمة بنجاح' : 'Service updated successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: isRTL ? 'فشل في تحديث الخدمة' : 'Failed to update service', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ title: isRTL ? 'اسم الخدمة مطلوب' : 'Service name is required', variant: 'destructive' });
      return;
    }
    
    const priceInSAR = parseFloat(formData.price);
    if (isNaN(priceInSAR) || priceInSAR < 0) {
      toast({ title: isRTL ? 'السعر يجب أن يكون رقمًا صحيحًا' : 'Price must be a valid positive number', variant: 'destructive' });
      return;
    }
    
    const data = {
      name: formData.name,
      nameAr: formData.nameAr || null,
      description: formData.description || null,
      descriptionAr: formData.descriptionAr || null,
      price: Math.round(priceInSAR * 100),
      currency: formData.currency,
      category: formData.category,
      imageUrl: formData.imageUrl || null,
      isActive: formData.isActive,
    };

    if (service) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{isRTL ? 'اسم الخدمة (إنجليزي) *' : 'Service Name (English) *'}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder={isRTL ? 'مثال: استشارة قانونية' : 'e.g., Legal Consultation'}
            required
            data-testid="input-service-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nameAr">{isRTL ? 'اسم الخدمة (عربي)' : 'Service Name (Arabic)'}</Label>
          <Input
            id="nameAr"
            value={formData.nameAr}
            onChange={(e) => setFormData((prev) => ({ ...prev, nameAr: e.target.value }))}
            placeholder={isRTL ? 'مثال: Legal Consultation' : 'e.g., استشارة قانونية'}
            dir="rtl"
            data-testid="input-service-name-ar"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description">{isRTL ? 'الوصف (إنجليزي)' : 'Description (English)'}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={isRTL ? 'وصف الخدمة...' : 'Describe the service...'}
            rows={3}
            data-testid="input-service-description"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionAr">{isRTL ? 'الوصف (عربي)' : 'Description (Arabic)'}</Label>
          <Textarea
            id="descriptionAr"
            value={formData.descriptionAr}
            onChange={(e) => setFormData((prev) => ({ ...prev, descriptionAr: e.target.value }))}
            placeholder={isRTL ? 'Describe the service...' : 'وصف الخدمة...'}
            rows={3}
            dir="rtl"
            data-testid="input-service-description-ar"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">{isRTL ? 'السعر (ريال سعودي) *' : 'Price (SAR) *'}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
            placeholder="100.00"
            required
            data-testid="input-service-price"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">{isRTL ? 'التصنيف' : 'Category'}</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
          >
            <SelectTrigger id="category" data-testid="select-service-category">
              <SelectValue placeholder={isRTL ? 'اختر التصنيف' : 'Select category'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">{isRTL ? 'عام' : 'General'}</SelectItem>
              <SelectItem value="legal">{isRTL ? 'قانوني' : 'Legal'}</SelectItem>
              <SelectItem value="consulting">{isRTL ? 'استشارات' : 'Consulting'}</SelectItem>
              <SelectItem value="support">{isRTL ? 'دعم' : 'Support'}</SelectItem>
              <SelectItem value="administrative">{isRTL ? 'إداري' : 'Administrative'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">{isRTL ? 'رابط الصورة' : 'Image URL'}</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://..."
            data-testid="input-service-image"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 pt-2">
        <div className="flex items-center gap-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            data-testid="switch-service-active"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            {isRTL ? 'نشط' : 'Active'}
          </Label>
        </div>
      </div>

      <DialogFooter className="gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {isRTL ? 'إلغاء' : 'Cancel'}
        </Button>
        <Button type="submit" disabled={isPending} data-testid="button-save-service">
          {isPending ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (service ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'إضافة' : 'Add'))}
        </Button>
      </DialogFooter>
    </form>
  );
}

function CopyLinkButton({ shareToken, serviceName }: { shareToken: string; serviceName: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const shareUrl = `${window.location.origin}/s/${shareToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: isRTL ? 'تم نسخ الرابط' : 'Link copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: isRTL ? 'فشل في نسخ الرابط' : 'Failed to copy link', variant: 'destructive' });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2" data-testid={`button-copy-link-${serviceName}`}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? (isRTL ? 'تم النسخ' : 'Copied') : (isRTL ? 'نسخ الرابط' : 'Copy Link')}
    </Button>
  );
}

function ServiceCard({ service, onEdit, onDelete }: { service: Service; onEdit: () => void; onDelete: () => void }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const displayName = isRTL && service.nameAr ? service.nameAr : service.name;
  const displayDescription = isRTL && service.descriptionAr ? service.descriptionAr : service.description;
  const priceInSAR = service.price / 100;

  return (
    <Card className="glass border-white/5 overflow-hidden" data-testid={`card-service-${service.id}`}>
      <div className="relative">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={displayName}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <Package className="h-10 w-10 text-amber-400/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} flex gap-1`}>
          {service.isActive ? (
            <Badge className="bg-emerald-500/90 border-0 text-xs">
              <Eye className="h-3 w-3 mr-1" />
              {isRTL ? 'نشط' : 'Active'}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <EyeOff className="h-3 w-3 mr-1" />
              {isRTL ? 'غير نشط' : 'Inactive'}
            </Badge>
          )}
        </div>
        <div className={`absolute bottom-2 ${isRTL ? 'right-2' : 'left-2'}`}>
          <Badge variant="outline" className="bg-black/40 backdrop-blur-sm border-white/20 text-white text-xs">
            {service.category || (isRTL ? 'عام' : 'General')}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{displayName}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {displayDescription || (isRTL ? 'لا يوجد وصف' : 'No description')}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <p className="text-lg font-bold text-amber-400">
            {priceInSAR.toFixed(2)} <span className="text-xs font-normal">{isRTL ? 'ر.س' : 'SAR'}</span>
          </p>
          {service.isActive && (
            <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
              <CreditCard className="h-3 w-3 mr-1" />
              {isRTL ? 'قابل للشراء' : 'Purchasable'}
            </Badge>
          )}
        </div>

        {service.shareToken && (
          <div className="pt-2">
            <CopyLinkButton shareToken={service.shareToken} serviceName={service.name} />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 gap-1" data-testid={`button-edit-service-${service.id}`}>
            <Pencil className="h-3 w-3" />
            {isRTL ? 'تعديل' : 'Edit'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive" data-testid={`button-delete-service-${service.id}`}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
              <AlertDialogHeader>
                <AlertDialogTitle>{isRTL ? 'حذف الخدمة' : 'Delete Service'}</AlertDialogTitle>
                <AlertDialogDescription>
                  {isRTL 
                    ? `هل أنت متأكد من حذف "${displayName}"؟ لا يمكن التراجع عن هذا الإجراء.`
                    : `Are you sure you want to delete "${displayName}"? This action cannot be undone.`
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                  {isRTL ? 'حذف' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string; label: string; labelAr: string }> = {
    paid: { icon: CheckCircle2, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Paid', labelAr: 'مدفوع' },
    pending: { icon: Clock, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending', labelAr: 'قيد الانتظار' },
    awaiting_payment: { icon: AlertCircle, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Awaiting Payment', labelAr: 'في انتظار الدفع' },
    payment_failed: { icon: XCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Failed', labelAr: 'فشل' },
    cancelled: { icon: XCircle, className: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Cancelled', labelAr: 'ملغي' },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {isRTL ? config.labelAr : config.label}
    </Badge>
  );
}

export default function MyPaidServices() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | undefined>();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery<ServiceOrder[]>({
    queryKey: ['/api/service-orders'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: isRTL ? 'تم حذف الخدمة' : 'Service deleted' });
    },
    onError: (error: Error) => {
      toast({ title: isRTL ? 'فشل في حذف الخدمة' : 'Failed to delete service', description: error.message, variant: 'destructive' });
    },
  });

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingService(undefined);
  };

  const totalRevenue = orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.quotedPrice, 0) / 100;
  const paidOrders = orders.filter(o => o.status === 'paid').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'awaiting_payment').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isRTL ? 'خدماتي المدفوعة' : 'My Paid Services'}</h1>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'إدارة خدماتك وتتبع الطلبات' : 'Manage your services and track orders'}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => setEditingService(undefined)} data-testid="button-add-service">
              <Plus className="h-4 w-4" />
              {isRTL ? 'إضافة خدمة' : 'Add Service'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingService ? (isRTL ? 'تعديل الخدمة' : 'Edit Service') : (isRTL ? 'إضافة خدمة جديدة' : 'Add New Service')}</DialogTitle>
              <DialogDescription>
                {isRTL ? 'أضف خدمة يمكن للعملاء شراؤها عبر الإنترنت' : 'Add a service that customers can purchase online'}
              </DialogDescription>
            </DialogHeader>
            <ServiceForm
              service={editingService}
              onSuccess={handleDialogClose}
              onCancel={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Package className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الخدمات' : 'Total Services'}</p>
              <p className="text-2xl font-bold">{services.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الإيرادات' : 'Total Revenue'}</p>
              <p className="text-2xl font-bold">{totalRevenue.toFixed(2)} <span className="text-sm">{isRTL ? 'ر.س' : 'SAR'}</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <ShoppingCart className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? 'الطلبات المكتملة' : 'Completed Orders'}</p>
              <p className="text-2xl font-bold">{paidOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass border-white/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{isRTL ? 'الطلبات المعلقة' : 'Pending Orders'}</p>
              <p className="text-2xl font-bold">{pendingOrders}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services" className="gap-2" data-testid="tab-services">
            <Package className="h-4 w-4" />
            {isRTL ? 'الخدمات' : 'Services'}
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2" data-testid="tab-orders">
            <ShoppingCart className="h-4 w-4" />
            {isRTL ? 'الطلبات' : 'Orders'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          {isLoadingServices ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="glass border-white/5">
                  <Skeleton className="h-32 rounded-t-lg bg-white/5" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4 bg-white/5" />
                    <Skeleton className="h-4 w-full bg-white/5" />
                    <Skeleton className="h-8 w-1/2 bg-white/5" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => handleEdit(service)}
                  onDelete={() => deleteMutation.mutate(service.id)}
                />
              ))}
            </div>
          ) : (
            <Card className="glass border-white/5 p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold mb-2">{isRTL ? 'لا توجد خدمات بعد' : 'No services yet'}</h3>
              <p className="text-muted-foreground mb-4">
                {isRTL ? 'أضف خدمتك الأولى لبدء البيع عبر الإنترنت' : 'Add your first service to start selling online'}
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {isRTL ? 'إضافة خدمة' : 'Add Service'}
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          {isLoadingOrders ? (
            <Card className="glass border-white/5">
              <CardContent className="p-4">
                <Skeleton className="h-64 w-full bg-white/5" />
              </CardContent>
            </Card>
          ) : orders.length > 0 ? (
            <Card className="glass border-white/5">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'رقم الطلب' : 'Order #'}</TableHead>
                      <TableHead>{isRTL ? 'الخدمة' : 'Service'}</TableHead>
                      <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                      <TableHead>{isRTL ? 'المبلغ' : 'Amount'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                      <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => {
                      const service = services.find(s => s.id === order.serviceId);
                      return (
                        <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                          <TableCell className="font-mono text-sm">#{order.id}</TableCell>
                          <TableCell>{isRTL && service?.nameAr ? service.nameAr : service?.name || '-'}</TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{order.clientName || '-'}</p>
                              <p className="text-xs text-muted-foreground">{order.clientEmail || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {(order.quotedPrice / 100).toFixed(2)} {isRTL ? 'ر.س' : 'SAR'}
                          </TableCell>
                          <TableCell>
                            <OrderStatusBadge status={order.status || 'pending'} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.createdAt ? format(new Date(order.createdAt), 'PP', { locale: isRTL ? ar : enUS }) : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass border-white/5 p-12 text-center">
              <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
              <h3 className="text-lg font-semibold mb-2">{isRTL ? 'لا توجد طلبات بعد' : 'No orders yet'}</h3>
              <p className="text-muted-foreground">
                {isRTL ? 'ستظهر الطلبات هنا عندما يشتري العملاء خدماتك' : 'Orders will appear here when customers purchase your services'}
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
