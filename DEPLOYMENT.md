# 🚀 Panduan Deployment Stockify ke Production

## 📋 Daftar Isi
1. [Persiapan Sebelum Deploy](#persiapan-sebelum-deploy)
2. [Setup Server Production](#setup-server-production)
3. [Deploy Aplikasi](#deploy-aplikasi)
4. [Monitoring & Maintenance](#monitoring--maintenance)
5. [Troubleshooting](#troubleshooting)

---

## 1️⃣ Persiapan Sebelum Deploy

### ✅ Checklist Pre-Deployment

- [ ] Semua fitur sudah ditest di local development
- [ ] Database backup sudah dibuat
- [ ] Environment variables sudah disiapkan
- [ ] SSL Certificate sudah ready (jika pakai HTTPS)
- [ ] Domain sudah pointing ke server IP
- [ ] Server sudah memenuhi minimum requirements

### 💻 Minimum Server Requirements

```
OS: Ubuntu 20.04+ / Debian 11+
RAM: 2GB minimum (4GB recommended)
Storage: 20GB minimum
CPU: 2 cores minimum
Node.js: v20.x
PostgreSQL: 14+
Nginx: Latest stable
PM2: Latest
```

---

## 2️⃣ Setup Server Production

### A. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install -y git
```

### B. Setup PostgreSQL Database

```bash
# Login ke PostgreSQL
sudo -u postgres psql

# Buat database dan user
CREATE DATABASE Qazanaid;
CREATE USER postgres WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE Qazanaid TO postgres;
\q

# Test koneksi
psql -U postgres -d Qazanaid -h localhost
```

### C. Setup Nginx

```bash
# Buat config file
sudo nano /etc/nginx/sites-available/stockify

# Paste config ini:
```

```nginx
server {
    listen 80;
    server_name kazana.web.id www.kazana.web.id;

    # Redirect HTTP to HTTPS (jika pakai SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Security headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Max upload size untuk foto
    client_max_body_size 50M;
    
    # Timeout settings
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/stockify /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### D. Setup SSL dengan Let's Encrypt (Optional tapi Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d kazana.web.id -d www.kazana.web.id

# Auto-renewal sudah disetup otomatis
# Test renewal:
sudo certbot renew --dry-run
```

---

## 3️⃣ Deploy Aplikasi

### A. Clone Repository

```bash
# Buat direktori untuk aplikasi
sudo mkdir -p /var/www/stockify
sudo chown -R $USER:$USER /var/www/stockify

# Clone repository
cd /var/www/stockify
git clone https://github.com/your-username/stockify.git .

# Atau jika sudah ada, pull latest changes
git pull origin main
```

### B. Setup Environment Variables

```bash
# Copy template .env
cp .env.production.example .env

# Edit .env dengan nano atau vim
nano .env
```

**PENTING! Isi semua variable ini:**

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Session Secret - GENERATE BARU!
# Generate dengan: node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
SESSION_SECRET=YOUR_GENERATED_SECRET_HERE

# Database - Sesuaikan dengan setup PostgreSQL Anda
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/Qazanaid

# Supabase (untuk upload foto)
SUPABASE_URL=https://vvnjsyajcqhudwdnlkzq.supabase.co
SUPABASE_ANON_KEY=your_supabase_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
VITE_GOOGLE_CLIENT_ID=your_google_client_id

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### C. Install Dependencies & Build

```bash
# Install dependencies (production only)
npm ci --production=false

# Build aplikasi
npm run build

# Verify build berhasil
ls -la dist/
# Harus ada: dist/index.cjs dan dist/public/
```

### D. Setup Database Schema

```bash
# Push schema ke database
npm run db:push

# Atau jika ada migration scripts
npm run db:migrate
```

### E. Start dengan PM2

```bash
# Start aplikasi
pm2 start npm --name "stockify" -- start

# Atau langsung dengan node
pm2 start dist/index.cjs --name "stockify"

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Jalankan command yang muncul (biasanya sudo ...)

# Check status
pm2 status
pm2 logs stockify
```

---

## 4️⃣ Monitoring & Maintenance

### A. Monitoring dengan PM2

```bash
# Check status
pm2 status

# View logs
pm2 logs stockify

# View logs realtime
pm2 logs stockify --lines 100

# Monitor resources
pm2 monit

# Restart aplikasi
pm2 restart stockify

# Stop aplikasi
pm2 stop stockify

# Delete dari PM2
pm2 delete stockify
```

### B. Database Backup

```bash
# Buat script backup otomatis
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/stockify"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U postgres -d Qazanaid > $BACKUP_DIR/db_backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Setup cron job (backup setiap hari jam 2 pagi)
crontab -e
# Tambahkan:
0 2 * * * /home/your_user/backup-db.sh >> /var/log/stockify-backup.log 2>&1
```

### C. Log Rotation

```bash
# Setup log rotation untuk PM2
sudo nano /etc/logrotate.d/pm2
```

```
/home/your_user/.pm2/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 your_user your_user
}
```

---

## 5️⃣ Update & Deployment Workflow

### 🔄 Cara Update Aplikasi ke Production

#### **Metode 1: Manual Update (Recommended untuk pemula)**

```bash
# 1. SSH ke server
ssh user@your-server-ip

# 2. Masuk ke direktori aplikasi
cd /var/www/stockify

# 3. Backup database dulu (PENTING!)
./backup-db.sh

# 4. Pull latest code
git pull origin main

# 5. Install dependencies baru (jika ada)
npm ci --production=false

# 6. Build ulang
npm run build

# 7. Restart aplikasi
pm2 restart stockify

# 8. Check logs untuk memastikan tidak ada error
pm2 logs stockify --lines 50
```

#### **Metode 2: Zero-Downtime Deployment**

```bash
# 1. SSH ke server
ssh user@your-server-ip

# 2. Masuk ke direktori aplikasi
cd /var/www/stockify

# 3. Backup database
./backup-db.sh

# 4. Pull latest code
git pull origin main

# 5. Install & build
npm ci --production=false
npm run build

# 6. Reload dengan PM2 (zero downtime)
pm2 reload stockify

# 7. Monitor
pm2 logs stockify
```

#### **Metode 3: Automated Deployment dengan Script**

Buat file `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/stockify"
APP_NAME="stockify"

cd $APP_DIR

# 1. Backup database
echo "📦 Creating database backup..."
./backup-db.sh

# 2. Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# 3. Install dependencies
echo "📦 Installing dependencies..."
npm ci --production=false

# 4. Run database migrations (if any)
echo "🗄️  Running database migrations..."
npm run db:push || true

# 5. Build application
echo "🔨 Building application..."
npm run build

# 6. Reload PM2
echo "🔄 Reloading application..."
pm2 reload $APP_NAME

# 7. Check status
echo "✅ Checking application status..."
sleep 3
pm2 status $APP_NAME

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "📊 View logs: pm2 logs $APP_NAME"
```

```bash
# Make executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### 📝 Pre-Deployment Checklist

Sebelum deploy, pastikan:

- [ ] ✅ Semua perubahan sudah di-commit dan push ke Git
- [ ] ✅ Database backup sudah dibuat
- [ ] ✅ Environment variables sudah benar
- [ ] ✅ Build berhasil di local (`npm run build`)
- [ ] ✅ Tidak ada TypeScript errors (`npm run check`)
- [ ] ✅ Sudah test di local development
- [ ] ✅ PM2 sudah running di server

### 🔙 Rollback Jika Ada Masalah

```bash
# 1. Check commit history
git log --oneline -10

# 2. Rollback ke commit sebelumnya
git reset --hard COMMIT_HASH

# 3. Rebuild
npm run build

# 4. Restart
pm2 restart stockify

# 5. Restore database jika perlu
gunzip /var/backups/stockify/db_backup_YYYYMMDD_HHMMSS.sql.gz
psql -U postgres -d Qazanaid < /var/backups/stockify/db_backup_YYYYMMDD_HHMMSS.sql
```

---

## 6️⃣ Troubleshooting

### ❌ Aplikasi tidak bisa diakses

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs stockify --lines 100

# Check Nginx status
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check port 5000 listening
sudo netstat -tulpn | grep 5000
```

### ❌ Database connection error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Test connection
psql -U postgres -d Qazanaid -h localhost

# Check DATABASE_URL di .env
cat .env | grep DATABASE_URL
```

### ❌ Build gagal

```bash
# Clear cache
rm -rf node_modules package-lock.json
npm cache clean --force

# Reinstall
npm install

# Try build again
npm run build
```

### ❌ Session tidak persist / logout terus

```bash
# Check session table di database
psql -U postgres -d Qazanaid
SELECT * FROM sessions LIMIT 5;

# Check SESSION_SECRET di .env
cat .env | grep SESSION_SECRET

# Restart aplikasi
pm2 restart stockify
```

### ❌ Upload foto gagal

```bash
# Check upload directory permissions
ls -la uploads_temp/

# Create if not exists
mkdir -p uploads_temp
chmod 755 uploads_temp

# Check Supabase credentials
cat .env | grep SUPABASE
```

---

## 📞 Support & Resources

- **Documentation**: [Link to your docs]
- **Issues**: [GitHub Issues]
- **Email**: support@kazana.web.id

---

## 🔐 Security Best Practices

1. ✅ Selalu gunakan HTTPS di production
2. ✅ Generate SESSION_SECRET yang kuat dan unik
3. ✅ Jangan commit file .env ke Git
4. ✅ Update dependencies secara berkala
5. ✅ Setup firewall (UFW)
6. ✅ Disable root SSH login
7. ✅ Setup fail2ban untuk proteksi brute force
8. ✅ Regular database backups
9. ✅ Monitor logs secara berkala
10. ✅ Keep server OS updated

---

**Last Updated**: 2026-05-10
**Version**: 1.0.0