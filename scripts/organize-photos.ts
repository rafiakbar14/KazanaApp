import { db } from "../server/db";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MIN_AGE_DAYS = 3;
const REMOTE_NAME = "gdrive";
const REMOTE_BASE = "KazanaBackups/OrganizedPhotos";

// Helper to extract filename from URL (e.g. "/api/uploads/123.jpg" -> "123.jpg")
function getFilename(url: string | null): string | null {
    if (!url) return null;
    return path.basename(url);
}

const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');
const isDryRun = args.includes('--dry-run');

if (help) {
    console.log("Usage: npx tsx scripts/organize-photos.ts [options]");
    console.log("Options:");
    console.log("  --dry-run   Preview which files map to which branches without actually moving or deleting.");
    console.log("  --help      Show this help");
    process.exit(0);
}

async function organizePhotos() {
    console.log(`\n🚀 Starting Photo Organization & Backup...`);
    if (isDryRun) {
        console.log(`⚠️ DRY RUN MODE ENABLED. No files will be moved or deleted.`);
    }

    const masterDataFiles = new Set<string>();
    const transactionalFiles = new Map<string, string>(); // filename -> cabangName

    try {
        // --- 1. GATHER MASTER DATA (DO NOT TOUCH THESE FILES) ---
        console.log(`\n🔍 Scanning Master Data to protect...`);
        const productsList = await db.query.products.findMany({
            with: { photos: true }
        });
        
        productsList.forEach(p => {
            const f = getFilename(p.photoUrl);
            if (f) masterDataFiles.add(f);
            p.photos.forEach(ph => {
                const f2 = getFilename(ph.url);
                if (f2) masterDataFiles.add(f2);
            });
        });

        const settingsList = await db.query.settings.findMany();
        settingsList.forEach(s => {
            const f = getFilename(s.storeLogo);
            if (f) masterDataFiles.add(f);
        });

        const announcementsList = await db.query.announcements.findMany();
        announcementsList.forEach(a => {
            const f = getFilename(a.imageUrl);
            if (f) masterDataFiles.add(f);
        });

        console.log(`Protected Master Data Files: ${masterDataFiles.size}`);

        // --- 2. GATHER TRANSACTIONAL DATA & MAP TO CABANG ---
        console.log(`\n🔍 Scanning Transactional Photos...`);

        // A. Opname
        const opnameSess = await db.query.opnameSessions.findMany({
            with: { records: { with: { photos: true } } }
        });
        opnameSess.forEach(sess => {
            const cabang = (sess.locationType || "Toko").toUpperCase();
            sess.records.forEach(rec => {
                const f1 = getFilename(rec.photoUrl);
                if (f1 && !masterDataFiles.has(f1)) transactionalFiles.set(f1, cabang);
                
                rec.photos.forEach(ph => {
                    const f2 = getFilename(ph.url);
                    if (f2 && !masterDataFiles.has(f2)) transactionalFiles.set(f2, cabang);
                });
            });
        });

        // B. Inbound
        const inboundSess = await db.query.inboundSessions.findMany({
            with: { items: { with: { photos: true } } }
        });
        inboundSess.forEach(sess => {
            // Inbound defaults to Gudang context if no branch ID is present
            const cabang = "GUDANG_INBOUND";
            sess.items.forEach(item => {
                item.photos.forEach(ph => {
                    const f = getFilename(ph.url);
                    if (f && !masterDataFiles.has(f)) transactionalFiles.set(f, cabang);
                });
            });
        });

        // C. Outbound
        const outboundSess = await db.query.outboundSessions.findMany({
            with: { items: { with: { photos: true } }, toBranch: true }
        });
        outboundSess.forEach(sess => {
            const cabang = sess.toBranch?.name 
                ? `CABANG_${sess.toBranch.name.replace(/[^a-zA-Z0-9]/g, "_")}` 
                : "UNKNOWN_BRANCH";
            
            sess.items.forEach(item => {
                item.photos.forEach(ph => {
                    const f = getFilename(ph.url);
                    if (f && !masterDataFiles.has(f)) transactionalFiles.set(f, cabang);
                });
            });
        });

        console.log(`Mapped Transactional Photos: ${transactionalFiles.size}`);

        // --- 3. PROCESS PHYSICAL FILES ---
        console.log(`\n📂 Reading local 'uploads/' directory...`);
        if (!fs.existsSync(UPLOADS_DIR)) {
            console.log(`No uploads directory found at ${UPLOADS_DIR}`);
            process.exit(0);
        }

        const files = fs.readdirSync(UPLOADS_DIR);
        const threeDaysAgoMs = Date.now() - (MIN_AGE_DAYS * 24 * 60 * 60 * 1000);

        let movedCount = 0;
        let orphanDeletedCount = 0;
        let skippedMasterCount = 0;

        for (const file of files) {
            const filePath = path.join(UPLOADS_DIR, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) continue;

            // Protection check
            if (masterDataFiles.has(file)) {
                skippedMasterCount++;
                continue;
            }

            const epochMatch = file.match(/^(\d+)_/);
            let fileTimeMs = stat.mtimeMs;
            if (epochMatch && epochMatch[1]) {
                fileTimeMs = parseInt(epochMatch[1], 10);
            }
            
            const isOld = fileTimeMs < threeDaysAgoMs;
            const fileDate = new Date(fileTimeMs);
            const dateFolderName = `${fileDate.getFullYear()}-${String(fileDate.getMonth() + 1).padStart(2, '0')}-${String(fileDate.getDate()).padStart(2, '0')}`;

            if (transactionalFiles.has(file)) {
                // MOVE TO DRIVE
                const cabang = transactionalFiles.get(file)!;
                const remotePath = `${REMOTE_NAME}:${REMOTE_BASE}/${cabang}/${dateFolderName}`;
                
                if (isDryRun) {
                    console.log(`[DRY RUN] Would rclone move: ${file} -> ${remotePath}/`);
                    movedCount++;
                } else {
                    try {
                        console.log(`Moving ${file} to ${remotePath}/ ...`);
                        execSync(`rclone move "${filePath}" "${remotePath}/" --quiet`);
                        movedCount++;
                    } catch (error: any) {
                        console.error(`❌ Failed to move ${file}: ${error.message}`);
                    }
                }
            } else {
                // ORPHAN FILE (Not Master, Not Transactional)
                if (isOld) {
                    if (isDryRun) {
                        console.log(`[DRY RUN] Would DELETE OLD ORPHAN: ${file}`);
                        orphanDeletedCount++;
                    } else {
                        try {
                            console.log(`Deleting old orphan file: ${file}`);
                            fs.unlinkSync(filePath);
                            orphanDeletedCount++;
                        } catch (error: any) {
                            console.error(`❌ Failed to delete orphan ${file}: ${error.message}`);
                        }
                    }
                }
            }
        }

        console.log(`\n✅ Finished Processing!`);
        console.log(`-----------------------------------`);
        console.log(`Protected Master Data skipped : ${skippedMasterCount}`);
        console.log(`Transactional photos moved    : ${movedCount}`);
        console.log(`Old orphans deleted           : ${orphanDeletedCount}`);
        
    } catch (error) {
         console.error("\n💥 Fatal Error:", error);
         process.exit(1);
    } finally {
        process.exit(0);
    }
}

organizePhotos();
