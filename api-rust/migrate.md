To copy from the java version of the database use

echo .dump | sqlite3 database.db > schema.dump
cat schema.dump > sqlite3 database.db