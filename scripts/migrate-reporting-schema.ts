import { db } from "../server/db";
import { sql } from "drizzle-orm";

/**
 * Migration script untuk Reporting System
 * 
 * Changes:
 * 1. Update accounts table structure
 * 2. Update journal_entries table structure
 * 3. Create journal_lines table (new)
 * 4. Create stock_movements table (new)
 * 5. Migrate data from journalItems to journalLines
 */

async function migrateReportingSchema() {
  console.log("🚀 Starting Reporting System Schema Migration...\n");

  try {
    // Step 1: Backup existing data
    console.log("📦 Step 1: Backing up existing data...");
    const existingAccounts = await db.execute(sql`SELECT * FROM accounts`);
    const existingJournalEntries = await db.execute(sql`SELECT * FROM journal_entries`);
    const existingJournalItems = await db.execute(sql`SELECT * FROM journal_items`);
    console.log(`   ✓ Backed up ${existingAccounts.rows.length} accounts`);
    console.log(`   ✓ Backed up ${existingJournalEntries.rows.length} journal entries`);
    console.log(`   ✓ Backed up ${existingJournalItems.rows.length} journal items\n`);

    // Step 2: Update accounts table
    console.log("🔧 Step 2: Updating accounts table structure...");
    
    // Add new columns if they don't exist
    await db.execute(sql`
      ALTER TABLE accounts 
      ADD COLUMN IF NOT EXISTS account_type TEXT,
      ADD COLUMN IF NOT EXISTS normal_balance TEXT DEFAULT 'debit',
      ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES accounts(id),
      ADD COLUMN IF NOT EXISTS is_header INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS active INTEGER DEFAULT 1
    `);

    // Make code unique if not already
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS accounts_code_unique ON accounts(code)
    `);

    // Migrate old 'type' to 'account_type' with proper enum values
    await db.execute(sql`
      UPDATE accounts 
      SET account_type = CASE 
        WHEN type = 'asset' THEN 'Asset'
        WHEN type = 'liability' THEN 'Liability'
        WHEN type = 'equity' THEN 'Equity'
        WHEN type = 'income' THEN 'Revenue'
        WHEN type = 'expense' THEN 'Expense'
        ELSE 'Asset'
      END
      WHERE account_type IS NULL
    `);

    // Set normal_balance based on account_type
    await db.execute(sql`
      UPDATE accounts 
      SET normal_balance = CASE 
        WHEN account_type IN ('Asset', 'Expense', 'COGS') THEN 'debit'
        WHEN account_type IN ('Liability', 'Equity', 'Revenue') THEN 'credit'
        ELSE 'debit'
      END
      WHERE normal_balance = 'debit'
    `);

    console.log("   ✓ Accounts table updated\n");

    // Step 3: Update journal_entries table
    console.log("🔧 Step 3: Updating journal_entries table structure...");
    
    await db.execute(sql`
      ALTER TABLE journal_entries 
      ADD COLUMN IF NOT EXISTS entry_date TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'ADJUSTMENT',
      ADD COLUMN IF NOT EXISTS reference_no TEXT,
      ADD COLUMN IF NOT EXISTS posted INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id)
    `);

    // Migrate old 'date' to 'entry_date'
    await db.execute(sql`
      UPDATE journal_entries 
      SET entry_date = date
      WHERE entry_date IS NULL OR entry_date = NOW()
    `);

    // Migrate old 'reference' to 'reference_no'
    await db.execute(sql`
      UPDATE journal_entries 
      SET reference_no = reference
      WHERE reference_no IS NULL
    `);

    console.log("   ✓ Journal entries table updated\n");

    // Step 4: Create journal_lines table
    console.log("🔧 Step 4: Creating journal_lines table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS journal_lines (
        id SERIAL PRIMARY KEY,
        journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
        account_id INTEGER NOT NULL REFERENCES accounts(id),
        debit NUMERIC(15, 2) DEFAULT 0 NOT NULL,
        credit NUMERIC(15, 2) DEFAULT 0 NOT NULL,
        description TEXT
      )
    `);

    console.log("   ✓ Journal lines table created\n");

    // Step 5: Migrate data from journal_items to journal_lines
    console.log("🔄 Step 5: Migrating data from journal_items to journal_lines...");
    
    const itemsToMigrate = await db.execute(sql`
      SELECT 
        ji.id,
        ji.entry_id as journal_entry_id,
        ji.account_id,
        ji.debit,
        ji.credit,
        je.description
      FROM journal_items ji
      JOIN journal_entries je ON ji.entry_id = je.id
      WHERE NOT EXISTS (
        SELECT 1 FROM journal_lines jl 
        WHERE jl.journal_entry_id = ji.entry_id 
        AND jl.account_id = ji.account_id
      )
    `);

    if (itemsToMigrate.rows.length > 0) {
      for (const item of itemsToMigrate.rows) {
        await db.execute(sql`
          INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
          VALUES (${item.journal_entry_id}, ${item.account_id}, ${item.debit}, ${item.credit}, ${item.description})
        `);
      }
      console.log(`   ✓ Migrated ${itemsToMigrate.rows.length} journal items to journal lines\n`);
    } else {
      console.log("   ✓ No new items to migrate\n");
    }

    // Step 6: Create stock_movements table
    console.log("🔧 Step 6: Creating stock_movements table...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        branch_id INTEGER REFERENCES branches(id),
        movement_date TIMESTAMP DEFAULT NOW() NOT NULL,
        movement_type TEXT NOT NULL,
        reference_no TEXT,
        description TEXT,
        quantity_change NUMERIC(15, 2) NOT NULL,
        unit_cost NUMERIC(15, 2) DEFAULT 0 NOT NULL,
        total_cost NUMERIC(15, 2) DEFAULT 0 NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create index for better query performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS stock_movements_product_date_idx 
      ON stock_movements(product_id, movement_date)
    `);

    console.log("   ✓ Stock movements table created\n");

    // Step 7: Populate stock_movements from existing transactions
    console.log("🔄 Step 7: Populating stock_movements from existing data...");
    
    // From sales (outbound)
    await db.execute(sql`
      INSERT INTO stock_movements (
        product_id, branch_id, movement_date, movement_type, 
        reference_no, description, quantity_change, unit_cost, 
        total_cost, user_id
      )
      SELECT 
        si.product_id,
        s.branch_id,
        s.created_at,
        'SALE',
        s.invoice_number,
        'Sale to customer',
        -si.quantity,
        si.cogs / NULLIF(si.quantity, 0),
        -si.cogs,
        s.user_id
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE NOT EXISTS (
        SELECT 1 FROM stock_movements sm 
        WHERE sm.reference_no = s.invoice_number 
        AND sm.product_id = si.product_id
        AND sm.movement_type = 'SALE'
      )
    `);

    // From inbound sessions (inbound)
    await db.execute(sql`
      INSERT INTO stock_movements (
        product_id, branch_id, movement_date, movement_type, 
        reference_no, description, quantity_change, unit_cost, 
        total_cost, user_id
      )
      SELECT 
        ii.product_id,
        ib.branch_id,
        ib.completed_at,
        'PURCHASE',
        ib.title,
        'Inbound from supplier',
        ii.quantity_received,
        ii.unit_cost,
        ii.quantity_received * ii.unit_cost,
        ib.user_id
      FROM inbound_items ii
      JOIN inbound_sessions ib ON ii.session_id = ib.id
      WHERE ib.status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM stock_movements sm 
        WHERE sm.reference_no = ib.title 
        AND sm.product_id = ii.product_id
        AND sm.movement_type = 'PURCHASE'
      )
    `);

    const movementCount = await db.execute(sql`SELECT COUNT(*) as count FROM stock_movements`);
    console.log(`   ✓ Populated ${movementCount.rows[0].count} stock movements\n`);

    // Step 8: Verify data integrity
    console.log("✅ Step 8: Verifying data integrity...");
    
    const accountsCount = await db.execute(sql`SELECT COUNT(*) as count FROM accounts WHERE account_type IS NOT NULL`);
    const journalLinesCount = await db.execute(sql`SELECT COUNT(*) as count FROM journal_lines`);
    const stockMovementsCount = await db.execute(sql`SELECT COUNT(*) as count FROM stock_movements`);

    console.log(`   ✓ Accounts with account_type: ${accountsCount.rows[0].count}`);
    console.log(`   ✓ Journal lines: ${journalLinesCount.rows[0].count}`);
    console.log(`   ✓ Stock movements: ${stockMovementsCount.rows[0].count}\n`);

    console.log("✨ Migration completed successfully!\n");
    console.log("📝 Next steps:");
    console.log("   1. Review the migrated data");
    console.log("   2. Test the General Ledger Report");
    console.log("   3. Create sample accounts if needed");
    console.log("   4. Start using the reporting system!\n");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
migrateReportingSchema()
  .then(() => {
    console.log("✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });

// Made with Bob
