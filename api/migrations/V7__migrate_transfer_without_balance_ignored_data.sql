-- Update accounts that are in the TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS setting
-- This handles comma-separated account IDs by using LIKE pattern matching
UPDATE account
SET transfer_without_balance_ignored = 1
WHERE EXISTS (
    SELECT 1 FROM setting 
    WHERE key = 'TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS'
    AND (
        value = account.id 
        OR value LIKE account.id || ',%'
        OR value LIKE '%,' || account.id || ',%'
        OR value LIKE '%,' || account.id
    )
);

-- Delete the old setting
DELETE FROM setting WHERE key = 'TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS';