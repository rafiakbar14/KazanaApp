# 🔧 Troubleshooting Guide - Stockify

## 📋 Common Issues and Solutions

### Issue 1: DATABASE_URL tidak ditemukan

**Error:**
```
[db] ERROR: DATABASE_URL tidak ditemukan di process.env!
Error: DATABASE_URL must be set (postgresql://user:pass@host:5432/dbname)
```

**Root Cause:**
Script TypeScript tidak memuat environment variables dari file `.env`

**Solution:**
✅ **SUDAH DIPERBAIKI** - Gunakan script npm yang sudah disediakan:
```bash
npm run db:migrate-reporting
```

Script ini menggunakan flag `--env-file=.env` untuk memuat environment variables.

---

### Issue 2: Connection Refused (ECONNREFUSED)

**Error:**
```
Error: connect ECONNREFUSED ::1:5433
Error: connect ECONNREFUSED 127.0.0.1:5433
```

**Root Cause:**
PostgreSQL database tidak berjalan di port 5433

**Solution:**

1. **Pastikan Docker Desktop berjalan**
   ```bash
   docker --version
   ```

2. **Start database container**
   ```bash
   docker-compose up -d db
   ```

3. **Verifikasi container berjalan**
   ```bash
   docker ps
   ```
   Harus melihat `stockify-db-dev` dengan status "Up"

📖 **Panduan lengkap:** [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)

---

### Issue 3: Duplicate Account Codes

**Error:**
```
❌ Migration failed: error: could not create unique index "accounts_code_unique"
detail: 'Key (code)=(2102) is duplicated.'
```

**Root Cause:**
Ada duplicate account codes di database (kemungkinan dari multiple imports atau multi-branch setup)

**Solution:**

1. **Jalankan cleanup script**
   ```bash
   npm run db:fix-duplicates
   ```

2. **Verifikasi cleanup berhasil**
   Script akan menampilkan:
   - Jumlah duplicate yang ditemukan
   - Duplicate codes yang akan dihapus
   - Konfirmasi cleanup berhasil

3. **Jalankan migration lagi**
   ```bash
   npm run db:migrate-reporting
   ```

**Manual Check (Optional):**
```bash
# Cek duplicate codes
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT code, COUNT(*) FROM accounts GROUP BY code HAVING COUNT(*) > 1;"

# Lihat detail duplicate
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT id, code, name FROM accounts WHERE code IN (SELECT code FROM accounts GROUP BY code HAVING COUNT(*) > 1) ORDER BY code, id;"
```

---

### Issue 4: Docker Desktop tidak bisa start

**Error:**
```
unable to get image 'postgres:16-alpine': failed to connect to the docker API
```

**Root Cause:**
Docker Desktop tidak terinstall atau tidak berjalan

**Solution:**

1. **Install Docker Desktop** (jika belum)
   - Download: https://www.docker.com/products/docker-desktop/
   - Install dengan opsi "Use WSL 2"

2. **Enable WSL 2** (Windows)
   ```powershell
   wsl --install
   wsl --update
   ```

3. **Start Docker Desktop**
   - Buka aplikasi Docker Desktop
   - Tunggu sampai status "Docker Desktop is running"

4. **Verifikasi**
   ```bash
   docker --version
   docker-compose --version
   ```

📖 **Panduan lengkap:** [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)

---

### Issue 5: Migration timeout atau hang

**Symptoms:**
Migration script berjalan tapi tidak ada progress atau hang

**Solution:**

1. **Cek database connection**
   ```bash
   docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT 1;"
   ```

2. **Cek database logs**
   ```bash
   docker-compose logs -f db
   ```

3. **Restart database**
   ```bash
   docker-compose restart db
   ```

4. **Jalankan migration lagi**
   ```bash
   npm run db:migrate-reporting
   ```

---

### Issue 6: Permission denied for table

**Error:**
```
Error: permission denied for table accounts
```

**Solution:**

```bash
# Access PostgreSQL CLI
docker exec -it stockify-db-dev psql -U postgres -d Qazanaid

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE "Qazanaid" TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

# Exit
\q
```

---

### Issue 7: Foreign key constraint violation

**Error:**
```
Error: update or delete on table "accounts" violates foreign key constraint
```

**Root Cause:**
Ada data yang reference ke account yang akan dihapus/diupdate

**Solution:**

1. **Backup database terlebih dahulu**
   ```bash
   docker exec stockify-db-dev pg_dump -U postgres Qazanaid > backup_before_fix.sql
   ```

2. **Identify foreign key references**
   ```bash
   docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "
   SELECT
     tc.table_name, 
     kcu.column_name,
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' 
     AND ccu.table_name = 'accounts';
   "
   ```

3. **Contact development team** untuk handling yang lebih aman

---

## 🔍 Diagnostic Commands

### Database Status

```bash
# Check if database is running
docker ps | grep stockify-db

# Check database logs
docker-compose logs db

# Check database connection
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT version();"
```

### Database Content

```bash
# Count accounts
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT COUNT(*) FROM accounts;"

# Check for duplicates
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT code, COUNT(*) FROM accounts GROUP BY code HAVING COUNT(*) > 1;"

# List all tables
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "\dt"

# Check table structure
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "\d accounts"
```

### Migration Status

```bash
# Check if journal_lines table exists
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'journal_lines');"

# Check if stock_movements table exists
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'stock_movements');"

# Count records in new tables
docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT 'journal_lines' as table, COUNT(*) as count FROM journal_lines UNION ALL SELECT 'stock_movements', COUNT(*) FROM stock_movements;"
```

## 🛠️ Recovery Procedures

### Restore from Backup

```bash
# Stop application
docker-compose stop app

# Restore database
docker exec -i stockify-db-dev psql -U postgres -d Qazanaid < backup.sql

# Restart application
docker-compose start app
```

### Reset Database (CAUTION: Will delete all data!)

```bash
# Stop all services
docker-compose down

# Remove volumes (deletes all data)
docker-compose down -v

# Start fresh
docker-compose up -d db

# Wait for database to be ready
sleep 5

# Run migrations
npm run db:migrate-reporting
```

## 📞 Getting Help

If you're still experiencing issues:

1. **Check logs:**
   ```bash
   docker-compose logs db
   ```

2. **Check documentation:**
   - [QUICK_START.md](QUICK_START.md)
   - [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)
   - [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

3. **Collect diagnostic information:**
   ```bash
   # System info
   docker --version
   docker-compose --version
   node --version
   npm --version
   
   # Database status
   docker ps
   docker-compose logs db --tail=50
   
   # Database content
   docker exec stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT COUNT(*) FROM accounts;"
   ```

4. **Contact development team** with the collected information

---

**Last Updated:** 2026-05-10  
**Version:** 1.0.0  
**Maintained by:** Development Team