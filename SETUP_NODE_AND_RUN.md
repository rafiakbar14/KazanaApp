# 🔧 Setup Node.js dan Menjalankan Reporting System

## ❌ Problem: npm/npx tidak terdeteksi

Anda mendapat error:
```
npx : The term 'npx' is not recognized as the name of a cmdlet...
```

Ini berarti Node.js belum terinstall atau tidak ada di PATH Windows.

---

## ✅ Solusi 1: Install Node.js (RECOMMENDED)

### Step 1: Download Node.js
1. Buka browser ke: https://nodejs.org/
2. Download versi **LTS** (Long Term Support)
3. Pilih Windows Installer (.msi) - 64-bit

### Step 2: Install Node.js
1. Jalankan installer yang sudah didownload
2. Klik "Next" sampai selesai
3. **PENTING:** Centang "Automatically install necessary tools" jika ada

### Step 3: Restart Terminal
1. **Tutup semua PowerShell/Command Prompt yang terbuka**
2. Buka PowerShell baru
3. Test dengan command:
   ```powershell
   node --version
   npm --version
   ```
4. Jika muncul versi number (e.g., v20.11.0), berarti berhasil!

### Step 4: Jalankan Migration
```powershell
cd C:\Users\ASUS\Documents\Projects\Kazana\Stockify
npx tsx scripts/migrate-reporting-schema.ts
```

### Step 5: Start Development Server
```powershell
npm run dev
```

---

## ✅ Solusi 2: Manual SQL Migration (Jika Node.js tidak bisa diinstall)

Jika Anda tidak bisa install Node.js, gunakan SQL script manual:

### Step 1: Buka Database Tool
- Gunakan pgAdmin, DBeaver, atau tool PostgreSQL lainnya
- Connect ke database Stockify Anda

### Step 2: Run SQL Commands

```sql
-- ============================================
-- REPORTING SYSTEM DATABASE MIGRATION
-- ============================================

BEGIN;

-- 1. Update accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS normal_balance TEXT DEFAULT 'debit',
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES accounts(id),
ADD COLUMN IF NOT EXISTS is_header INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active INTEGER DEFAULT 1;

-- Make code unique
CREATE UNIQUE INDEX IF NOT EXISTS accounts_code_unique ON accounts(code);

-- Migrate old 'type' to 'account_type'
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

-- Set normal_balance
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

-- Migrate old columns
UPDATE journal_entries 
SET entry_date = date
WHERE entry_date IS NULL OR entry_date = NOW();

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

-- Create index
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
SELECT 'Accounts with account_type' as check_name, COUNT(*) as count 
FROM accounts WHERE account_type IS NOT NULL
UNION ALL
SELECT 'Journal lines', COUNT(*) FROM journal_lines
UNION ALL
SELECT 'Stock movements', COUNT(*) FROM stock_movements;
```

### Step 3: Verify Migration
Setelah run SQL di atas, check hasilnya:
```sql
-- Should show counts for each table
SELECT 'Accounts' as table_name, COUNT(*) as count FROM accounts
UNION ALL
SELECT 'Journal Lines', COUNT(*) FROM journal_lines
UNION ALL
SELECT 'Stock Movements', COUNT(*) FROM stock_movements;
```

---

## ✅ Solusi 3: Gunakan Replit/Online IDE

Jika tidak bisa install Node.js lokal:

1. **Upload project ke Replit.com**
   - Buat account di https://replit.com
   - Create new Repl → Import from GitHub
   - Paste repository URL

2. **Run di Replit**
   ```bash
   npm install
   npx tsx scripts/migrate-reporting-schema.ts
   npm run dev
   ```

3. **Access via Replit URL**
   - Replit akan provide URL untuk access aplikasi

---

## 🎯 Setelah Migration Berhasil

### Test API Endpoints

Gunakan browser atau Postman untuk test:

```
# Login dulu, lalu test endpoints ini:

GET http://localhost:5000/api/reports/general-ledger?accountId=1&dateFrom=2024-01-01&dateTo=2024-12-31

GET http://localhost:5000/api/reports/balance-sheet?dateAsOf=2024-12-31

GET http://localhost:5000/api/reports/profit-loss?dateFrom=2024-01-01&dateTo=2024-12-31

GET http://localhost:5000/api/reports/trial-balance?dateAsOf=2024-12-31

GET http://localhost:5000/api/reports/stock-movement?productId=1&dateFrom=2024-01-01&dateTo=2024-12-31
```

### Access General Ledger Report

1. Start server: `npm run dev`
2. Open browser: `http://localhost:5000`
3. Login dengan admin account
4. Navigate: **Accounting → General Ledger Report**
5. Select account, date range
6. Click "Generate Report"

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'tsx'"
```powershell
npm install -g tsx
```

### Error: "Database connection failed"
Check `.env` file:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/stockify
```

### Error: "Port 5000 already in use"
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Error: "Module not found" di frontend
```powershell
cd client
npm install
cd ..
npm run dev
```

---

## 📞 Need Help?

Jika masih ada masalah:

1. **Check Node.js Installation**
   ```powershell
   node --version
   npm --version
   ```
   Harus muncul version number

2. **Check Project Dependencies**
   ```powershell
   npm install
   ```

3. **Check Database Connection**
   ```powershell
   # Test database connection
   psql -U your_username -d stockify -c "SELECT 1"
   ```

4. **Check Environment Variables**
   - Pastikan file `.env` ada
   - Pastikan `DATABASE_URL` benar
   - Pastikan `SESSION_SECRET` ada

---

## 🎉 Summary

**Pilih salah satu solusi:**

1. ✅ **Install Node.js** (Recommended) - Paling mudah dan proper
2. ✅ **Manual SQL** - Jika tidak bisa install Node.js
3. ✅ **Use Replit** - Jika mau online development

Setelah migration berhasil, Reporting System siap digunakan! 🚀