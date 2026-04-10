import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccounting } from "@/hooks/use-accounting";
import { Loader2, Plus, Calculator, CalendarIcon, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Assets() {
  const { assets, isLoadingAssets, accounts, createAsset } = useAccounting();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    purchasePrice: 0,
    purchaseDate: format(new Date(), "yyyy-MM-dd"),
    usefulLifeMonths: 48,
    salvageValue: 0,
    assetAccountId: 0,
    expenseAccountId: 0,
    accumDeprAccountId: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAsset({
        ...formData,
        purchasePrice: Number(formData.purchasePrice),
        usefulLifeMonths: Number(formData.usefulLifeMonths),
        salvageValue: Number(formData.salvageValue),
        purchaseDate: new Date(formData.purchaseDate)
      });
      setIsOpen(false);
      setFormData({
        name: "",
        purchasePrice: 0,
        purchaseDate: format(new Date(), "yyyy-MM-dd"),
        usefulLifeMonths: 48,
        salvageValue: 0,
        assetAccountId: 0,
        expenseAccountId: 0,
        accumDeprAccountId: 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoadingAssets) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  const assetAccounts = accounts.filter(a => a.type === "asset");
  const expenseAccounts = accounts.filter(a => a.type === "expense");

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Aset Tetap</h1>
          <p className="text-muted-foreground">Tracking aset bisnis dan otomatisasi penyusutan (depresiasi).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 border-slate-200">
            <Calculator className="w-4 h-4 text-slate-500" /> Hitung Penyusutan
          </Button>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Registrasi Aset
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>Registrasi Aset Baru</DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2 border-b pb-4 col-span-2">
                    <Label>Nama Aset Tetap</Label>
                    <Input
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Laptop MacBook Pro"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Harga Perolehan (Rp)</Label>
                    <Input
                      type="number"
                      value={formData.purchasePrice}
                      onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tanggal Beli</Label>
                    <Input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Masa Manfaat (Bulan)</Label>
                    <Input
                      type="number"
                      value={formData.usefulLifeMonths}
                      onChange={e => setFormData({ ...formData, usefulLifeMonths: Number(e.target.value) })}
                      placeholder="Contoh: 48"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Nilai Residu (Opsional)</Label>
                    <Input
                      type="number"
                      value={formData.salvageValue}
                      onChange={e => setFormData({ ...formData, salvageValue: Number(e.target.value) })}
                    />
                  </div>

                  <div className="grid gap-2 col-span-2 pt-2">
                    <Label className="text-[11px] uppercase text-slate-400 font-bold">Pemetaan Akun Jurnal</Label>
                    <div className="grid gap-3">
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Akun Aset</Label>
                        <Select
                          value={String(formData.assetAccountId)}
                          onValueChange={val => setFormData({ ...formData, assetAccountId: Number(val) })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih Akun Aset" />
                          </SelectTrigger>
                          <SelectContent>
                            {assetAccounts.map(acc => (
                              <SelectItem key={acc.id} value={String(acc.id)}>{acc.code} - {acc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Akun Beban Penyusutan</Label>
                        <Select
                          value={String(formData.expenseAccountId)}
                          onValueChange={val => setFormData({ ...formData, expenseAccountId: Number(val) })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih Akun Beban" />
                          </SelectTrigger>
                          <SelectContent>
                            {expenseAccounts.map(acc => (
                              <SelectItem key={acc.id} value={String(acc.id)}>{acc.code} - {acc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Akun Akumulasi Penyusutan</Label>
                        <Select
                          value={String(formData.accumDeprAccountId)}
                          onValueChange={val => setFormData({ ...formData, accumDeprAccountId: Number(val) })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Pilih Akun Akumulasi" />
                          </SelectTrigger>
                          <SelectContent>
                            {assetAccounts.map(acc => (
                              <SelectItem key={acc.id} value={String(acc.id)}>{acc.code} - {acc.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="submit" className="w-full h-11 font-bold">Simpan Registrasi Aset</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" /> Daftar Aset Terdaftar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-bold text-slate-800">Nama Aset</TableHead>
                <TableHead className="font-bold text-slate-800">Tanggal Beli</TableHead>
                <TableHead className="text-right font-bold text-slate-800">Harga Perolehan</TableHead>
                <TableHead className="text-right font-bold text-slate-800">Akumulasi Penyusutan</TableHead>
                <TableHead className="text-right font-bold text-slate-800">Nilai Buku</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.map((asset) => {
                const purchaseDate = new Date(asset.purchaseDate);
                const monthsOwned = Math.max(0, (new Date().getFullYear() - purchaseDate.getFullYear()) * 12 + (new Date().getMonth() - purchaseDate.getMonth()));
                const monthlyDepr = asset.purchasePrice / asset.usefulLifeMonths;
                const accumulatedDepreciation = Math.min(asset.purchasePrice, monthsOwned * monthlyDepr);

                return (
                  <TableRow key={asset.id} className="hover:bg-slate-50/30 transition-colors">
                    <TableCell className="font-bold text-slate-900">{asset.name}</TableCell>
                    <TableCell className="text-slate-600 flex items-center gap-2">
                      <CalendarIcon className="w-3 h-3 opacity-40" />
                      {format(new Date(asset.purchaseDate), "dd MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-indigo-900">Rp {asset.purchasePrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-red-500 font-medium">Rp {accumulatedDepreciation.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono font-black text-slate-900 bg-slate-50/50">
                      Rp {(asset.purchasePrice - accumulatedDepreciation).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
              {assets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic bg-slate-50/10">
                    Belum ada aset tetap yang tercatat. Klik "Registrasi Aset" untuk memulai.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
