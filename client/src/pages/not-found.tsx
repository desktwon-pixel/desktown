import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useLanguage, translations } from "@/lib/i18n";

export default function NotFound() {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-background"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">404</h1>
              <h2 className="text-xl font-semibold text-foreground" data-testid="text-not-found-title">
                {isRTL ? "الصفحة غير موجودة" : "Page Not Found"}
              </h2>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6" data-testid="text-not-found-description">
            {isRTL 
              ? "عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها."
              : "Sorry, the page you're looking for doesn't exist or has been moved."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              data-testid="button-go-back"
            >
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {isRTL ? "رجوع" : "Go Back"}
            </Button>
            <Link href="/">
              <Button data-testid="button-go-home">
                <Home className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isRTL ? "الصفحة الرئيسية" : "Go Home"}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
