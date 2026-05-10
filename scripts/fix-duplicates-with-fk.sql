-- Fix Duplicate Account Codes with Foreign Key Handling
-- This script will:
-- 1. Update all foreign key references to point to the account with smallest ID
-- 2. Delete duplicate accounts

BEGIN;

-- Step 1: Show duplicates before cleanup
SELECT 'BEFORE CLEANUP - Duplicate Codes:' as status;
SELECT code, COUNT(*) as count, array_agg(id ORDER BY id) as ids
FROM accounts
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY code;

-- Step 2: Update journal_items to reference the account with smallest ID
UPDATE journal_items ji
SET account_id = (
  SELECT MIN(a.id)
  FROM accounts a
  WHERE a.code = (
    SELECT code FROM accounts WHERE id = ji.account_id
  )
)
WHERE account_id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY code ORDER BY id) as rn
    FROM accounts
  ) t
  WHERE rn > 1
);

SELECT 'Updated journal_items references' as status;

-- Step 3: Update journal_entries if it has account_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'journal_entries' AND column_name = 'account_id'
  ) THEN
    UPDATE journal_entries je
    SET account_id = (
      SELECT MIN(a.id)
      FROM accounts a
      WHERE a.code = (
        SELECT code FROM accounts WHERE id = je.account_id
      )
    )
    WHERE account_id IN (
      SELECT id
      FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY code ORDER BY id) as rn
        FROM accounts
      ) t
      WHERE rn > 1
    );
    RAISE NOTICE 'Updated journal_entries references';
  END IF;
END $$;

-- Step 4: Delete duplicates (keep smallest ID)
DELETE FROM accounts
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY code ORDER BY id) as rn
    FROM accounts
  ) t
  WHERE rn > 1
);

SELECT 'Deleted duplicate accounts' as status;

-- Step 5: Show results after cleanup
SELECT 'AFTER CLEANUP - Remaining Duplicates (should be 0):' as status;
SELECT code, COUNT(*) as count
FROM accounts
GROUP BY code
HAVING COUNT(*) > 1;

-- Step 6: Show total accounts
SELECT 'TOTAL ACCOUNTS:' as status, COUNT(*) as count FROM accounts;

-- Step 7: Verify journal_items integrity
SELECT 'JOURNAL ITEMS WITH VALID ACCOUNTS:' as status, COUNT(*) as count
FROM journal_items ji
WHERE EXISTS (SELECT 1 FROM accounts a WHERE a.id = ji.account_id);

COMMIT;

SELECT '✅ Cleanup completed successfully!' as status;

-- Made with Bob
