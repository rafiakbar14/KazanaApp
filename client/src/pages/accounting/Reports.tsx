import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccounting } from "@/hooks/use-accounting";
import { Loader2, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Reports() {
  const { balanceSheet, isLoadingBalanceSheet, profitLoss, isLoadingProfitLoss } = useAccounting();

  if (isLoadingBalanceSheet || isLoadingProfitLoss) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan Keuangan</h1>
        <p className="text-muted-foreground">Neraca dan Laba Rugi real-time berdasarkan SAK.</p>
      </div>

      <Tabs defaultValue="pl">
        <TabsList className="bg-slate-100/50 p-1">
          <TabsTrigger value="pl" className="gap-2"><TrendingUp className="w-4 h-4" /> Laba Rugi</TabsTrigger>
          <TabsTrigger value="bs" className="gap-2"><PieChart className="w-4 h-4" /> Neraca</TabsTrigger>
        </TabsList>

        <TabsContent value="pl" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-emerald-50/30 border-emerald-100">
              <CardHeader className="py-4">
                <CardDescription className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">Total Pendapatan</CardDescription>
                <CardTitle className="text-2xl text-emerald-700">Rp {profitLoss?.totalIncome.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-red-50/30 border-red-100">
              <CardHeader className="py-4">
                <CardDescription className="text-red-600 font-bold uppercase text-[10px] tracking-widest">Total Beban</CardDescription>
                <CardTitle className="text-2xl text-red-700">Rp {profitLoss?.totalExpense.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card className={profitLoss?.netProfit! >= 0 ? "bg-blue-50/30 border-blue-100" : "bg-amber-50/30 border-amber-100"}>
              <CardHeader className="py-4">
                <CardDescription className="text-blue-600 font-bold uppercase text-[10px] tracking-widest">Laba Bersih</CardDescription>
                <CardTitle className="text-2xl text-blue-800">Rp {profitLoss?.netProfit.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rincian Laba Rugi</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitLoss?.details.map((detail: any) => (
                    <TableRow key={detail.id}>
                      <TableCell className="font-medium">{detail.name}</TableCell>
                      <TableCell className="capitalize text-xs text-muted-foreground">{detail.type}</TableCell>
                      <TableCell className="text-right font-mono">
                        Rp {detail.balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bs" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Neraca Saldo</CardTitle>
              <CardDescription>Ringkasan aset, liabilitas, dan ekuitas.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Akun</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balanceSheet.map((account) => (
                    <TableRow key={account.id} className={account.balance === 0 ? "opacity-40" : ""}>
                      <TableCell className="font-mono text-xs">{account.code}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell className="capitalize text-xs text-muted-foreground">{account.type}</TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        Rp {account.balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
