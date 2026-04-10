#!/bin/bash

# Pastikan skrip berhenti jika ada error
set -e

echo "🚀 Memulai proses deployment..."

# 1. Pastikan izin skrip ini sendiri aman (opsional tapi bagus)
chmod +x "$0"

# 2. Tarik perubahan terbaru
echo "📥 Menarik kode terbaru dari Git..."
git pull origin main

# 3. Instal dependensi
echo "📦 Menginstal dependensi..."
npm install

# 4. Build aplikasi
echo "🏗️ Membangun aplikasi (Build)..."
npm run build

# 5. Sinkronisasi Database
echo "🗄️ Sinkronisasi Database Schema..."
npm run db:push || echo "⚠️ Peringatan: Sinkronisasi database gagal, cek koneksi."

# 6. Perbaiki izin folder Uploads (Penting untuk foto)
echo "📁 Mengatur izin folder uploads..."
mkdir -p uploads
chmod -R 777 uploads

# Opsi A: Jika pakai Docker
if [ -f "docker-compose.yml" ]; then
    echo "🐳 Merestart container Docker..."
    docker compose up -d --build
fi

# Opsi B: Jika pakai PM2
if command -v pm2 &> /dev/null && [ -f "ecosystem.config.cjs" ]; then
    echo "🔄 Merestart aplikasi dengan PM2..."
    pm2 reload ecosystem.config.cjs --update-env
fi

echo "✅ Deployment selesai!"
