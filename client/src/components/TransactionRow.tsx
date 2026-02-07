import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, ShoppingCart, Utensils, Monitor, FileText, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, translations } from "@/lib/i18n";

interface TransactionRowProps {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  status: "approved" | "pending" | "rejected";
  showApprovalActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Software: <Monitor className="h-4 w-4" />,
  Meals: <Utensils className="h-4 w-4" />,
  Revenue: <FileText className="h-4 w-4" />,
  Supplies: <Package className="h-4 w-4" />,
  default: <ShoppingCart className="h-4 w-4" />,
};

const statusStyles = {
  approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function TransactionRow({
  id,
  description,
  amount,
  category,
  date,
  status,
  showApprovalActions = false,
  onApprove,
  onReject,
}: TransactionRowProps) {
  const { language } = useLanguage();
  const t = translations[language];
  const isPositive = amount > 0;
  const icon = categoryIcons[category] || categoryIcons.default;

  const getStatusLabel = (s: "approved" | "pending" | "rejected") => {
    switch (s) {
      case "approved":
        return t.finances?.approved || "Approved";
      case "pending":
        return t.finances?.pending || "Pending";
      case "rejected":
        return t.finances?.rejected || "Rejected";
      default:
        return s;
    }
  };

  return (
    <div
      className="flex items-center gap-4 p-4 border-b last:border-b-0 hover-elevate"
      data-testid={`row-transaction-${id}`}
    >
      <div className="p-2 rounded-md bg-muted">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{description}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{category}</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className={cn("text-xs", statusStyles[status])}>
          {getStatusLabel(status)}
        </Badge>
        <span
          className={cn(
            "font-semibold tabular-nums",
            isPositive ? "text-green-600 dark:text-green-400" : "text-foreground"
          )}
        >
          {isPositive ? "+" : ""}{amount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { style: "currency", currency: "USD" })}
        </span>
        {showApprovalActions && status === "pending" && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600"
              onClick={() => onApprove?.(id)}
              data-testid={`button-approve-${id}`}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600"
              onClick={() => onReject?.(id)}
              data-testid={`button-reject-${id}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
