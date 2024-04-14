use actix_web::Error;
use const_format::formatcp;
use uuid::Uuid;
use crate::account::schema::{Account, NewAccount};
use crate::db::{list, Pool, single};

const ACCOUNT_COLUMNS: &str = "id, name, type";
const ACCOUNT_SELECT: &str = formatcp!("SELECT {} FROM account", ACCOUNT_COLUMNS);
const ACCOUNT_RETURNING: &str = formatcp!("RETURNING {}", ACCOUNT_COLUMNS);

pub async fn create_account(pool: &Pool, new_account: NewAccount) -> Result<Option<Account>, Error> {
    return single(
        pool,
        formatcp!("INSERT INTO account VALUES (?1, ?2, ?3) {}", ACCOUNT_RETURNING),
        [Uuid::new_v4().to_string(), new_account.name, new_account.account_type.to_string()]
    )
        .await;
}

pub async fn update_account(pool: &Pool, updated_account: Account) -> Result<Option<Account>, Error> {
    return single(
        pool,
        formatcp!("UPDATE account SET name = ?1, type = ?2 WHERE id = ?3 {}", ACCOUNT_RETURNING),
        [updated_account.name, updated_account.account_type.to_string(), updated_account.id]
    )
        .await;
}

pub async fn delete_account(pool: &Pool, id: String) -> Result<Option<Account>, Error> {
    return single(
        pool,
        formatcp!("DELETE FROM account WHERE id = ?1 {}", ACCOUNT_RETURNING),
        [id]
    )
        .await;
}

pub async fn get_account(pool: &Pool, id: String) -> Result<Option<Account>, Error> {
    return single(
        pool,
        formatcp!("{} WHERE id = ?1", ACCOUNT_SELECT),
        [id]
    )
        .await;
}

pub async fn list_accounts(pool: &Pool) -> Result<Vec<Account>, Error> {
    return list(
        pool,
        ACCOUNT_SELECT,
        []
    )
        .await;
}