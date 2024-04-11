#![allow(unreachable_patterns)]

use std::str::FromStr;
use rusqlite::Row;
use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ValueRef};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumString};
use crate::db::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub description: Option<String>,
    pub date: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub value: Decimal,
    #[serde(rename = "type")]
    pub transaction_type: TransactionType,
    #[serde(rename = "accountId")]
    pub account_id: String,
    #[serde(rename = "fromAccountId")]
    pub from_account_id: Option<String>,
}

#[derive(Debug, Clone, Display, EnumString, Serialize, Deserialize)]
pub enum TransactionType {
    #[serde(rename = "BALANCE" )]
    #[strum(serialize="BALANCE", to_string="BALANCE")]
    Balance,
    #[serde(rename = "TRANSFER" )]
    #[strum(serialize="TRANSFER", to_string="TRANSFER")]
    Transfer
}

impl FromRow for Transaction {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Transaction {
            id: row.get("id")?,
            description: row.get("description")?,
            date: row.get("date")?,
            value: crate::db::get_decimal(row, "value")?,
            transaction_type: row.get("type")?,
            account_id: row.get("account_id")?,
            from_account_id: row.get("from_account_id")?,
        })
    }
}

impl FromSql for TransactionType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        match value.as_str() {
            Ok(value) => TransactionType::from_str(value).map_err(|err| FromSqlError::Other(Box::new(err))),
            Err(err) => Err(err)
        }
    }
}