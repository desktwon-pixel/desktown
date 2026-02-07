import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TransactionRow } from "@/components/TransactionRow";
import { KPICard } from "@/components/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Transaction } from "@shared/schema";
import { useLanguage, translations } from "@/lib/i18n";

export default function Finances() {
  const { language } = useLanguage();
  const t = translations[language];
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    category: "Supplies",
  });

  const categoryOptions = [
    { value: "Software", label: t.finances?.categorySoftware || "Software" },
    { value: "Meals", label: t.finances?.categoryMeals || "Meals" },
    { value: "Supplies", label: t.finances?.categorySupplies || "Supplies" },
    { value: "Travel", label: t.finances?.categoryTravel || "Travel" },
    { value: "Other", label: t.finances?.categoryOther || "Other" },
  ];

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: typeof newExpense) => {
      const amountValue = parseFloat(data.amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Invalid amount");
      }
      return await apiRequest("POST", "/api/transactions", {
        description: data.description,
        amount: -Math.round(amountValue * 100),
        type: "expense",
        category: data.category,
        status: "pending",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      setNewExpense({ description: "", amount: "", category: "Supplies" });
      setDialogOpen(false);
      toast({ title: t.finances?.expenseSubmitted || "Expense submitted", description: t.finances?.expenseSubmittedDesc || "Your expense has been submitted for approval." });
    },
    onError: () => {
      toast({ title: t.finances?.error || "Error", description: t.finances?.failedSubmitExpense || "Failed to submit expense.", variant: "destructive" });
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/transactions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({ title: t.finances?.transactionUpdated || "Transaction updated", description: t.finances?.transactionUpdatedDesc || "The transaction has been updated." });
    },
  });

  const handleSubmitExpense = () => {
    if (!newExpense.description.trim()) {
      toast({ title: t.finances?.error || "Error", description: t.finances?.descriptionRequired || "Description is required.", variant: "destructive" });
      return;
    }
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      toast({ title: t.finances?.error || "Error", description: t.finances?.invalidAmount || "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    createTransactionMutation.mutate(newExpense);
  };

  const handleApprove = (id: string) => {
    updateTransactionMutation.mutate({ id: parseInt(id), status: "approved" });
  };

  const handleReject = (id: string) => {
    updateTransactionMutation.mutate({ id: parseInt(id), status: "rejected" });
  };

  const pendingTransactions = transactions.filter((t) => t.status === "pending");
  const approvedTransactions = transactions.filter((t) => t.status === "approved");

  const formatAmount = (cents: number) => (cents / 100).toFixed(2);

  const totalRevenue = transactions
    .filter((t) => t.amount > 0 && t.status === "approved")
    .reduce((sum, t) => sum + t.amount, 0) / 100;

  const totalExpenses = transactions
    .filter((t) => t.amount < 0 && t.status === "approved")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 100;

  const pendingAmount = pendingTransactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 100;

  const getCategoryLabel = (category: string | null) => {
    const found = categoryOptions.find(opt => opt.value === category);
    return found?.label || category || (t.finances?.categoryOther || "Other");
  };

  const formatTransaction = (tx: Transaction) => ({
    id: String(tx.id),
    description: tx.description,
    amount: tx.amount / 100,
    category: getCategoryLabel(tx.category),
    date: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: "short", day: "numeric", year: "numeric" }) : "",
    status: tx.status as "pending" | "approved" | "rejected",
  });

  return (
    <div className="p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold">{t.finances?.title || "Financial Review"}</h1>
          <p className="text-muted-foreground mt-1">{t.finances?.subtitle || "Manage expenses and approvals"}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-submit-expense">
              <Plus className={`h-4 w-4 ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />
              {t.finances?.submitExpense || "Submit Expense"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.finances?.submitExpense || "Submit Expense"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">{t.finances?.description || "Description"}</Label>
                <Input
                  id="description"
                  placeholder={t.finances?.descriptionPlaceholder || "What is this expense for?"}
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  data-testid="input-expense-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t.finances?.amount || "Amount ($)"}</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    data-testid="input-expense-amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t.finances?.category || "Category"}</Label>
                  <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger data-testid="select-expense-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.finances?.cancel || "Cancel"}</Button>
              <Button 
                onClick={handleSubmitExpense} 
                disabled={createTransactionMutation.isPending}
                data-testid="button-confirm-expense"
              >
                {createTransactionMutation.isPending ? (t.finances?.submitting || "Submitting...") : (t.finances?.submit || "Submit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label={t.finances?.totalRevenue || "Total Revenue"}
          value={totalRevenue.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { style: "currency", currency: "USD" })}
          trend={15}
          trendUp
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KPICard
          label={t.finances?.totalExpenses || "Total Expenses"}
          value={totalExpenses.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { style: "currency", currency: "USD" })}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <KPICard
          label={t.finances?.pendingApproval || "Pending Approval"}
          value={pendingAmount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', { style: "currency", currency: "USD" })}
          icon={<Clock className="h-5 w-5" />}
        />
        <KPICard
          label={t.finances?.approvedThisMonth || "Approved This Month"}
          value={approvedTransactions.length}
          icon={<CheckCircle className="h-5 w-5" />}
        />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            {t.finances?.pendingApproval || "Pending Approval"} ({pendingTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            {t.finances?.allTransactions || "All Transactions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>{t.finances?.awaitingApproval || "Awaiting Your Approval"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full m-4" />
                ))
              ) : pendingTransactions.length > 0 ? (
                pendingTransactions.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    {...formatTransaction(transaction)}
                    showApprovalActions
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {t.finances?.noPendingApprovals || "No pending approvals"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>{t.finances?.transactionHistory || "Transaction History"}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full m-4" />
                ))
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} {...formatTransaction(transaction)} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {t.finances?.noTransactions || "No transactions yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
