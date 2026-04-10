#!/bin/bash

# Configuration
REMOTE_NAME="gdrive" # Ganti dengan nama remote rclone Anda
BACKUP_PATH="KazanaBackups"
LOCAL_UPLOADS_PATH="./uploads"
DATE=$(date +%Y-%m-%d_%H-%M-%S)

echo "--- Starting Backup and Cleanup: $DATE ---"

# 1. Backup Database (Opsional tapi sangat disarankan)
# Pastikan pg_dump terinstal di VPS
# PENGGUNAAN: pg_dump -U username dbname > backup.sql
echo "Membackup database..."
# Jika menggunakan Docker, gunakan perintah ini:
# docker exec kazana-db-1 pg_dump -U qazana Qazanaid > db_backup_$DATE.sql
# rclone copy db_backup_$DATE.sql $REMOTE_NAME:$BACKUP_PATH/database/
# rm db_backup_$DATE.sql

# 2. Pindahkan foto yang lebih tua dari 3 hari ke Google Drive
# Perintah 'move' akan menghapus file lokal SETELAH berhasil diupload
echo "Memindahkan foto > 3 hari ke Google Drive..."
rclone move "$LOCAL_UPLOADS_PATH" "$REMOTE_NAME:$BACKUP_PATH/uploads" --min-age 3d --progress

echo "--- Selesai: $(date) ---"
