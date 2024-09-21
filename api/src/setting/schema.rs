#![allow(unreachable_patterns)]

use std::str::FromStr;
use chrono::NaiveDate;
use rusqlite::Row;
use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ValueRef};
use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumString};
use crate::db::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Setting {
    pub id: String,
    pub key: SettingKey,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NewSetting {
    pub key: SettingKey,
    pub value: String,
}

#[derive(Debug, Clone, Display, EnumString, Serialize, Deserialize, PartialEq, Eq)]
pub enum SettingKey {
    #[serde(rename = "DEFAULT_TRANSACTION_FROM_ACCOUNT_ID" )]
    #[strum(serialize="DEFAULT_TRANSACTION_FROM_ACCOUNT_ID", to_string="DEFAULT_TRANSACTION_FROM_ACCOUNT_ID")]
    DefaultTransactionFromAccountId,
    #[serde(rename = "TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS" )]
    #[strum(serialize="TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS", to_string="TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS")]
    TransferWithoutBalanceIgnoredAccounts,
    #[serde(rename = "NO_REGULAR_BALANCE_ACCOUNTS" )]
    #[strum(serialize="NO_REGULAR_BALANCE_ACCOUNTS", to_string="NO_REGULAR_BALANCE_ACCOUNTS")]
    NoRegularBalanceAccounts,
    #[serde(rename = "REPEATING_TRANSFERS" )]
    #[strum(serialize="REPEATING_TRANSFERS", to_string="REPEATING_TRANSFERS")]
    RepeatingTransfers,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct RepeatingTransfer {
    pub start: NaiveDate,
    pub repeat: DateRepeat,
    pub repeat_count: u32,
    pub from_account_id: String,
    pub to_account_ids: Vec<String>
}

#[derive(Debug, Clone, Display, EnumString, Serialize, Deserialize, PartialEq, Eq)]
pub enum DateRepeat {
    #[serde(rename = "DAILY" )]
    #[strum(serialize="DAILY", to_string="DAILY")]
    DAILY,
    #[serde(rename = "WEEKLY" )]
    #[strum(serialize="WEEKLY", to_string="WEEKLY")]
    WEEKLY,
    #[serde(rename = "MONTHLY" )]
    #[strum(serialize="MONTHLY", to_string="MONTHLY")]
    MONTHLY,
}

impl FromRow for Setting {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Setting {
            id: row.get("id")?,
            key: row.get("key")?,
            value: row.get("value")?,
        })
    }
}

impl FromSql for SettingKey {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        match value.as_str() {
            Ok(value) => SettingKey::from_str(value).map_err(|err| FromSqlError::Other(Box::new(err))),
            Err(err) => Err(err)
        }
    }
}