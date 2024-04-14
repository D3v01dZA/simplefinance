#![allow(unreachable_patterns)]

use std::str::FromStr;
use rusqlite::Row;
use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ValueRef};
use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumString};
use crate::db::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Account {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: AccountType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NewAccount {
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: AccountType,
}

#[derive(Debug, Clone, Display, EnumString, Serialize, Deserialize, PartialEq, Eq)]
pub enum AccountType {
    #[serde(rename = "SAVINGS" )]
    #[strum(serialize="SAVINGS", to_string="SAVINGS")]
    Savings,
    #[serde(rename = "CHECKING" )]
    #[strum(serialize="CHECKING", to_string="CHECKING")]
    Checking,
    #[serde(rename = "LOAN" )]
    #[strum(serialize="LOAN", to_string="LOAN")]
    Loan,
    #[serde(rename = "CREDIT_CARD" )]
    #[strum(serialize="CREDIT_CARD", to_string="CREDIT_CARD")]
    CreditCard,
    #[serde(rename = "INVESTMENT" )]
    #[strum(serialize="INVESTMENT", to_string="INVESTMENT")]
    Investment,
    #[serde(rename = "RETIREMENT" )]
    #[strum(serialize="RETIREMENT", to_string="RETIREMENT")]
    Retirement,
    #[serde(rename = "PHYSICAL_ASSET" )]
    #[strum(serialize="PHYSICAL_ASSET", to_string="PHYSICAL_ASSET")]
    PhysicalAsset,
    #[serde(rename = "EXTERNAL" )]
    #[strum(serialize="EXTERNAL", to_string="EXTERNAL")]
    External,
}

impl FromRow for Account {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Account {
            id: row.get("id")?,
            name: row.get("name")?,
            account_type: row.get("type")?,
        })
    }
}

impl FromSql for AccountType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        match value.as_str() {
            Ok(value) => AccountType::from_str(value).map_err(|err| FromSqlError::Other(Box::new(err))),
            Err(err) => Err(err)
        }
    }
}