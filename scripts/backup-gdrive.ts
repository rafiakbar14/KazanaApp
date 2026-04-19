import { db } from "../server/db";
import { opnameSessions } from "../shared/schema";
import { users } from "../shared/models/auth";
import { eq, and, lt, isNull, or } from "drizzle-orm";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Configuration
const DEFAULT_REMOTE_NAME = "gdrive";
const REMOTE_BASE_PATH = "KazanaBackups/Sessions";
const MIN_AGE_DAYS = 3;

/**
 * Perform backup for a session or batch
 */
export async function processBackup(sessionId?: number, force: boolean = false) {
    const logs: string[] = [];
    const log = (msg: string) => {
        const entry = `${new Date().toISOString()}: ${msg}`;
        console.log(msg);
        logs.push(entry);
    };

    log(`--- Starting GDrive Backup (${sessionId ? `ID: ${sessionId}` : 'Batch'}) ---`);

    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - MIN_AGE_DAYS);

        let whereClause;
        if (sessionId) {
            whereClause = eq(opnameSessions.id, sessionId);
        } else {
            whereClause = and(
                eq(opnameSessions.status, "completed"),
                or(
                    lt(opnameSessions.startedAt, threeDaysAgo),
                    eq(opnameSessions.backupStatus, "pending")
                ),
                isNull(opnameSessions.gDriveUrl)
            );
        }

        const sessionsToBackup = await db.query.opnameSessions.findMany({
            where: whereClause,
            with: {
                records: {
                    with: {
                        photos: true
                    }
                }
            }
        });

        log(`Found ${sessionsToBackup.length} sessions to backup.`);

        for (const session of sessionsToBackup) {
            log(`Processing Session: ${session.title} (ID: ${session.id})`);

            // If already has gDriveUrl, skip unless forced
            if (session.gDriveUrl && !force) {
                log(`Session ${session.id} already has GDrive URL. Skipping.`);
                continue;
            }

            const [adminUser] = await db.select().from(users).where(eq(users.id, session.userId));
            const remoteName = adminUser?.gDriveRemote || DEFAULT_REMOTE_NAME;
            const folderName = `${session.id}_${session.title.replace(/[^a-z0-9]/gi, '_')}`;
            const remoteFolderPath = `${remoteName}:${REMOTE_BASE_PATH}/${folderName}`;

            const sessionPhotos = new Set<string>();
            for (const record of session.records) {
                if (record.photoUrl) sessionPhotos.add(record.photoUrl);
                if (record.photos) {
                    record.photos.forEach((p: any) => sessionPhotos.add(p.url));
                }
            }

            if (sessionPhotos.size === 0) {
                log(`No photos for session ${session.id}. Marking as moved.`);
                await db.update(opnameSessions).set({
                    gDriveUrl: "no_photos",
                    backupStatus: "moved",
                    backupLogs: logs.join('\n')
                }).where(eq(opnameSessions.id, session.id));
                continue;
            }

            log(`Using Remote: ${remoteName} | Moving ${sessionPhotos.size} photos...`);

            let movedCount = 0;
            for (const photoUrl of Array.from(sessionPhotos)) {
                if (photoUrl.startsWith('/uploads/')) {
                    const localPath = path.join(process.cwd(), photoUrl.substring(1));
                    if (fs.existsSync(localPath)) {
                        try {
                            log(`Moving ${photoUrl}...`);
                            execSync(`rclone move "${localPath}" "${remoteFolderPath}/" --quiet`);
                            movedCount++;
                        } catch (moveErr) {
                            log(`❌ ERROR moving ${photoUrl}: ${(moveErr as Error).message}`);
                        }
                    }
                }
            }

            log(`Successfully moved ${movedCount} photos.`);

            try {
                const link = execSync(`rclone link "${remoteFolderPath}/"`).toString().trim();
                await db.update(opnameSessions).set({
                    gDriveUrl: link,
                    backupStatus: "moved",
                    backupLogs: logs.join('\n')
                }).where(eq(opnameSessions.id, session.id));
                log(`✅ Success! Link: ${link}`);
            } catch (linkErr) {
                await db.update(opnameSessions).set({
                    gDriveUrl: `backed_up_${session.id}`,
                    backupStatus: "moved",
                    backupLogs: logs.join('\n')
                }).where(eq(opnameSessions.id, session.id));
                log(`⚠️ Photos moved, but link failed.`);
            }
        }

        log("--- Backup Process Completed ---");
    } catch (err) {
        log(`CRITICAL ERROR: ${(err as Error).message}`);
    }
}

// CLI Support
const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');
const force = args.includes('--force') || args.includes('-f');
const sessionId = args.find(a => a.startsWith('--id='))?.split('=')[1];

if (help) {
    console.log("Usage: npx tsx scripts/backup-gdrive.ts [options]");
    console.log("Options:");
    console.log("  --id=ID    Specific session ID to backup");
    console.log("  --force    Force backup even if already backed up or new");
    console.log("  --help     Show this help");
    process.exit(0);
}

const _filename = typeof import.meta !== 'undefined' && import.meta.url ? fileURLToPath(import.meta.url) : __filename;
const isMain = process.argv[1] &&
    !process.argv[1].endsWith('index.cjs') && // Don't run if we are in the production bundle
    (
        fs.realpathSync(process.argv[1]) === fs.realpathSync(_filename) ||
        process.argv[1].endsWith('backup-gdrive.ts')
    );

if (isMain) {
    processBackup(sessionId ? Number(sessionId) : undefined, force)
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
