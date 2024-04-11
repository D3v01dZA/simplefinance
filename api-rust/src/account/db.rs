use actix_web::Error;
use const_format::formatcp;
use crate::account::schema::Account;
use crate::db::{list, Pool};

const ACCOUNT_COLUMNS: &str = "id, name, type";
const ACCOUNT_SELECT: &str = formatcp!("SELECT {} FROM account", ACCOUNT_COLUMNS);
const ACCOUNT_RETURNING: &str = formatcp!("RETURNING {}", ACCOUNT_COLUMNS);

pub async fn list_accounts(pool: &Pool) -> Result<Vec<Account>, Error> {
    return list(
        pool,
        ACCOUNT_SELECT,
        []
    )
        .await;
}