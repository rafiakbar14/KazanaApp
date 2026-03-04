import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

export class StorageService {
    private uploadDir = path.join(process.cwd(), 'uploads');

    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async uploadFile(fileBuffer: Buffer, fileName: string, contentType: string, shouldCompress = true): Promise<string> {
        // Create a unique filename to avoid collisions
        const uniqueFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
        const filePath = path.join(this.uploadDir, uniqueFileName);

        try {
            if (shouldCompress && contentType.startsWith('image/') && !contentType.includes('svg')) {
                // Compress image using sharp
                const processedBuffer = await sharp(fileBuffer)
                    .resize(1000, 1000, {
                        fit: 'inside',
                        withoutEnlargement: true
                    })
                    .jpeg({ quality: 60, progressive: true, force: false, mozjpeg: true })
                    .webp({ quality: 60, force: false })
                    .toBuffer();

                fs.writeFileSync(filePath, processedBuffer);
            } else {
                fs.writeFileSync(filePath, fileBuffer);
            }

            // Return the relative URL that the server can serve (via express.static)
            // Example: /uploads/123456789_test.jpg
            return `/uploads/${uniqueFileName}`;
        } catch (error: any) {
            throw new Error(`Local file upload failed: ${error.message}`);
        }
    }

    async deleteFile(url: string): Promise<void> {
        // Extract filename from the URL (e.g., /uploads/filename.jpg)
        const fileName = path.basename(url);
        const filePath = path.join(this.uploadDir, fileName);

        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (error: any) {
                console.error(`Failed to delete local file: ${error.message}`);
            }
        }
    }
}

export const storageService = new StorageService();
