import { Loader2 } from "lucide-react";
import { useLanguage, translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  text,
  fullScreen = false,
  className 
}: LoadingSpinnerProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base"
  };

  const displayText = text || (t.common?.loading || "Loading...");

  const spinner = (
    <div 
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="loading-spinner"
    >
      <Loader2 
        className={cn(
          sizeClasses[size],
          "animate-spin text-primary"
        )} 
      />
      <p className={cn(
        textSizeClasses[size],
        "text-muted-foreground animate-pulse"
      )}>
        {displayText}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface PageLoadingProps {
  message?: string;
}

export function PageLoading({ message }: PageLoadingProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const isRTL = language === 'ar';
  
  return (
    <div 
      className="flex-1 flex items-center justify-center min-h-[400px] p-8"
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="page-loading"
    >
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 mx-auto rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <p className="text-muted-foreground">
          {message || (t.common?.loading || "Loading...")}
        </p>
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
}

export function CardSkeleton({ count = 3 }: CardSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="rounded-lg border bg-card p-4 space-y-3"
          data-testid={`card-skeleton-${i}`}
        >
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
          <div className="h-20 bg-muted rounded animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 bg-muted rounded animate-pulse w-16" />
            <div className="h-6 bg-muted rounded animate-pulse w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
