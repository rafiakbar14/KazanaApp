# 🚀 Quick Start Guide - Stockify

## ⚡ Ringkasan Masalah dan Solusi

### ❌ Error yang Anda Alami

```
Error: DATABASE_URL tidak ditemukan di process.env!
Error: DATABASE_URL must be set (postgresql://user:pass@host:5432/dbname)
```

Dan kemudian:

```
Error: connect ECONNREFUSED ::1:5433
Error: connect ECONNREFUSED 127.0.0.1:5433
```

### ✅ Root Cause

1. **Script migration tidak membaca file `.env`** ❌ → **SUDAH DIPERBAIKI** ✅
2. **PostgreSQL database tidak berjalan** ❌ → **PERLU DIJALANKAN**
3. **Docker Desktop tidak berjalan** ❌ → **PERLU DIINSTALL/START**

## 🎯 Solusi Lengkap (Step-by-Step)

### Step 1: Install Docker Desktop

1. **Download Docker Desktop**
   - Link: https://www.docker.com/products/docker-desktop/
   - Pilih "Download for Windows"

2. **Install Docker Desktop**
   - Jalankan installer
   - **PENTING:** Centang "Use WSL 2 instead of Hyper-V"
   - Ikuti wizard instalasi
   - Restart komputer jika diminta

3. **Verifikasi instalasi**
   ```powershell
   docker --version
   docker-compose --version
   ```

📖 **Panduan lengkap:** Lihat [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)

### Step 2: Start Docker Desktop

1. **Buka Docker Desktop** dari Start Menu
2. **Tunggu sampai status "Docker Desktop is running"**
   - Cek icon Docker di system tray (pojok kanan bawah)
   - Tunggu 1-2 menit untuk fully started

### Step 3: Start PostgreSQL Database

```powershell
# Pastikan Anda di directory project
cd C:\Users\ASUS\Documents\Projects\Kazana\Stockify

# Start database container
docker-compose up -d db
```

**Output yang diharapkan:**
```
[+] Running 2/2
 ✔ Network stockify_default       Created
 ✔ Container stockify-db-dev      Started
```

**Verifikasi database berjalan:**
```powershell
docker ps
```

Anda harus melihat container `stockify-db-dev` dengan status "Up"

### Step 4: Jalankan Migration

```powershell
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

... (dan seterusnya)

✨ Migration completed successfully!
```

## 🔍 Troubleshooting Cepat

### Docker Desktop tidak bisa start

**Cek WSL 2:**
```powershell
wsl --list --verbose
```

**Install/Update WSL 2:**
```powershell
wsl --install
wsl --update
```

### Database container tidak bisa start

**Cek logs:**
```powershell
docker-compose logs db
```

**Restart container:**
```powershell
docker-compose down
docker-compose up -d db
```

### Migration masih error "ECONNREFUSED"

**Pastikan database benar-benar berjalan:**
```powershell
# Cek container status
docker ps

# Test koneksi database
docker exec -it stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT 1;"
```

## 📝 Apa yang Sudah Diperbaiki

### 1. ✅ Script Migration (`package.json`)

**Sebelum:**
```json
// Tidak ada script untuk migration
```

**Sesudah:**
```json
{
  "scripts": {
    "db:migrate-reporting": "tsx --env-file=.env scripts/migrate-reporting-schema.ts"
  }
}
```

**Penjelasan:**
- Flag `--env-file=.env` memastikan environment variables dari file `.env` dimuat
- Sekarang `DATABASE_URL` bisa dibaca dengan benar oleh script

### 2. ✅ Dokumentasi Lengkap

Dibuat 3 file dokumentasi baru:

1. **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)**
   - Panduan lengkap menjalankan database migration
   - Troubleshooting common issues
   - Best practices

2. **[DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)**
   - Step-by-step install Docker Desktop
   - Setup PostgreSQL dengan Docker
   - Useful Docker commands

3. **[QUICK_START.md](QUICK_START.md)** (file ini)
   - Ringkasan masalah dan solusi
   - Quick reference untuk troubleshooting

## 🎓 Penjelasan Teknis

### Mengapa Error Terjadi?

1. **Script TypeScript tidak auto-load `.env`**
   - Ketika menjalankan `npx tsx script.ts`, environment variables tidak otomatis dimuat
   - Solusi: Gunakan flag `--env-file=.env` atau install package `dotenv`

2. **Database tidak berjalan**
   - File `.env` mengkonfigurasi database di `localhost:5433`
   - Port 5433 adalah port yang di-expose dari Docker container
   - Jika Docker tidak berjalan, tidak ada yang listening di port 5433

3. **Docker Desktop requirement**
   - Project ini menggunakan Docker untuk development environment
   - PostgreSQL berjalan di dalam Docker container
   - Tanpa Docker, database tidak bisa start

### Arsitektur Setup

```
┌─────────────────────────────────────────┐
│         Windows Host Machine            │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      Docker Desktop (WSL 2)       │ │
│  │                                   │ │
│  │  ┌─────────────────────────────┐ │ │
│  │  │  PostgreSQL Container       │ │ │
│  │  │  - Internal Port: 5432      │ │ │
│  │  │  - Exposed Port: 5433       │ │ │
│  │  │  - Database: Qazanaid       │ │ │
│  │  └─────────────────────────────┘ │ │
│  │                                   │ │
│  └───────────────────────────────────┘ │
│              ↑                          │
│              │ Port 5433                │
│              ↓                          │
│  ┌───────────────────────────────────┐ │
│  │   Node.js Application             │ │
│  │   - npm run dev                   │ │
│  │   - npm run db:migrate-reporting  │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## 📚 Next Steps

Setelah migration berhasil:

1. **Test aplikasi**
   ```powershell
   npm run dev
   ```

2. **Akses aplikasi**
   - Buka browser: http://localhost:5000

3. **Test General Ledger Report**
   - Login ke aplikasi
   - Navigate ke Reports > General Ledger

4. **Explore dokumentasi lainnya**
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment
   - [REPORTING_SYSTEM_SPEC.md](REPORTING_SYSTEM_SPEC.md) - Reporting system spec
   - [REPORTING_IMPLEMENTATION_GUIDE.md](REPORTING_IMPLEMENTATION_GUIDE.md) - Implementation guide

## 💡 Tips

### Daily Development Workflow

```powershell
# 1. Start Docker Desktop (jika belum berjalan)

# 2. Start database
docker-compose up -d db

# 3. Start development server
npm run dev

# 4. Saat selesai (optional)
docker-compose stop db
```

### Useful Commands

```powershell
# Cek status Docker
docker ps

# Cek logs database
docker-compose logs -f db

# Backup database
docker exec stockify-db-dev pg_dump -U postgres Qazanaid > backup.sql

# Restore database
docker exec -i stockify-db-dev psql -U postgres -d Qazanaid < backup.sql

# Access PostgreSQL CLI
docker exec -it stockify-db-dev psql -U postgres -d Qazanaid
```

## 📞 Need Help?

Jika masih mengalami masalah:

1. **Cek dokumentasi lengkap:**
   - [DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)
   - [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

2. **Cek logs:**
   ```powershell
   docker-compose logs db
   ```

3. **Restart everything:**
   ```powershell
   docker-compose down
   docker-compose up -d db
   npm run db:migrate-reporting
   ```

---

**Last Updated:** 2026-05-10  
**Version:** 1.0.0  
**Maintained by:** Development Team