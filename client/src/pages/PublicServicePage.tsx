import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  Building2,
  CreditCard,
  ShoppingCart,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import type { Service, Office } from "@shared/schema";
import logoUrl from "@/assets/office-logo.png";

interface ServiceWithOffice extends Service {
  office: {
    id: number;
    name: string;
    logoUrl: string | null;
  } | null;
}

export default function PublicServicePage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [checkoutComplete, setCheckoutComplete] = useState(false);

  const { data: service, isLoading, error } = useQuery<ServiceWithOffice>({
    queryKey: ['/api/public/services', token],
    queryFn: async () => {
      const response = await fetch(`/api/public/services/${token}`);
      if (!response.ok) {
        throw new Error('Service not found');
      }
      return response.json();
    },
    enabled: !!token,
  });

  const checkoutMutation = useMutation({
    mutationFn: async (data: { clientName: string; clientEmail: string; clientPhone?: string }): Promise<{ checkoutUrl?: string }> => {
      const response = await apiRequest('POST', `/api/public/services/${token}/checkout`, data);
      return response.json();
    },
    onSuccess: (data: { checkoutUrl?: string }) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCheckoutComplete(true);
        toast({
          title: 'Order created',
          description: 'Your order has been created. Please check your email for payment instructions.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Checkout failed',
        description: error.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
    },
  });

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes('@')) {
      toast({ title: 'Valid email is required', variant: 'destructive' });
      return;
    }

    checkoutMutation.mutate({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <img src={logoUrl} alt="DeskTown" className="h-9 w-9" />
            <span className="text-lg font-bold gradient-text">DeskTown</span>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="glass border-white/5">
            <Skeleton className="h-64 rounded-t-lg bg-white/5" />
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-8 w-2/3 bg-white/5" />
              <Skeleton className="h-4 w-full bg-white/5" />
              <Skeleton className="h-4 w-3/4 bg-white/5" />
              <Skeleton className="h-12 w-48 bg-white/5" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <img src={logoUrl} alt="DeskTown" className="h-9 w-9" />
            <span className="text-lg font-bold gradient-text">DeskTown</span>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="glass border-white/5 p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold mb-2">Service Not Found</h3>
            <p className="text-muted-foreground mb-4">
              This service link may be invalid or the service is no longer available.
            </p>
            <Button onClick={() => window.location.href = '/'} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (checkoutComplete) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 flex items-center gap-3">
            <img src={logoUrl} alt="DeskTown" className="h-9 w-9" />
            <span className="text-lg font-bold gradient-text">DeskTown</span>
          </div>
        </header>
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <Card className="glass border-white/5 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Order Created!</h3>
            <p className="text-muted-foreground mb-6">
              Your order for "{service.name}" has been created. You will receive payment instructions via email.
            </p>
            <Button onClick={() => window.location.href = '/'} className="gap-2">
              Return to Homepage
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const priceInSAR = service.price / 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="DeskTown" className="h-9 w-9" />
            <span className="text-lg font-bold gradient-text">DeskTown</span>
          </div>
          {service.office && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{service.office.name}</span>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <Card className="glass border-white/5 overflow-hidden" data-testid="card-service-details">
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <Package className="h-20 w-20 text-amber-400/50" />
                </div>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{service.name}</h1>
                    {service.nameAr && (
                      <p className="text-lg text-muted-foreground" dir="rtl">{service.nameAr}</p>
                    )}
                  </div>
                  {service.category && (
                    <Badge variant="outline" className="shrink-0">
                      {service.category}
                    </Badge>
                  )}
                </div>

                {service.description && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">{service.description}</p>
                    {service.descriptionAr && (
                      <p className="text-muted-foreground text-sm" dir="rtl">{service.descriptionAr}</p>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t border-white/5">
                  <p className="text-3xl font-bold text-amber-400">
                    {priceInSAR.toFixed(2)} <span className="text-lg font-normal text-muted-foreground">SAR</span>
                  </p>
                </div>

                {service.office && (
                  <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                    {service.office.logoUrl ? (
                      <img
                        src={service.office.logoUrl}
                        alt={service.office.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{service.office.name}</p>
                      <p className="text-xs text-muted-foreground">Verified Provider</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="glass border-white/5" data-testid="card-checkout-form">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Complete Your Order
                </CardTitle>
                <CardDescription>
                  Fill in your details to proceed with the purchase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Full Name *</Label>
                    <Input
                      id="clientName"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Your full name"
                      required
                      data-testid="input-client-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Email Address *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      data-testid="input-client-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">Phone Number (Optional)</Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+966 5X XXX XXXX"
                      data-testid="input-client-phone"
                    />
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex justify-between items-center py-3 border-t border-b border-white/5">
                      <span className="text-muted-foreground">Total Amount</span>
                      <span className="text-xl font-bold text-amber-400">
                        {priceInSAR.toFixed(2)} SAR
                      </span>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gap-2"
                      disabled={checkoutMutation.isPending}
                      data-testid="button-checkout"
                    >
                      {checkoutMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Secure payment powered by Stripe. Your payment information is encrypted.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
