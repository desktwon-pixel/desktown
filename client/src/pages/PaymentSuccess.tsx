import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, ArrowRight } from "lucide-react";
import logoUrl from "@/assets/office-logo.png";

export default function PaymentSuccess() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoUrl} alt="DeskTown" className="h-9 w-9" />
          <span className="text-lg font-bold gradient-text">DeskTown</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-lg">
        <Card className="glass border-white/5 text-center" data-testid="card-payment-success">
          <CardHeader>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription className="text-base">
              Thank you for your purchase. Your order has been confirmed and you will receive an email confirmation shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400">
                Your payment has been processed successfully. The service provider will contact you soon with next steps.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="flex-1 gap-2"
                data-testid="button-go-home"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </Button>
              <Button
                onClick={() => window.location.href = '/storefront'}
                className="flex-1 gap-2"
                data-testid="button-browse-services"
              >
                Browse More Services
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
