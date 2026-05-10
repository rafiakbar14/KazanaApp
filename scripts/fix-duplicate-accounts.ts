import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Script untuk membersihkan duplicate account codes
 * Akan keep account dengan ID terkecil dan hapus yang lain
 */

async function fixDuplicateAccounts() {
  console.log("🔧 Starting Duplicate Accounts Cleanup...\n");

  try {
    // Step 1: Identify duplicates
    console.log("📊 Step 1: Identifying duplicate account codes...");
    const duplicates = await db.execute(sql`
      SELECT code, COUNT(*) as count, array_agg(id ORDER BY id) as ids
      FROM accounts
      GROUP BY code
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `);

    if (duplicates.rows.length === 0) {
      console.log("   ✓ No duplicates found! Database is clean.\n");
      return;
    }

    console.log(`   ⚠️  Found ${duplicates.rows.length} duplicate codes\n`);

    // Step 2: Show duplicates
    console.log("📋 Step 2: Duplicate codes summary:");
    for (const dup of duplicates.rows.slice(0, 10)) {
      console.log(`   - Code ${dup.code}: ${dup.count} duplicates (IDs: ${dup.ids})`);
    }
    if (duplicates.rows.length > 10) {
      console.log(`   ... and ${duplicates.rows.length - 10} more\n`);
    } else {
      console.log("");
    }

    // Step 3: Backup before cleanup
    console.log("💾 Step 3: Creating backup...");
    const backupData = await db.execute(sql`
      SELECT * FROM accounts WHERE code IN (
        SELECT code FROM accounts GROUP BY code HAVING COUNT(*) > 1
      )
      ORDER BY code, id
    `);
    console.log(`   ✓ Backed up ${backupData.rows.length} duplicate records\n`);

    // Step 4: Delete duplicates (keep the one with smallest ID)
    console.log("🗑️  Step 4: Removing duplicates (keeping oldest record for each code)...");
    
    let totalDeleted = 0;
    for (const dup of duplicates.rows) {
      // Parse the PostgreSQL array format: {1,2,3} -> [1,2,3]
      const idsString = dup.ids as string;
      const ids = idsString
        .replace(/[{}]/g, '') // Remove curly braces
        .split(',')
        .map(id => parseInt(id.trim()));
      
      const keepId = ids[0]; // Keep the first (oldest) ID
      const deleteIds = ids.slice(1); // Delete the rest

      if (deleteIds.length > 0) {
        // Delete one by one to avoid array casting issues
        for (const deleteId of deleteIds) {
          await db.execute(sql`
            DELETE FROM accounts
            WHERE id = ${deleteId}
          `);
        }
        
        totalDeleted += deleteIds.length;
        console.log(`   ✓ Code ${dup.code}: Kept ID ${keepId}, deleted ${deleteIds.length} duplicates`);
      }
    }

    console.log(`\n   ✅ Total deleted: ${totalDeleted} duplicate records\n`);

    // Step 5: Verify cleanup
    console.log("✅ Step 5: Verifying cleanup...");
    const remainingDuplicates = await db.execute(sql`
      SELECT code, COUNT(*) as count
      FROM accounts
      GROUP BY code
      HAVING COUNT(*) > 1
    `);

    if (remainingDuplicates.rows.length === 0) {
      console.log("   ✓ All duplicates removed successfully!\n");
    } else {
      console.log(`   ⚠️  Still have ${remainingDuplicates.rows.length} duplicate codes\n`);
    }

    // Step 6: Show final stats
    const totalAccounts = await db.execute(sql`SELECT COUNT(*) as count FROM accounts`);
    console.log("📊 Final Statistics:");
    console.log(`   - Total accounts: ${totalAccounts.rows[0].count}`);
    console.log(`   - Duplicates removed: ${totalDeleted}`);
    console.log(`   - Unique codes: ${totalAccounts.rows[0].count}\n`);

    console.log("✨ Cleanup completed successfully!\n");
    console.log("📝 Next step: Run migration again");
    console.log("   npm run db:migrate-reporting\n");

  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

// Run cleanup
fixDuplicateAccounts()
  .then(() => {
    console.log("✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

// Made with Bob
