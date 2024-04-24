use const_format::formatcp;
use crate::db::{list};
use crate::transaction::schema::Transaction;

const TRANSACTION_COLUMNS: &str = "id, description, date, value, type, account_id, from_account_id";
const TRANSACTION_SELECT: &str = formatcp!("SELECT {} FROM account_transaction", TRANSACTION_COLUMNS);
const TRANSACTION_RETURNING: &str = formatcp!("RETURNING {}", TRANSACTION_COLUMNS);

pub fn list_transactions(transaction: &rusqlite::Transaction) -> anyhow::Result<Vec<Transaction>> {
    return list(
        transaction,
        TRANSACTION_SELECT,
        [],
    );
}