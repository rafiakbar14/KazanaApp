# ⚠️ PENTING: Node.js Belum Terinstall!

## 🔴 Problem

Anda mendapat error ini karena **Node.js belum terinstall di komputer Anda**:

```
node : The term 'node' is not recognized...
npm : The term 'npm' is not recognized...
npx : The term 'npx' is not recognized...
```

**Tanpa Node.js, Anda TIDAK BISA menjalankan development server.**

---

## ✅ SOLUSI: Install Node.js (WAJIB)

### Step 1: Download Node.js

1. **Buka browser** (Chrome/Edge/Firefox)
2. **Ketik di address bar:** `https://nodejs.org/`
3. **Klik tombol hijau besar:** "Download Node.js (LTS)"
   - Pilih yang **Windows Installer (.msi)**
   - Pilih yang **64-bit** (untuk Windows modern)
4. **Tunggu download selesai** (sekitar 30-50 MB)

### Step 2: Install Node.js

1. **Double-click file** yang sudah didownload (e.g., `node-v20.11.0-x64.msi`)
2. **Klik "Next"** di welcome screen
3. **Centang "I accept"** di license agreement
4. **Klik "Next"** untuk destination folder (biarkan default)
5. **Klik "Next"** untuk custom setup (biarkan default)
6. **PENTING:** Jika ada opsi **"Automatically install necessary tools"**, **CENTANG!**
7. **Klik "Install"**
8. **Tunggu sampai selesai** (2-3 menit)
9. **Klik "Finish"**

### Step 3: Restart PowerShell (PENTING!)

**WAJIB restart PowerShell agar Node.js terdeteksi!**

1. **Tutup semua PowerShell/Command Prompt** yang sedang terbuka
2. **Buka PowerShell baru:**
   - Press `Win + X`
   - Pilih "Windows PowerShell" atau "Terminal"

### Step 4: Verify Installation

```powershell
# Test apakah Node.js sudah terinstall
node --version

# Harus muncul: v20.11.0 (atau versi lain)
# Jika masih error, restart komputer!

# Test npm
npm --version

# Harus muncul: 10.2.4 (atau versi lain)
```

**Jika masih error setelah restart PowerShell:**
- **Restart komputer Anda**
- Buka PowerShell lagi
- Test `node --version` lagi

---

## 🚀 Setelah Node.js Terinstall

### Jalankan Migration

```powershell
# Navigate ke project folder
cd C:\Users\ASUS\Documents\Projects\Kazana\Stockify

# Install dependencies (jika belum)
npm install

# Run migration script
npx tsx scripts/migrate-reporting-schema.ts

# Start development server
npm run dev
```

### Access Application

1. **Tunggu sampai muncul:** "Server running on http://localhost:5000"
2. **Buka browser**
3. **Ketik:** `http://localhost:5000`
4. **Login** dengan admin account
5. **Navigate:** Accounting → General Ledger Report

---

## 🔧 Alternatif: Manual SQL Migration (Jika Tidak Bisa Install Node.js)

Jika Anda **TIDAK BISA** install Node.js (e.g., restricted computer), gunakan SQL manual:

### Step 1: Buka Database Tool

- **pgAdmin** (recommended)
- **DBeaver**
- **psql command line**
- Atau database tool lainnya

### Step 2: Connect ke Database Stockify

### Step 3: Copy & Run SQL Script Ini

```sql
-- ============================================
-- REPORTING SYSTEM DATABASE MIGRATION
-- Run this in your PostgreSQL database
-- ============================================

BEGIN;

-- 1. Update accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS normal_balance TEXT DEFAULT 'debit',
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS is_header INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active INTEGER DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS accounts_code_unique ON accounts(code);

UPDATE accounts 
SET account_type = CASE 
  WHEN type = 'asset' THEN 'Asset'
  WHEN type = 'liability' THEN 'Liability'
  WHEN type = 'equity' THEN 'Equity'
  WHEN type = 'income' THEN 'Revenue'
  WHEN type = 'expense' THEN 'Expense'
  ELSE 'Asset'
END
WHERE account_type IS NULL;

UPDATE accounts 
SET normal_balance = CASE 
  WHEN account_type IN ('Asset', 'Expense', 'COGS') THEN 'debit'
  WHEN account_type IN ('Liability', 'Equity', 'Revenue') THEN 'credit'
  ELSE 'debit'
END;

-- 2. Update journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS entry_date TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'ADJUSTMENT',
ADD COLUMN IF NOT EXISTS reference_no TEXT,
ADD COLUMN IF NOT EXISTS posted INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id);

UPDATE journal_entries 
SET entry_date = COALESCE(date, NOW())
WHERE entry_date IS NULL;

UPDATE journal_entries 
SET reference_no = reference
WHERE reference_no IS NULL;

-- 3. Create journal_lines table
CREATE TABLE IF NOT EXISTS journal_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  debit NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  credit NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  description TEXT
);

-- 4. Migrate data from journal_items to journal_lines
INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
SELECT 
  ji.entry_id,
  ji.account_id,
  ji.debit,
  ji.credit,
  je.description
FROM journal_items ji
JOIN journal_entries je ON ji.entry_id = je.id
WHERE NOT EXISTS (
  SELECT 1 FROM journal_lines jl 
  WHERE jl.journal_entry_id = ji.entry_id 
  AND jl.account_id = ji.account_id
);

-- 5. Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  branch_id INTEGER REFERENCES branches(id),
  movement_date TIMESTAMP DEFAULT NOW() NOT NULL,
  movement_type TEXT NOT NULL,
  reference_no TEXT,
  description TEXT,
  quantity_change NUMERIC(15, 2) NOT NULL,
  unit_cost NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  total_cost NUMERIC(15, 2) DEFAULT 0 NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS stock_movements_product_date_idx 
ON stock_movements(product_id, movement_date);

-- 6. Populate stock_movements from sales
INSERT INTO stock_movements (
  product_id, branch_id, movement_date, movement_type, 
  reference_no, description, quantity_change, unit_cost, 
  total_cost, user_id
)
SELECT 
  si.product_id,
  s.branch_id,
  s.created_at,
  'SALE',
  s.invoice_number,
  'Sale to customer',
  -si.quantity,
  CASE WHEN si.quantity != 0 THEN si.cogs / si.quantity ELSE 0 END,
  -si.cogs,
  s.user_id
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
WHERE NOT EXISTS (
  SELECT 1 FROM stock_movements sm 
  WHERE sm.reference_no = s.invoice_number 
  AND sm.product_id = si.product_id
  AND sm.movement_type = 'SALE'
);

-- 7. Populate stock_movements from inbound
INSERT INTO stock_movements (
  product_id, branch_id, movement_date, movement_type, 
  reference_no, description, quantity_change, unit_cost, 
  total_cost, user_id
)
SELECT 
  ii.product_id,
  ib.branch_id,
  COALESCE(ib.completed_at, ib.started_at),
  'PURCHASE',
  ib.title,
  'Inbound from supplier',
  ii.quantity_received,
  ii.unit_cost,
  ii.quantity_received * ii.unit_cost,
  ib.user_id
FROM inbound_items ii
JOIN inbound_sessions ib ON ii.session_id = ib.id
WHERE ib.status = 'completed'
AND NOT EXISTS (
  SELECT 1 FROM stock_movements sm 
  WHERE sm.reference_no = ib.title 
  AND sm.product_id = ii.product_id
  AND sm.movement_type = 'PURCHASE'
);

COMMIT;

-- Verify results
SELECT 'Migration Complete!' as status;
SELECT 'Accounts with account_type' as check_name, COUNT(*) as count 
FROM accounts WHERE account_type IS NOT NULL
UNION ALL
SELECT 'Journal lines', COUNT(*) FROM journal_lines
UNION ALL
SELECT 'Stock movements', COUNT(*) FROM stock_movements;
```

### Step 4: Verify Migration Success

Setelah run SQL, check hasilnya:

```sql
-- Should show counts
SELECT 
  'Accounts' as table_name, 
  COUNT(*) as count 
FROM accounts
UNION ALL
SELECT 'Journal Lines', COUNT(*) FROM journal_lines
UNION ALL
SELECT 'Stock Movements', COUNT(*) FROM stock_movements;
```

**TAPI INGAT:** Untuk menjalankan development server, **Anda TETAP PERLU Node.js!**

---

## ❓ FAQ

### Q: Kenapa harus install Node.js?
**A:** Stockify adalah aplikasi Node.js/TypeScript. Tanpa Node.js, Anda tidak bisa:
- Run development server
- Build production
- Install dependencies
- Run scripts

### Q: Apakah ada alternatif tanpa install Node.js?
**A:** Ya, gunakan **Replit.com** (online IDE):
1. Buat account di https://replit.com
2. Import project dari GitHub
3. Run di cloud (gratis)

### Q: Sudah install tapi masih error?
**A:** 
1. **Restart PowerShell** (tutup dan buka lagi)
2. **Restart komputer** jika masih error
3. Check PATH environment variable

### Q: Bagaimana check PATH?
**A:**
```powershell
$env:PATH -split ';' | Select-String node
```
Harus muncul path ke Node.js (e.g., `C:\Program Files\nodejs`)

---

## 🎯 Summary

**WAJIB INSTALL NODE.JS DULU!**

1. ✅ Download dari https://nodejs.org/
2. ✅ Install (klik Next sampai selesai)
3. ✅ Restart PowerShell
4. ✅ Test: `node --version`
5. ✅ Run migration: `npx tsx scripts/migrate-reporting-schema.ts`
6. ✅ Start server: `npm run dev`

**Atau gunakan SQL manual untuk migration (tapi tetap perlu Node.js untuk run server)**

**Atau gunakan Replit.com untuk development online**

---

## 📞 Need Help?

Jika masih ada masalah setelah install Node.js:

1. **Restart komputer**
2. **Check Node.js version:** `node --version`
3. **Check npm version:** `npm --version`
4. **Reinstall Node.js** jika perlu

Good luck! 🚀