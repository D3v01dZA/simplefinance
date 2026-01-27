-- Update accounts that are in the NO_REGULAR_BALANCE_ACCOUNTS setting
-- This handles comma-separated account IDs by using LIKE pattern matching
UPDATE account
SET no_regular_balance = 1
WHERE EXISTS (
    SELECT 1 FROM setting 
    WHERE key = 'NO_REGULAR_BALANCE_ACCOUNTS'
    AND (
        value = account.id 
        OR value LIKE account.id || ',%'
        OR value LIKE '%,' || account.id || ',%'
        OR value LIKE '%,' || account.id
    )
);

-- Delete the old setting
DELETE FROM setting WHERE key = 'NO_REGULAR_BALANCE_ACCOUNTS';