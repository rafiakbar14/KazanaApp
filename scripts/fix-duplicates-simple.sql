-- Fix Duplicate Account Codes
-- This script will delete duplicate accounts, keeping only the one with the smallest ID

-- Step 1: Show duplicates before cleanup
SELECT 'BEFORE CLEANUP - Duplicate Codes:' as status;
SELECT code, COUNT(*) as count, array_agg(id ORDER BY id) as ids
FROM accounts
GROUP BY code
HAVING COUNT(*) > 1
ORDER BY code;

-- Step 2: Delete duplicates (keep smallest ID)
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

-- Step 3: Show results after cleanup
SELECT 'AFTER CLEANUP - Remaining Duplicates (should be 0):' as status;
SELECT code, COUNT(*) as count
FROM accounts
GROUP BY code
HAVING COUNT(*) > 1;

-- Step 4: Show total accounts
SELECT 'TOTAL ACCOUNTS:' as status, COUNT(*) as count FROM accounts;

-- Made with Bob
