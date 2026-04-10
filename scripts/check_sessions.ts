import { db } from "./server/db.js";
import * as schema from "./shared/schema.js";

async function main() {
    const sessions = await db.select().from(schema.sessions);
    console.log("Total Sessions:", sessions.length);
    sessions.forEach(s => {
        try {
            // sess is jsonb in postgres, but sessions.sess might be a string or object depending on driver
            const data = typeof s.sess === 'string' ? JSON.parse(s.sess) : s.sess;
            console.log("Session ID:", s.sid, "Passport User:", data?.passport?.user);
        } catch (e) {
            console.log("Failed to parse session:", s.sid);
        }
    });
    process.exit(0);
}
main();
