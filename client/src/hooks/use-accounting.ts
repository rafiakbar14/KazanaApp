import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Account, JournalEntry, JournalItem, FixedAsset, InsertAccount, InsertJournalEntry, InsertJournalItem, InsertFixedAsset } from "@shared/schema";

export function useAccounting(branchId?: number) {
  const { toast } = useToast();

  const accountsQuery = useQuery<Account[]>({
    queryKey: [api.accounting.accounts.list.path],
  });

  const journalQuery = useQuery<(JournalEntry & { items: JournalItem[] })[]>({
    queryKey: [api.accounting.journal.list.path, branchId],
    queryFn: async () => {
      const url = buildUrl(api.accounting.journal.list.path, branchId ? { branchId } : {});
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch journal");
      return res.json();
    }
  });

  const assetsQuery = useQuery<FixedAsset[]>({
    queryKey: [api.accounting.assets.list.path],
  });

  const balanceSheetQuery = useQuery<(Account & { balance: number })[]>({
    queryKey: [api.accounting.reports.balanceSheet.path, branchId],
    queryFn: async () => {
      const url = buildUrl(api.accounting.reports.balanceSheet.path, branchId ? { branchId } : {});
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch balance sheet");
      return res.json();
    }
  });

  const profitLossQuery = useQuery<{ totalIncome: number; totalExpense: number; netProfit: number; details: any[] }>({
    queryKey: [api.accounting.reports.profitAndLoss.path, branchId],
    queryFn: async () => {
      const url = buildUrl(api.accounting.reports.profitAndLoss.path, branchId ? { branchId } : {});
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch P&L");
      return res.json();
    }
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: Omit<InsertAccount, "userId">) => {
      const res = await fetch(api.accounting.accounts.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat akun");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounting.accounts.list.path] });
      toast({ title: "Berhasil", description: "Akun baru telah dibuat" });
    },
  });

  const createJournalMutation = useMutation({
    mutationFn: async (data: { description: string; reference?: string; items: Partial<InsertJournalItem>[] }) => {
      const res = await fetch(api.accounting.journal.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal membuat jurnal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounting.journal.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounting.reports.balanceSheet.path] });
      queryClient.invalidateQueries({ queryKey: [api.accounting.reports.profitAndLoss.path] });
      toast({ title: "Berhasil", description: "Jurnal umum telah dicatat" });
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: Omit<InsertFixedAsset, "userId">) => {
      const res = await fetch(api.accounting.assets.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Gagal mencatat aset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.accounting.assets.list.path] });
      toast({ title: "Berhasil", description: "Aset tetap telah dicatat" });
    },
  });

  return {
    accounts: accountsQuery.data || [],
    isLoadingAccounts: accountsQuery.isLoading,
    journal: journalQuery.data || [],
    isLoadingJournal: journalQuery.isLoading,
    assets: assetsQuery.data || [],
    isLoadingAssets: assetsQuery.isLoading,
    balanceSheet: balanceSheetQuery.data || [],
    isLoadingBalanceSheet: balanceSheetQuery.isLoading,
    profitLoss: profitLossQuery.data,
    isLoadingProfitLoss: profitLossQuery.isLoading,
    createAccount: createAccountMutation.mutateAsync,
    createJournal: createJournalMutation.mutateAsync,
    createAsset: createAssetMutation.mutateAsync,
  };
}
