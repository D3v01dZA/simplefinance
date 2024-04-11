use actix_web::Error;
use const_format::formatcp;
use crate::db::{list, Pool};
use crate::transaction::schema::Transaction;

const TRANSACTION_COLUMNS: &str = "id, description, date, value, type, account_id, from_account_id";
const TRANSACTION_SELECT: &str = formatcp!("SELECT {} FROM account_transaction", TRANSACTION_COLUMNS);
const TRANSACTION_RETURNING: &str = formatcp!("RETURNING {}", TRANSACTION_COLUMNS);

pub async fn list_transactions(pool: &Pool) -> Result<Vec<Transaction>, Error> {
    return list(
        pool,
        TRANSACTION_SELECT,
        []
    )
        .await;
}