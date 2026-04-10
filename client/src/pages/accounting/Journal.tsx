import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccounting } from "@/hooks/use-accounting";
import { Loader2, Plus, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function Journal() {
  const { journal, isLoadingJournal, accounts, createJournal } = useAccounting();
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [items, setItems] = useState([{ accountId: 0, debit: 0, credit: 0 }]);

  const addItem = () => setItems([...items, { accountId: 0, debit: 0, credit: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const totalDebit = items.reduce((sum, item) => sum + (Number(item.debit) || 0), 0);
  const totalCredit = items.reduce((sum, item) => sum + (Number(item.credit) || 0), 0);
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    try {
      await createJournal({
        description,
        reference,
        items: items.map(item => ({
          ...item,
          debit: Number(item.debit) || 0,
          credit: Number(item.credit) || 0
        }))
      });
      setIsOpen(false);
      setDescription("");
      setReference("");
      setItems([{ accountId: 0, debit: 0, credit: 0 }]);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoadingJournal) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Jurnal Umum</h1>
          <p className="text-muted-foreground italic">Catatan rincian transaksi berbasis Double-Entry.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md">
              <Plus className="w-4 h-4" /> Entri Jurnal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Buat Entri Jurnal Baru</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Deskripsi Transaksi</Label>
                  <Input
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Contoh: Setoran Modal Awal"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Referensi (Opsional)</Label>
                  <Input
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Contoh: REF001"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="font-bold">Daftar Akun & Nominal</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-8 gap-1 border-indigo-200 text-indigo-700">
                    <Plus className="w-3 h-3" /> Tambah Baris
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs uppercase font-bold">Akun</TableHead>
                        <TableHead className="w-[150px] text-xs uppercase font-bold">Debit (Rp)</TableHead>
                        <TableHead className="w-[150px] text-xs uppercase font-bold">Kredit (Rp)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index} className="group">
                          <TableCell className="p-2">
                            <Select
                              value={String(item.accountId)}
                              onValueChange={(val) => updateItem(index, "accountId", Number(val))}
                            >
                              <SelectTrigger className="h-9 border-slate-200">
                                <SelectValue placeholder="Pilih Akun" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map(acc => (
                                  <SelectItem key={acc.id} value={String(acc.id)}>
                                    {acc.code} - {acc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={item.debit}
                              onChange={e => updateItem(index, "debit", e.target.value)}
                              className="h-9 border-slate-200 font-mono text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Input
                              type="number"
                              value={item.credit}
                              onChange={e => updateItem(index, "credit", e.target.value)}
                              className="h-9 border-slate-200 font-mono text-sm"
                            />
                          </TableCell>
                          <TableCell className="p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={items.length <= 2}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-xl flex items-center justify-between border-2 transition-all",
                isBalanced ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-red-50 border-red-100 text-red-800"
              )}>
                <div className="flex items-center gap-2">
                  {isBalanced ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                  <span className="font-bold text-sm">
                    {isBalanced ? "Jurnal Seimbang (Balanced)" : "Harus Seimbang (Debit = Kredit)"}
                  </span>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-right">
                    <p className="opacity-70 text-[10px] uppercase font-bold tracking-wider">Total Debit</p>
                    <p className="font-mono font-bold">Rp {totalDebit.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="opacity-70 text-[10px] uppercase font-bold tracking-wider">Total Kredit</p>
                    <p className="font-mono font-bold">Rp {totalCredit.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={!isBalanced}>
                  Simpan Jurnal Umum
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {journal.length === 0 ? (
          <Card className="border-dashed border-2 py-20 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium italic">Belum ada catatan jurnal umum.</p>
          </Card>
        ) : (
          journal.map((entry) => (
            <Card key={entry.id} className="border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="py-4 border-b bg-slate-50/30">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">{entry.description}</CardTitle>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span className="bg-slate-200 px-1.5 py-0.5 rounded font-mono font-bold text-[10px] uppercase tracking-tighter text-slate-700">REF: {entry.reference || "-"}</span>
                      <span>|</span>
                      <span>{format(new Date(entry.date), "dd MMMM yyyy HH:mm", { locale: id })}</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[120px] text-[10px] uppercase font-black text-slate-400">Kode Akun</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-slate-400">Nama Akun</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-black text-slate-400">Debit (Rp)</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-black text-slate-400">Kredit (Rp)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.items.map((item) => {
                      const account = accounts.find(a => a.id === item.accountId);
                      return (
                        <TableRow key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                          <TableCell className="font-mono text-xs font-bold text-indigo-700">{account?.code}</TableCell>
                          <TableCell className={cn("text-slate-700 font-medium", item.credit > 0 ? "pl-8 text-slate-500" : "")}>
                            {item.credit > 0 && "— "} {account?.name}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900">
                            {item.debit > 0 ? Number(item.debit).toLocaleString() : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-slate-900 text-opacity-70">
                            {item.credit > 0 ? Number(item.credit).toLocaleString() : "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
