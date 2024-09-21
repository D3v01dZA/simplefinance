To copy from the java version of the database use

Run and kill the app to create the db

```
echo .dump | sqlite3 old_database.db > schema.dump
grep -v "DATABASECHANGELOG" schema.dump > temp.dump && mv temp.dump schema.dump
grep -v "CREATE TABLE" schema.dump > temp.dump && mv temp.dump schema.dump
cat schema.dump | sqlite3 database.db
echo "UPDATE account_transaction SET value = '-' || (SELECT ac2.value FROM account_transaction ac2 WHERE ac2.id = account_transaction.id) WHERE id IN (SELECT ac3.id FROM account_transaction ac3 INNER JOIN account a ON ac3.account_id = a.id WHERE a.type IN ('LOAN', 'CREDIT_CARD') AND ac3.type = 'BALANCE');" | sqlite3 database.db
echo "UPDATE account_transaction SET value = '0' WHERE value = '-0' AND id IN (SELECT ac3.id FROM account_transaction ac3 INNER JOIN account a ON ac3.account_id = a.id WHERE a.type IN ('LOAN', 'CREDIT_CARD') AND ac3.type = 'BALANCE');" | sqlite3 database.db
echo "SELECT account_transaction.id, account_transaction.value FROM account_transaction INNER JOIN account ON account_transaction.account_id = account.id WHERE account.type IN ('LOAN', 'CREDIT_CARD') AND account_transaction.type = 'BALANCE';" | sqlite3 database.db
echo "UPDATE setting SET key = 'TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS' WHERE key = '1';" | sqlite3 database.db
echo "SELECT * FROM setting;" | sqlite3 database.db
rm schema.dump
rm old_database.db
```
