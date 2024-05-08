use anyhow::anyhow;
use const_format::formatcp;
use rusqlite::{params};
use rust_decimal::Decimal;
use uuid::Uuid;
use crate::account::db::verify_account_exists;
use crate::db::{list, single};
use crate::transaction::schema::{NewTransaction, Transaction, TransactionType};

const TRANSACTION_COLUMNS: &str = "id, description, date, value, type, account_id, from_account_id";
const TRANSACTION_SELECT: &str = formatcp!("SELECT {TRANSACTION_COLUMNS} FROM account_transaction");
const TRANSACTION_RETURNING: &str = formatcp!("RETURNING {TRANSACTION_COLUMNS}");

pub fn create_transaction(transaction: &rusqlite::Transaction, new_transaction: NewTransaction) -> anyhow::Result<Option<Transaction>> {
    verify(transaction, new_transaction.transaction_type.clone(), new_transaction.account_id.clone(), new_transaction.from_account_id.clone())?;
    return single(
        transaction,
        formatcp!("INSERT INTO account_transaction ({TRANSACTION_COLUMNS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) {TRANSACTION_RETURNING}"),
        params![Uuid::new_v4().to_string(), new_transaction.description, new_transaction.date.to_string(), normalize_decimal(&new_transaction.value).to_string(), new_transaction.transaction_type.to_string(), new_transaction.account_id, new_transaction.from_account_id]
    );
}

pub fn update_transaction(transaction: &rusqlite::Transaction, updated_transaction: Transaction) -> anyhow::Result<Option<Transaction>> {
    verify(transaction, updated_transaction.transaction_type.clone(), updated_transaction.account_id.clone(), updated_transaction.from_account_id.clone())?;
    return single(
        transaction,
        formatcp!("UPDATE account_transaction SET description = ?1, date = ?2, value = ?3, type = ?4, account_id = ?5, from_account_id = ?6 WHERE id = ?7 {}", TRANSACTION_RETURNING),
        params![updated_transaction.description, updated_transaction.date.to_string(), normalize_decimal(&updated_transaction.value).to_string(), updated_transaction.transaction_type.to_string(), updated_transaction.account_id, updated_transaction.from_account_id, updated_transaction.id]
    );
}

pub fn delete_transaction(transaction: &rusqlite::Transaction, id: String) -> anyhow::Result<Option<Transaction>> {
    return single(
        transaction,
        formatcp!("DELETE FROM account_transaction WHERE id = ?1 {TRANSACTION_RETURNING}"),
        [id]
    );
}

pub fn get_transaction(transaction: &rusqlite::Transaction, id: String) -> anyhow::Result<Option<Transaction>> {
    return single(
        transaction,
        formatcp!("{TRANSACTION_SELECT} WHERE id = ?1"),
        [id]
    );
}

pub fn list_account_transactions(transaction: &rusqlite::Transaction, account_id: String) -> anyhow::Result<Vec<Transaction>> {
    return list(
        transaction,
        formatcp!("{TRANSACTION_SELECT} WHERE account_id = ?1 OR from_account_id = ?1"),
        [account_id]
    );
}

pub fn list_transactions(transaction: &rusqlite::Transaction) -> anyhow::Result<Vec<Transaction>> {
    return list(
        transaction,
        TRANSACTION_SELECT,
        [],
    );
}

pub fn cascade_delete_account(transaction: &rusqlite::Transaction, account_id: String) -> anyhow::Result<()> {
    delete_transaction_by_account(transaction, account_id)?;
    Ok(())
}

fn normalize_decimal(decimal: &Decimal) -> Decimal {
    let mut cloned = decimal.clone();
    cloned.rescale(2);
    return cloned
}

fn delete_transaction_by_account(transaction: &rusqlite::Transaction, account_id: String) -> anyhow::Result<Vec<Transaction>> {
    return list(
        transaction,
        formatcp!("DELETE FROM account_transaction WHERE account_id = ?1 OR from_account_id = ?1 {TRANSACTION_RETURNING}"),
        [account_id]
    );
}

fn verify(transaction: &rusqlite::Transaction, transaction_type: TransactionType, account_id: String, from_account_id: Option<String>) -> anyhow::Result<()> {
    verify_account_ids(transaction, account_id, from_account_id.clone())?;
    verify_transaction_type(transaction_type, from_account_id.clone())?;
    Ok(())
}

fn verify_transaction_type(transaction_type: TransactionType, from_account_id: Option<String>) -> anyhow::Result<()> {
    return match transaction_type {
        TransactionType::Balance => {
            if from_account_id.is_none() {
                Ok(())
            } else {
                Err(anyhow!("Balance cannot have a from_account_id"))
            }
        },
        TransactionType::Transfer => {
            if from_account_id.is_some() {
                Ok(())
            } else {
                Err(anyhow!("Transfer must have a from_account_id"))
            }
        }
    }
}

fn verify_account_ids(transaction: &rusqlite::Transaction, account_id: String, from_account_id: Option<String>) -> anyhow::Result<()> {
    verify_account_exists(transaction, account_id)?;
    if from_account_id.is_some() {
        verify_account_exists(transaction, from_account_id.unwrap())?;
    }
    Ok(())
}