#!/bin/bash
set -e

echo "🚀 Memulai proses deployment..."

# 1. Tarik perubahan terbaru
echo "📥 Menarik kode terbaru dari Git..."
git pull origin main

# 2. Instal dependensi dan Build
echo "📦 Menginstal dependensi..."
npm install
echo "🏗️ Membangun aplikasi (Build)..."
npm run build

# 3. Restart Container
echo "🐳 Merestart container Docker..."
docker compose up -d --build

# 4. Tunggu DB siap
echo "⏳ Menunggu database siap..."
sleep 5

# 5. Sinkronisasi Database (DI DALAM CONTAINER)
echo "🗄️ Sinkronisasi Database Schema..."
docker compose exec -T app npm run db:push || echo "⚠️ Peringatan: Sinkronisasi database gagal."

# 6. Perbaiki izin folder Uploads (Gunakan sudo jika perlu)
echo "📁 Mengatur izin folder uploads..."
mkdir -p uploads
sudo chmod -R 777 uploads || chmod -R 777 uploads

echo "✅ Deployment selesai!"
