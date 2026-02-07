import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Sparkles,
  Grid3X3,
  List,
  Search,
  Filter,
  ArrowUpDown,
  DollarSign,
  Tag,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Office, OfficeService, InsertOfficeService } from "@shared/schema";

type ViewMode = "grid" | "list";
type SortBy = "title" | "price" | "featured" | "createdAt";

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
      toast({ title: 'Service added successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add service', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertOfficeService>) => {
      return await apiRequest('PATCH', `/api/offices/${officeId}/services/${service!.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: 'Service updated successfully' });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update service', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({ title: 'Service title is required', variant: 'destructive' });
      return;
    }
    
    let price: number | null = null;
    if (formData.price) {
      const parsedPrice = Math.round(parseFloat(formData.price));
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        toast({ title: 'Price must be a valid positive number', variant: 'destructive' });
        return;
      }
      price = parsedPrice;
    }
    
    const data = {
      ...formData,
      officeId,
      price,
    };

    if (service) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Service Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g., Legal Consultation, Website Design"
          required
          data-testid="input-service-title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Describe what this service includes..."
          rows={3}
          data-testid="input-service-description"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Price (SAR)</Label>
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
          <Label htmlFor="priceType">Price Type</Label>
          <Select
            value={formData.priceType}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, priceType: value }))}
          >
            <SelectTrigger data-testid="select-service-pricetype">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Price</SelectItem>
              <SelectItem value="hourly">Per Hour</SelectItem>
              <SelectItem value="negotiable">Negotiable</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="Consulting, Legal, Design, etc."
            data-testid="input-service-category"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://..."
            data-testid="input-service-image"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            data-testid="switch-service-active"
          />
          <Label htmlFor="isActive" className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            Visible to visitors
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
            data-testid="switch-service-featured"
          />
          <Label htmlFor="isFeatured" className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            Featured service
          </Label>
        </div>
      </div>

      <DialogFooter className="gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-service">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!formData.title.trim() || createMutation.isPending || updateMutation.isPending}
          data-testid="button-save-service"
        >
          {service ? 'Update Service' : 'Add Service'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function ServiceGridCard({
  service,
  officeId,
  onEdit,
}: {
  service: OfficeService;
  officeId: number;
  onEdit: () => void;
}) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/offices/${officeId}/services/${service.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: 'Service deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete', description: error.message, variant: 'destructive' });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/offices/${officeId}/services/${service.id}`, {
        isFeatured: !service.isFeatured,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: service.isFeatured ? 'Removed from featured' : 'Added to featured' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/offices/${officeId}/services/${service.id}`, {
        isActive: !service.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: service.isActive ? 'Service hidden' : 'Service visible' });
    },
  });

  return (
    <Card 
      className={`group relative overflow-hidden hover-elevate transition-all ${
        !service.isActive ? 'opacity-60' : ''
      } ${service.isFeatured ? 'ring-2 ring-primary' : ''}`}
      data-testid={`card-showcase-service-${service.id}`}
    >
      {service.isFeatured && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="gap-1">
            <Sparkles className="h-3 w-3" />
            Featured
          </Badge>
        </div>
      )}
      
      <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5">
        {service.imageUrl ? (
          <img
            src={service.imageUrl}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-2">
          <Button size="sm" variant="secondary" onClick={onEdit} data-testid={`button-edit-service-${service.id}`}>
            <Pencil className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={() => toggleFeaturedMutation.mutate()}
            data-testid={`button-feature-service-${service.id}`}
          >
            <Star className={`h-3 w-3 mr-1 ${service.isFeatured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            {service.isFeatured ? 'Unfeature' : 'Feature'}
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{service.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => toggleActiveMutation.mutate()}
              data-testid={`button-toggle-active-${service.id}`}
            >
              {service.isActive ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-delete-service-${service.id}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Service</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{service.title}"? This will also remove all ratings and comments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-delete"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        
        {service.category && (
          <Badge variant="secondary" className="mb-2">
            <Tag className="h-3 w-3 mr-1" />
            {service.category}
          </Badge>
        )}
        
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {service.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-auto pt-2 border-t">
          {service.price ? (
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-bold">{service.price} SAR</span>
              {service.priceType && service.priceType !== 'fixed' && (
                <span className="text-sm text-muted-foreground">/{service.priceType}</span>
              )}
            </div>
          ) : (
            <Badge variant="outline">
              {service.priceType === 'free' ? 'Free' : 'Contact for price'}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            {service.isActive ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceListCard({
  service,
  officeId,
  onEdit,
}: {
  service: OfficeService;
  officeId: number;
  onEdit: () => void;
}) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/offices/${officeId}/services/${service.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
      toast({ title: 'Service deleted' });
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/offices/${officeId}/services/${service.id}`, {
        isFeatured: !service.isFeatured,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('PATCH', `/api/offices/${officeId}/services/${service.id}`, {
        isActive: !service.isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/offices', officeId, 'services'] });
    },
  });

  return (
    <Card 
      className={`hover-elevate ${!service.isActive ? 'opacity-60' : ''}`}
      data-testid={`card-list-service-${service.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
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
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{service.title}</h3>
              {service.isFeatured && (
                <Badge className="shrink-0 gap-1">
                  <Sparkles className="h-3 w-3" />
                  Featured
                </Badge>
              )}
              {!service.isActive && (
                <Badge variant="outline" className="shrink-0">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hidden
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {service.category && (
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {service.category}
                </span>
              )}
              {service.price && (
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {service.price} SAR
                  {service.priceType && service.priceType !== 'fixed' && ` / ${service.priceType}`}
                </span>
              )}
            </div>
            {service.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {service.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFeaturedMutation.mutate()}
              data-testid={`button-feature-list-${service.id}`}
            >
              <Star className={`h-4 w-4 ${service.isFeatured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleActiveMutation.mutate()}
              data-testid={`button-toggle-list-${service.id}`}
            >
              {service.isActive ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} data-testid={`button-edit-list-${service.id}`}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" data-testid={`button-delete-list-${service.id}`}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Service</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{service.title}"?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OfficeServicesPanel({ office }: { office: Office }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "hidden">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<OfficeService | null>(null);

  const { data: services = [], isLoading } = useQuery<OfficeService[]>({
    queryKey: ['/api/offices', office.id, 'services'],
  });

  const filteredServices = services
    .filter((s) => {
      if (filterActive === "active") return s.isActive;
      if (filterActive === "hidden") return !s.isActive;
      return true;
    })
    .filter((s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "price":
          return (b.price || 0) - (a.price || 0);
        case "featured":
          if (a.isFeatured === b.isFeatured) return 0;
          return a.isFeatured ? -1 : 1;
        case "createdAt":
          return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
        default:
          return 0;
      }
    });

  const stats = {
    total: services.length,
    active: services.filter((s) => s.isActive).length,
    featured: services.filter((s) => s.isFeatured).length,
    hidden: services.filter((s) => !s.isActive).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Services for {office.name}
          </h2>
          <p className="text-muted-foreground">
            Manage and showcase your office services
          </p>
        </div>
        <div className="flex items-center gap-2">
          {office.isPublished && (
            <a
              href={`/office/${office.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm" data-testid="button-preview-office">
                <ExternalLink className="h-4 w-4 mr-1" />
                Preview
              </Button>
            </a>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-service">
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>
                  Create a new service offering for your office
                </DialogDescription>
              </DialogHeader>
              <ServiceForm
                officeId={office.id}
                onSuccess={() => setIsAddDialogOpen(false)}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total Services</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.featured}</p>
              <p className="text-sm text-muted-foreground">Featured</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.hidden}</p>
              <p className="text-sm text-muted-foreground">Hidden</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-services"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filterActive} onValueChange={(v) => setFilterActive(v as typeof filterActive)}>
            <SelectTrigger className="w-[130px]" data-testid="select-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="hidden">Hidden</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[140px]" data-testid="select-sort">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">Featured First</SelectItem>
              <SelectItem value="title">By Name</SelectItem>
              <SelectItem value="price">By Price</SelectItem>
              <SelectItem value="createdAt">Newest</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="rounded-l-none"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              {viewMode === "grid" && <Skeleton className="h-40" />}
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery || filterActive !== "all" ? "No services found" : "No services yet"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              {searchQuery || filterActive !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Add your first service to showcase what your office offers to visitors"}
            </p>
            {!searchQuery && filterActive === "all" && (
              <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-service">
                <Plus className="h-4 w-4 mr-1" />
                Add Your First Service
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((service) => (
            <ServiceGridCard
              key={service.id}
              service={service}
              officeId={office.id}
              onEdit={() => setEditingService(service)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <ServiceListCard
              key={service.id}
              service={service}
              officeId={office.id}
              onEdit={() => setEditingService(service)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Service</DialogTitle>
            <DialogDescription>
              Update your service details
            </DialogDescription>
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
    </div>
  );
}

export default function OfficeServicesShowcase() {
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);

  const { data: offices = [], isLoading } = useQuery<Office[]>({
    queryKey: ['/api/offices'],
  });

  const selectedOffice = offices.find((o) => o.id === selectedOfficeId);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (offices.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Offices Found</h2>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You need to create an office first before you can add services. 
              Go to Office Management to create your virtual office.
            </p>
            <a href="/office-management">
              <Button data-testid="button-goto-office-management">
                <Building2 className="h-4 w-4 mr-2" />
                Go to Office Management
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedOffice) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Services Showcase</h1>
          <p className="text-muted-foreground">
            Select an office to manage and showcase its services
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offices.map((office) => (
            <Card
              key={office.id}
              className="cursor-pointer hover-elevate"
              onClick={() => setSelectedOfficeId(office.id)}
              data-testid={`card-select-office-${office.id}`}
            >
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-primary/5">
                {office.coverUrl ? (
                  <img
                    src={office.coverUrl}
                    alt={office.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="h-10 w-10 text-primary/40" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {office.isPublished ? (
                    <Badge className="bg-green-500">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg mb-1">{office.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {office.category || 'General'}
                </p>
                <Button className="w-full" data-testid={`button-manage-services-${office.id}`}>
                  <Package className="h-4 w-4 mr-2" />
                  Manage Services
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => setSelectedOfficeId(null)}
        data-testid="button-back-to-offices"
      >
        <Building2 className="h-4 w-4 mr-2" />
        Back to Offices
      </Button>
      <OfficeServicesPanel office={selectedOffice} />
    </div>
  );
}
