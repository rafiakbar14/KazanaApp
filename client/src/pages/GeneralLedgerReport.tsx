import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { FileText, Download, Printer } from "lucide-react";

interface GeneralLedgerLine {
  entryDate: string;
  transactionType: string;
  referenceNo: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

interface GeneralLedgerReport {
  account: {
    code: string;
    name: string;
  };
  dateFrom: string;
  dateTo: string;
  openingBalance: number;
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
  mutation: number;
  lines: GeneralLedgerLine[];
}

export default function GeneralLedgerReport() {
  const [accountId, setAccountId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0]
  );
  const [dateTo, setDateTo] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [branchId, setBranchId] = useState<string>("");

  // Fetch accounts list
  const { data: accounts } = useQuery({
    queryKey: ["/api/accounts"],
  });

  // Fetch branches list
  const { data: branches } = useQuery({
    queryKey: ["/api/branches"],
  });

  // Fetch report data
  const {
    data: report,
    isLoading,
    error,
    refetch,
  } = useQuery<GeneralLedgerReport>({
    queryKey: [
      "/api/reports/general-ledger",
      { accountId, dateFrom, dateTo, branchId },
    ],
    enabled: false, // Manual trigger
  });

  const handleGenerate = () => {
    if (!accountId || !dateFrom || !dateTo) {
      alert("Please fill in all required fields");
      return;
    }
    refetch();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // TODO: Implement Excel export
    alert("Export to Excel - Coming soon!");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">General Ledger Report</h1>
          <p className="text-muted-foreground">
            Buku Besar - Mutasi Rekening
          </p>
        </div>
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account">
                Account <span className="text-red-500">*</span>
              </Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account: any) => (
                    <SelectItem key={account.id} value={String(account.id)}>
                      {account.code} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">
                Date From <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">
                Date To <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="branch">Branch (Optional)</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger id="branch">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All branches</SelectItem>
                  {branches?.map((branch: any) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? "Generating..." : "Generate Report"}
            </Button>
            {report && (
              <>
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">
              Error: {error instanceof Error ? error.message : "Failed to generate report"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Display */}
      {report && (
        <Card className="print:shadow-none">
          <CardHeader className="print:pb-2">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">GENERAL LEDGER REPORT</h2>
              <h3 className="text-xl font-semibold">
                {report.account.code} - {report.account.name}
              </h3>
              <p className="text-muted-foreground">
                Period: {formatDate(report.dateFrom)} - {formatDate(report.dateTo)}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(report.openingBalance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Debit</p>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(report.totalDebit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Credit</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(report.totalCredit)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closing Balance</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(report.closingBalance)}
                </p>
              </div>
            </div>

            {/* Transaction Lines */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[120px]">Type</TableHead>
                    <TableHead className="w-[120px]">Ref No</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[120px]">Debit</TableHead>
                    <TableHead className="text-right w-[120px]">Credit</TableHead>
                    <TableHead className="text-right w-[120px]">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Opening Balance Row */}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell colSpan={4}>Opening Balance</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.openingBalance)}
                    </TableCell>
                  </TableRow>

                  {/* Transaction Lines */}
                  {report.lines.map((line, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">
                        {formatDate(line.entryDate)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {line.transactionType}
                      </TableCell>
                      <TableCell className="text-sm">
                        {line.referenceNo || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {line.description}
                      </TableCell>
                      <TableCell className="text-right text-sm text-green-600">
                        {line.debit > 0 ? formatCurrency(line.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm text-red-600">
                        {line.credit > 0 ? formatCurrency(line.credit) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatCurrency(line.balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted font-bold">
                    <TableCell colSpan={4}>Total</TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(report.totalDebit)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatCurrency(report.totalCredit)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.closingBalance)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={6} className="text-right font-medium">
                      Mutation (Debit - Credit):
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(report.mutation)}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {/* Footer */}
            <div className="text-sm text-muted-foreground text-center print:mt-8">
              <p>Generated on {new Date().toLocaleString("id-ID")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!report && !isLoading && !error && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select parameters and click "Generate Report" to view the General Ledger
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Made with Bob
