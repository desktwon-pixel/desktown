import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: number | string;
  trend?: number;
  trendUp?: boolean;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, trend, trendUp, icon }: KPICardProps) {
  return (
    <Card data-testid={`card-kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-semibold tracking-tight">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {trendUp ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trendUp ? "text-green-500" : "text-red-500"
                  )}
                >
                  {trendUp ? "+" : ""}{trend}%
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="p-3 rounded-md bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
