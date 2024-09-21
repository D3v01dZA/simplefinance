use anyhow::anyhow;
use const_format::formatcp;
use rusqlite::Transaction;
use uuid::Uuid;
use crate::account::schema::{Account, NewAccount};
use crate::db::{list, single};

const ACCOUNT_COLUMNS: &str = "id, name, type";
const ACCOUNT_SELECT: &str = formatcp!("SELECT {ACCOUNT_COLUMNS} FROM account");
const ACCOUNT_RETURNING: &str = formatcp!("RETURNING {ACCOUNT_COLUMNS}");
const ACCOUNT_ORDERING: &str = "ORDER BY type, name ASC";

pub fn create_account(transaction: &Transaction, new_account: NewAccount) -> anyhow::Result<Option<Account>> {
    return single(
        transaction,
        formatcp!("INSERT INTO account ({ACCOUNT_COLUMNS}) VALUES (?1, ?2, ?3) {ACCOUNT_RETURNING}"),
        [Uuid::new_v4().to_string(), new_account.name.clone(), new_account.account_type.to_string()]
    );
}

pub fn update_account(transaction: &Transaction, updated_account: Account) -> anyhow::Result<Option<Account>> {
    return single(
        transaction,
        formatcp!("UPDATE account SET name = ?1, type = ?2 WHERE id = ?3 {ACCOUNT_RETURNING}"),
        [updated_account.name, updated_account.account_type.to_string(), updated_account.id]
    );
}

pub fn delete_account(transaction: &Transaction, id: String) -> anyhow::Result<Option<Account>> {
    cascade_delete(transaction, id.clone())?;
    return single(
        transaction,
        formatcp!("DELETE FROM account WHERE id = ?1 {ACCOUNT_RETURNING}"),
        [id]
    );
}

pub fn get_account(transaction: &Transaction, id: String) -> anyhow::Result<Option<Account>> {
    return single(
        transaction,
        formatcp!("{ACCOUNT_SELECT} WHERE id = ?1"),
        [id]
    );
}

pub fn list_accounts(transaction: &Transaction) -> anyhow::Result<Vec<Account>> {
    return list(
        transaction,
        formatcp!("{ACCOUNT_SELECT} {ACCOUNT_ORDERING}"),
        []
    );
}

pub fn verify_account_id_exists(transaction: &Transaction, id: String) -> anyhow::Result<()> {
    let result = get_account(transaction, id.clone())?;
    if result.is_none() {
        return Err(anyhow!("Account {} does not exist", id.clone()));
    }
    return Ok(())
}

fn cascade_delete(transaction: &Transaction, id: String) -> anyhow::Result<()> {
    crate::setting::db::cascade_delete_account(transaction, id.clone())?;
    crate::transaction::db::cascade_delete_account(transaction, id.clone())?;
    Ok(())
}