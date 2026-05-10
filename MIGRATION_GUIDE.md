# 📚 Database Migration Guide - Stockify

## 🎯 Overview

Panduan ini menjelaskan cara menjalankan database migration untuk Stockify, khususnya untuk Reporting System Schema Migration.

## 📋 Prerequisites

Sebelum menjalankan migration, pastikan:

1. ✅ **Node.js terinstal** (v18 atau lebih tinggi)
   ```bash
   node --version
   ```

2. ✅ **PostgreSQL database berjalan**
   - Untuk development: Port 5433 (sesuai `.env`)
   - Untuk production: Port 5432 (sesuai `.env.production.example`)

3. ✅ **Dependencies terinstal**
   ```bash
   npm install
   ```

4. ✅ **File `.env` sudah dikonfigurasi dengan benar**
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5433/Qazanaid
   ```

## 🚀 Cara Menjalankan Migration

### Reporting System Schema Migration

Migration ini akan:
- Update struktur tabel `accounts`
- Update struktur tabel `journal_entries`
- Membuat tabel baru `journal_lines`
- Membuat tabel baru `stock_movements`
- Migrasi data dari `journal_items` ke `journal_lines`
- Populate `stock_movements` dari transaksi yang ada

**Perintah:**
```bash
npm run db:migrate-reporting
```

**Output yang diharapkan:**
```
🚀 Starting Reporting System Schema Migration...

📦 Step 1: Backing up existing data...
   ✓ Backed up X accounts
   ✓ Backed up X journal entries
   ✓ Backed up X journal items

🔧 Step 2: Updating accounts table structure...
   ✓ Accounts table updated

🔧 Step 3: Updating journal_entries table structure...
   ✓ Journal entries table updated

🔧 Step 4: Creating journal_lines table...
   ✓ Journal lines table created

🔄 Step 5: Migrating data from journal_items to journal_lines...
   ✓ Migrated X journal items to journal lines

🔧 Step 6: Creating stock_movements table...
   ✓ Stock movements table created

🔄 Step 7: Populating stock_movements from existing data...
   ✓ Populated X stock movements

✅ Step 8: Verifying data integrity...
   ✓ Accounts with account_type: X
   ✓ Journal lines: X
   ✓ Stock movements: X

✨ Migration completed successfully!

📝 Next steps:
   1. Review the migrated data
   2. Test the General Ledger Report
   3. Create sample accounts if needed
   4. Start using the reporting system!

✅ All done!
```

## 🔧 Troubleshooting

### Error: DATABASE_URL tidak ditemukan

**Masalah:**
```
[db] ERROR: DATABASE_URL tidak ditemukan di process.env!
Error: DATABASE_URL must be set (postgresql://user:pass@host:5432/dbname)
```

**Solusi:**
1. Pastikan file `.env` ada di root directory project
2. Pastikan `DATABASE_URL` sudah diset dengan benar di `.env`
3. Jangan gunakan `npx tsx` langsung, gunakan `npm run db:migrate-reporting`

### Error: Connection refused

**Masalah:**
```
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Solusi:**
1. Pastikan PostgreSQL database sedang berjalan
2. Cek port yang digunakan (5433 untuk development, 5432 untuk production)
3. Verifikasi dengan:
   ```bash
   # Windows
   netstat -ano | findstr :5433
   
   # Linux/Mac
   lsof -i :5433
   ```

### Error: Database does not exist

**Masalah:**
```
Error: database "Qazanaid" does not exist
```

**Solusi:**
1. Buat database terlebih dahulu:
   ```sql
   CREATE DATABASE "Qazanaid";
   ```
2. Atau restore dari backup jika ada

### Error: Permission denied

**Masalah:**
```
Error: permission denied for table accounts
```

**Solusi:**
1. Pastikan user PostgreSQL memiliki permission yang cukup
2. Grant permission jika perlu:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE "Qazanaid" TO postgres;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
   ```

## 📝 Available Migration Scripts

| Script | Deskripsi | Command |
|--------|-----------|---------|
| **Reporting Schema** | Migrate reporting system schema | `npm run db:migrate-reporting` |
| **Fix Sequences** | Fix database sequences after import | `npm run db:fix-sequences` |
| **Push Schema** | Push Drizzle schema to database | `npm run db:push` |

## 🔄 Rollback Strategy

Jika migration gagal atau perlu rollback:

1. **Restore dari backup** (jika ada):
   ```bash
   psql -U postgres -d Qazanaid < backup.sql
   ```

2. **Manual rollback** (untuk reporting migration):
   ```sql
   -- Drop new tables
   DROP TABLE IF EXISTS stock_movements;
   DROP TABLE IF EXISTS journal_lines;
   
   -- Revert accounts table changes
   ALTER TABLE accounts DROP COLUMN IF EXISTS account_type;
   ALTER TABLE accounts DROP COLUMN IF EXISTS normal_balance;
   ALTER TABLE accounts DROP COLUMN IF EXISTS parent_id;
   ALTER TABLE accounts DROP COLUMN IF EXISTS is_header;
   ALTER TABLE accounts DROP COLUMN IF EXISTS active;
   
   -- Revert journal_entries table changes
   ALTER TABLE journal_entries DROP COLUMN IF EXISTS entry_date;
   ALTER TABLE journal_entries DROP COLUMN IF EXISTS transaction_type;
   ALTER TABLE journal_entries DROP COLUMN IF EXISTS reference_no;
   ALTER TABLE journal_entries DROP COLUMN IF EXISTS posted;
   ALTER TABLE journal_entries DROP COLUMN IF EXISTS branch_id;
   ```

## 🎯 Best Practices

1. **Selalu backup database sebelum migration**
   ```bash
   pg_dump -U postgres Qazanaid > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test di development environment terlebih dahulu**
   - Jangan langsung run di production
   - Verifikasi hasil migration

3. **Monitor log output**
   - Perhatikan error messages
   - Catat jumlah records yang di-migrate

4. **Verifikasi data setelah migration**
   ```sql
   -- Check accounts
   SELECT COUNT(*) FROM accounts WHERE account_type IS NOT NULL;
   
   -- Check journal_lines
   SELECT COUNT(*) FROM journal_lines;
   
   -- Check stock_movements
   SELECT COUNT(*) FROM stock_movements;
   ```

## 📞 Support

Jika mengalami masalah:
1. Cek log error dengan teliti
2. Verifikasi prerequisites
3. Coba troubleshooting steps di atas
4. Hubungi tim development jika masalah berlanjut

## 📚 Related Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [REPORTING_SYSTEM_SPEC.md](REPORTING_SYSTEM_SPEC.md) - Reporting system specification
- [REPORTING_IMPLEMENTATION_GUIDE.md](REPORTING_IMPLEMENTATION_GUIDE.md) - Implementation guide

---

**Last Updated:** 2026-05-10  
**Version:** 1.0.0  
**Maintained by:** Development Team