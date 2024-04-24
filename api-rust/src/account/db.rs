use const_format::formatcp;
use rusqlite::Transaction;
use uuid::Uuid;
use crate::account::schema::{Account, NewAccount};
use crate::db::{list, single};

const ACCOUNT_COLUMNS: &str = "id, name, type";
const ACCOUNT_SELECT: &str = formatcp!("SELECT {} FROM account", ACCOUNT_COLUMNS);
const ACCOUNT_RETURNING: &str = formatcp!("RETURNING {}", ACCOUNT_COLUMNS);

pub fn create_account(transaction: &Transaction, new_account: NewAccount) -> anyhow::Result<Option<Account>> {
    return single(
        transaction,
        formatcp!("INSERT INTO account VALUES (?1, ?2, ?3) {}", ACCOUNT_RETURNING),
        [Uuid::new_v4().to_string(), new_account.name, new_account.account_type.to_string()]
    );
}

pub fn update_account(transaction: &Transaction, updated_account: Account) -> anyhow::Result<Option<Account>> {
    return single(
        transaction,
        formatcp!("UPDATE account SET name = ?1, type = ?2 WHERE id = ?3 {}", ACCOUNT_RETURNING),
        [updated_account.name, updated_account.account_type.to_string(), updated_account.id]
    );
}

pub fn delete_account(transaction: &Transaction, id: String) -> anyhow::Result<Option<Account>> {
    return single(
        transaction,
        formatcp!("DELETE FROM account WHERE id = ?1 {}", ACCOUNT_RETURNING),
        [id]
    );
}

pub fn get_account(transaction: &Transaction, id: String) -> anyhow::Result<Option<Account>> {
    return single(
        transaction,
        formatcp!("{} WHERE id = ?1", ACCOUNT_SELECT),
        [id]
    );
}

pub fn list_accounts(transaction: &Transaction) -> anyhow::Result<Vec<Account>> {
    return list(
        transaction,
        ACCOUNT_SELECT,
        []
    );
}