# 🐳 Docker Setup Guide - Stockify

## 📋 Prerequisites

Sebelum memulai, pastikan sistem Anda memenuhi requirements:

### Windows Requirements
- **Windows 10/11** (64-bit): Pro, Enterprise, atau Education (Build 19041 atau lebih tinggi)
- **WSL 2** (Windows Subsystem for Linux 2) harus diaktifkan
- **Virtualization** harus diaktifkan di BIOS
- Minimal **4GB RAM** (8GB recommended)
- Minimal **20GB** disk space

## 🚀 Step-by-Step Installation

### Step 1: Enable WSL 2

1. **Buka PowerShell sebagai Administrator**
   - Klik kanan pada Start Menu
   - Pilih "Windows PowerShell (Admin)" atau "Terminal (Admin)"

2. **Install WSL 2**
   ```powershell
   wsl --install
   ```

3. **Restart komputer** setelah instalasi selesai

4. **Verifikasi WSL 2**
   ```powershell
   wsl --list --verbose
   ```

### Step 2: Download dan Install Docker Desktop

1. **Download Docker Desktop**
   - Kunjungi: https://www.docker.com/products/docker-desktop/
   - Klik "Download for Windows"
   - File size: ~500MB

2. **Install Docker Desktop**
   - Double-click file installer yang sudah didownload
   - Ikuti wizard instalasi
   - **Pastikan opsi "Use WSL 2 instead of Hyper-V" dicentang**
   - Klik "Ok" dan tunggu instalasi selesai

3. **Restart komputer** jika diminta

### Step 3: Start Docker Desktop

1. **Buka Docker Desktop**
   - Cari "Docker Desktop" di Start Menu
   - Klik untuk membuka aplikasi

2. **Tunggu Docker Engine Start**
   - Akan muncul icon Docker di system tray (pojok kanan bawah)
   - Tunggu sampai status berubah menjadi "Docker Desktop is running"
   - Proses ini bisa memakan waktu 1-2 menit

3. **Verifikasi Docker berjalan**
   ```powershell
   docker --version
   docker-compose --version
   ```

   Output yang diharapkan:
   ```
   Docker version 24.x.x, build xxxxxxx
   Docker Compose version v2.x.x
   ```

### Step 4: Setup PostgreSQL Database dengan Docker

1. **Buka Terminal/PowerShell** di directory project Stockify
   ```powershell
   cd C:\Users\ASUS\Documents\Projects\Kazana\Stockify
   ```

2. **Pastikan file `.env` sudah ada dan benar**
   ```powershell
   type .env
   ```
   
   Pastikan ada baris:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5433/Qazanaid
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DB=Qazanaid
   ```

3. **Start PostgreSQL container**
   ```powershell
   docker-compose up -d db
   ```

   Output yang diharapkan:
   ```
   [+] Running 2/2
    ✔ Network stockify_default       Created
    ✔ Container stockify-db-dev      Started
   ```

4. **Verifikasi container berjalan**
   ```powershell
   docker ps
   ```

   Anda harus melihat container `stockify-db-dev` dengan status "Up"

5. **Test koneksi database**
   ```powershell
   docker exec -it stockify-db-dev psql -U postgres -d Qazanaid -c "SELECT version();"
   ```

### Step 5: Jalankan Migration

Setelah database berjalan, jalankan migration:

```powershell
npm run db:migrate-reporting
```

Output yang diharapkan:
```
🚀 Starting Reporting System Schema Migration...

📦 Step 1: Backing up existing data...
   ✓ Backed up X accounts
   ✓ Backed up X journal entries
   ...
✨ Migration completed successfully!
```

## 🔧 Troubleshooting

### Error: "WSL 2 installation is incomplete"

**Solusi:**
1. Buka PowerShell sebagai Administrator
2. Jalankan:
   ```powershell
   wsl --update
   wsl --set-default-version 2
   ```
3. Restart komputer

### Error: "Hardware assisted virtualization and data execution protection must be enabled in the BIOS"

**Solusi:**
1. Restart komputer
2. Masuk ke BIOS (biasanya tekan F2, F10, atau Del saat booting)
3. Cari setting "Virtualization Technology" atau "Intel VT-x" atau "AMD-V"
4. Enable setting tersebut
5. Save dan exit BIOS

### Error: "Docker Desktop requires a newer WSL kernel version"

**Solusi:**
```powershell
wsl --update
```

### Error: "Cannot connect to the Docker daemon"

**Solusi:**
1. Pastikan Docker Desktop sudah berjalan (cek icon di system tray)
2. Jika belum, buka Docker Desktop dan tunggu sampai fully started
3. Jika masih error, restart Docker Desktop:
   - Klik kanan icon Docker di system tray
   - Pilih "Restart"

### Container tidak bisa start

**Solusi:**
1. Cek log container:
   ```powershell
   docker-compose logs db
   ```

2. Stop dan remove container:
   ```powershell
   docker-compose down
   ```

3. Start ulang:
   ```powershell
   docker-compose up -d db
   ```

## 📝 Useful Docker Commands

### Database Management

```powershell
# Start database
docker-compose up -d db

# Stop database
docker-compose stop db

# Restart database
docker-compose restart db

# Stop dan remove database (data akan hilang!)
docker-compose down

# Stop dan remove database + volumes (hapus semua data!)
docker-compose down -v

# View database logs
docker-compose logs -f db

# Access PostgreSQL CLI
docker exec -it stockify-db-dev psql -U postgres -d Qazanaid
```

### Container Management

```powershell
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs stockify-db-dev

# Stop container
docker stop stockify-db-dev

# Remove container
docker rm stockify-db-dev

# View container resource usage
docker stats stockify-db-dev
```

### Database Backup & Restore

```powershell
# Backup database
docker exec stockify-db-dev pg_dump -U postgres Qazanaid > backup.sql

# Restore database
docker exec -i stockify-db-dev psql -U postgres -d Qazanaid < backup.sql
```

## 🎯 Best Practices

1. **Selalu backup data sebelum migration**
   ```powershell
   docker exec stockify-db-dev pg_dump -U postgres Qazanaid > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql
   ```

2. **Monitor resource usage**
   - Docker Desktop > Settings > Resources
   - Adjust CPU, Memory, dan Disk sesuai kebutuhan

3. **Regular cleanup**
   ```powershell
   # Remove unused images
   docker image prune -a
   
   # Remove unused volumes
   docker volume prune
   ```

4. **Keep Docker Desktop updated**
   - Docker Desktop akan notify jika ada update
   - Update secara berkala untuk bug fixes dan improvements

## 🔄 Development Workflow

### Daily Workflow

1. **Start Docker Desktop** (jika belum berjalan)

2. **Start database**
   ```powershell
   docker-compose up -d db
   ```

3. **Start development server**
   ```powershell
   npm run dev
   ```

4. **Saat selesai development**
   ```powershell
   # Stop dev server (Ctrl+C)
   
   # Optional: Stop database untuk save resources
   docker-compose stop db
   ```

### Full Stack Development

```powershell
# Start semua services (app + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop semua services
docker-compose down
```

## 📞 Support

Jika mengalami masalah:
1. Cek Docker Desktop logs: Settings > Troubleshoot > View logs
2. Cek container logs: `docker-compose logs db`
3. Restart Docker Desktop
4. Restart komputer jika masalah berlanjut

## 📚 Related Documentation

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Database migration guide
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Last Updated:** 2026-05-10  
**Version:** 1.0.0  
**Maintained by:** Development Team