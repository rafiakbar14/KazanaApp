import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccounting } from "@/hooks/use-accounting";
import { Loader2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function Accounts() {
  const { accounts, isLoadingAccounts, createAccount } = useAccounting();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "asset" as "asset" | "liability" | "equity" | "income" | "expense",
    description: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccount(formData);
      setIsOpen(false);
      setFormData({ code: "", name: "", type: "asset", description: "" });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoadingAccounts) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground">Daftar akun akuntansi untuk pembukuan profesional.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Tambah Akun
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Tambah Akun Baru</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="code">Kode Akun (COA)</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Contoh: 1101"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Akun</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Kas Kecil"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipe Akun</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: any) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">Aset (Asset)</SelectItem>
                      <SelectItem value="liability">Kewajiban (Liability)</SelectItem>
                      <SelectItem value="equity">Modal (Equity)</SelectItem>
                      <SelectItem value="income">Pendapatan (Income)</SelectItem>
                      <SelectItem value="expense">Beban (Expense)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Simpan Akun</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Deskripsi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-slate-500 italic">
                    Belum ada akun. Klik "Tambah Akun" untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((account) => (
                  <TableRow key={account.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono font-bold text-indigo-700">{account.code}</TableCell>
                    <TableCell className="font-medium text-slate-900">{account.name}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        account.type === "asset" ? "bg-blue-100 text-blue-700" :
                          account.type === "liability" ? "bg-red-100 text-red-700" :
                            account.type === "equity" ? "bg-purple-100 text-purple-700" :
                              account.type === "income" ? "bg-emerald-100 text-emerald-700" :
                                "bg-orange-100 text-orange-700"
                      )}>
                        {account.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-500 italic text-sm">{account.description || "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
