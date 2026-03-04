import { db } from "../server/db";
import { opnameSessions } from "../shared/schema";
import { users } from "../shared/models/auth";
import { eq, and, lt, isNull } from "drizzle-orm";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Configuration
const DEFAULT_REMOTE_NAME = "gdrive";
const REMOTE_BASE_PATH = "KazanaBackups/Sessions";
const MIN_AGE_DAYS = 3;

async function runBackup() {
    console.log("--- Starting GDrive Multi-Account Session Backup ---");

    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - MIN_AGE_DAYS);

        // Find sessions: completed, older than 3 days, no gDriveUrl yet
        const sessionsToBackup = await db.query.opnameSessions.findMany({
            where: and(
                eq(opnameSessions.status, "completed"),
                lt(opnameSessions.startedAt, threeDaysAgo),
                isNull(opnameSessions.gDriveUrl)
            ),
            with: {
                records: {
                    with: {
                        photos: true
                    }
                }
            }
        });

        console.log(`Found ${sessionsToBackup.length} sessions to backup.`);

        for (const session of sessionsToBackup) {
            console.log(`Processing Session: ${session.title} (ID: ${session.id}) for Admin: ${session.userId}`);

            // Fetch admin's GDrive remote setting
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
                console.log(`No photos for session ${session.id}. Marking as backed up.`);
                await db.update(opnameSessions).set({ gDriveUrl: "no_photos" }).where(eq(opnameSessions.id, session.id));
                continue;
            }

            console.log(`Using Remote: ${remoteName} | Moving ${sessionPhotos.size} photos...`);

            let movedCount = 0;
            for (const photoUrl of sessionPhotos) {
                if (photoUrl.startsWith('/uploads/')) {
                    const localPath = path.join(process.cwd(), photoUrl.substring(1));
                    if (fs.existsSync(localPath)) {
                        try {
                            execSync(`rclone move "${localPath}" "${remoteFolderPath}/" --quiet`);
                            movedCount++;
                        } catch (moveErr) {
                            console.error(`Failed to move ${photoUrl} using ${remoteName}:`, (moveErr as Error).message);
                        }
                    }
                }
            }

            console.log(`Successfully moved ${movedCount} photos.`);

            // Generate public link to the folder
            try {
                const link = execSync(`rclone link "${remoteFolderPath}/"`).toString().trim();
                await db.update(opnameSessions).set({ gDriveUrl: link }).where(eq(opnameSessions.id, session.id));
                console.log(`✅ Success! GDrive Folder Link: ${link}`);
            } catch (linkErr) {
                await db.update(opnameSessions).set({ gDriveUrl: `backed_up_${session.id}` }).where(eq(opnameSessions.id, session.id));
                console.log(`⚠️ Photos moved, but could not generate public link via rclone.`);
            }
        }

        console.log("--- Backup Process Completed ---");
    } catch (err) {
        console.error("Backup failed:", err);
    } finally {
        process.exit(0);
    }
}

runBackup();
