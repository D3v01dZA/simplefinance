use std::cmp::Ordering;
use anyhow::anyhow;
use chrono::NaiveDate;
use const_format::formatcp;
use rusqlite::{params};
use rust_decimal::Decimal;
use uuid::Uuid;
use crate::account::db::verify_account_id_exists;
use crate::db::{list, single};
use crate::transaction::schema::{NewTransaction, Transaction, TransactionType};

const TRANSACTION_COLUMNS: &str = "id, description, date, value, type, account_id, from_account_id";
const TRANSACTION_SELECT: &str = formatcp!("SELECT {TRANSACTION_COLUMNS} FROM account_transaction");
const TRANSACTION_RETURNING: &str = formatcp!("RETURNING {TRANSACTION_COLUMNS}");
const TRANSACTION_ORDERING: &str = "ORDER BY date, type, account_id";

pub fn create_transaction(transaction: &rusqlite::Transaction, new_transaction: NewTransaction) -> anyhow::Result<Option<Transaction>> {
    verify(transaction, new_transaction.transaction_type.clone(), new_transaction.account_id.clone(), new_transaction.from_account_id.clone())?;
    verify_unique(transaction, None, new_transaction.transaction_type.clone(), new_transaction.account_id.clone(), new_transaction.from_account_id.clone(), new_transaction.date.clone())?;
    return single(
        transaction,
        formatcp!("INSERT INTO account_transaction ({TRANSACTION_COLUMNS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) {TRANSACTION_RETURNING}"),
        params![Uuid::new_v4().to_string(), new_transaction.description, new_transaction.date.to_string(), normalize_decimal(&new_transaction.value).to_string(), new_transaction.transaction_type.to_string(), new_transaction.account_id, new_transaction.from_account_id]
    );
}

pub fn update_transaction(transaction: &rusqlite::Transaction, updated_transaction: Transaction) -> anyhow::Result<Option<Transaction>> {
    verify(transaction, updated_transaction.transaction_type.clone(), updated_transaction.account_id.clone(), updated_transaction.from_account_id.clone())?;
    verify_unique(transaction, Some(updated_transaction.id.clone()), updated_transaction.transaction_type.clone(), updated_transaction.account_id.clone(), updated_transaction.from_account_id.clone(), updated_transaction.date.clone())?;
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
        formatcp!("{TRANSACTION_SELECT} WHERE account_id = ?1 OR from_account_id = ?1 {TRANSACTION_ORDERING}"),
        [account_id]
    ).map(sort);
}

pub fn list_transactions(transaction: &rusqlite::Transaction) -> anyhow::Result<Vec<Transaction>> {
    return list(
        transaction,
        formatcp!("{TRANSACTION_SELECT} {TRANSACTION_ORDERING}"),
        [],
    ).map(sort);
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

fn sort(mut transactions: Vec<Transaction>) -> Vec<Transaction> {
    transactions.sort_by(|one, two| {
        // Sort by latest date first here
        let date = two.date.cmp(&one.date);
        if date != Ordering::Equal {
            return date;
        }
        let transaction_type = one.transaction_type.cmp(&two.transaction_type);
        if transaction_type != Ordering::Equal {
            return transaction_type;
        }
        let value = one.value.cmp(&two.value);
        if value != Ordering::Equal {
            return value;
        }
        let description = one.description.cmp(&two.description);
        if description != Ordering::Equal {
            return description;
        }
        return one.account_id.cmp(&two.account_id);
    });
    return transactions
}

fn delete_transaction_by_account(transaction: &rusqlite::Transaction, account_id: String) -> anyhow::Result<Vec<Transaction>> {
    return list(
        transaction,
        formatcp!("DELETE FROM account_transaction WHERE account_id = ?1 OR from_account_id = ?1 {TRANSACTION_RETURNING}"),
        [account_id]
    );
}

fn verify_unique(transaction: &rusqlite::Transaction, id: Option<String>, transaction_type: TransactionType, account_id: String, from_account_id: Option<String>, date: NaiveDate) -> anyhow::Result<()> {
    return match transaction_type {
        TransactionType::Balance => {
            let current: Vec<Transaction> = list(
                transaction,
                formatcp!("{TRANSACTION_SELECT} WHERE account_id = ?1 and date = ?2 and type = ?3"),
                [account_id, date.to_string(), transaction_type.to_string()]
            )?;
            if !current.is_empty() && id.is_none() {
                return Err(anyhow!("Conflicting transaction found on same date"));
            }
            if current.len() == 1 && id.is_some() && current.get(0).unwrap().id != id.unwrap() {
                return Err(anyhow!("Conflicting transaction found on same date"));
            }
            Ok(())
        },
        TransactionType::Transfer => {
            let current: Vec<Transaction> = list(
                transaction,
                formatcp!("{TRANSACTION_SELECT} WHERE account_id = ?1 and from_account_id = ?2 and date = ?3 and type = ?4"),
                [account_id, from_account_id.unwrap(), date.to_string(), transaction_type.to_string()]
            )?;
            if !current.is_empty() && id.is_none() {
                return Err(anyhow!("Conflicting transaction found on same date"));
            }
            if current.len() == 1 && id.is_some() && current.get(0).unwrap().id != id.unwrap() {
                return Err(anyhow!("Conflicting transaction found on same date"));
            }
            Ok(())
        }
    }
}

fn verify(transaction: &rusqlite::Transaction, transaction_type: TransactionType, account_id: String, from_account_id: Option<String>) -> anyhow::Result<()> {
    verify_account_ids(transaction, account_id.clone(), from_account_id.clone())?;
    verify_from_account_id(transaction_type.clone(), from_account_id.clone())?;
    Ok(())
}

fn verify_from_account_id(transaction_type: TransactionType, from_account_id: Option<String>) -> anyhow::Result<()> {
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
    verify_account_id_exists(transaction, account_id)?;
    if from_account_id.is_some() {
        verify_account_id_exists(transaction, from_account_id.unwrap())?;
    }
    Ok(())
}
