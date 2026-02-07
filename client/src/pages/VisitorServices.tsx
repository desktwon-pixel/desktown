import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Package, 
  ArrowLeft, 
  ExternalLink,
  Building2,
  CreditCard,
} from "lucide-react";
import logoUrl from "@/assets/logo-welcome.png";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import type { Service } from "@shared/schema";

export default function VisitorServices() {
  const { language, isRTL } = useLanguage();

  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['/api/public/paid-services'],
  });

  const activeServices = services.filter(s => s.isActive && s.shareToken);

  return (
    <div className={`min-h-screen bg-[#0B0F19] text-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Link href="/welcome">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <img src={logoUrl} alt="DeskTown" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold text-white">DeskTown</span>
          </div>
        </header>

        {/* Title Section */}
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {language === 'ar' ? 'الخدمات المدفوعة' : 'Paid Services'}
          </h1>
          <p className="text-gray-400">
            {language === 'ar' ? 'اكتشف الخدمات المميزة المقدمة من مكاتبنا' : 'Discover premium services offered by our offices'}
          </p>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-[#1a1f2e] border-white/5 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-24 bg-white/5 rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activeServices.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {activeServices.map((service) => (
              <Card 
                key={service.id} 
                className="bg-[#1a1f2e] border-white/5 hover:border-amber-500/30 transition-colors"
                data-testid={`card-service-${service.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1">
                        {language === 'ar' && service.nameAr ? service.nameAr : service.name}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {language === 'ar' && service.descriptionAr ? service.descriptionAr : service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-amber-500/20 text-amber-400 border-0">
                          {(service.price / 100).toFixed(2)} SAR
                        </Badge>
                        <Link href={`/s/${service.shareToken}`}>
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300" data-testid={`button-view-service-${service.id}`}>
                            {language === 'ar' ? 'عرض' : 'View'}
                            <ExternalLink className={`h-3 w-3 ${isRTL ? 'mr-1' : 'ml-1'}`} />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-[#1a1f2e] border-white/5">
            <CardContent className="p-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'ar' ? 'لا توجد خدمات متاحة' : 'No Services Available'}
              </h3>
              <p className="text-gray-400 text-sm">
                {language === 'ar' ? 'تحقق لاحقاً للاطلاع على الخدمات الجديدة' : 'Check back later for new services'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Back to Welcome */}
        <div className="text-center pt-6">
          <Link href="/welcome">
            <Button variant="outline" className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10" data-testid="button-back-to-welcome">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Welcome'}
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
