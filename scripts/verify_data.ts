import { db } from "./server/db.js";
import * as schema from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function main() {
    const userId = "18c1e306-4222-4ebe-b430-41527dbb596c";
    const accs = await db.select().from(schema.accounts).where(eq(schema.accounts.userId, userId));
    const entries = await db.select().from(schema.journalEntries).where(eq(schema.journalEntries.userId, userId));
    const products = await db.select().from(schema.products).where(eq(schema.products.userId, userId));

    console.log("=== Verification for User:", userId, "===");
    console.log("Total Accounts:", accs.length);
    console.log("Total Journal Entries:", entries.length);
    console.log("Total Products:", products.length);
    console.log("First 3 Accounts:", JSON.stringify(accs.slice(0, 3), null, 2));
    process.exit(0);
}
main();
