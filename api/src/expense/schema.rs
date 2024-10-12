#![allow(unreachable_patterns)]

use std::str::FromStr;
use chrono::NaiveDate;
use rusqlite::Row;
use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ValueRef};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumIter, EnumString};
use crate::db::FromRow;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Expense {
    pub id: String,
    pub description: String,
    pub external: String,
    pub category: ExpenseCategory,
    pub date: NaiveDate, 
    #[serde(with = "rust_decimal::serde::float")]
    pub value: Decimal,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct NewExpense {
    pub description: String,
    pub external: String,
    pub category: ExpenseCategory,
    pub date: NaiveDate, 
    #[serde(with = "rust_decimal::serde::float")]
    pub value: Decimal,
}

#[derive(Debug, Clone, Display, EnumString, Serialize, Deserialize, PartialEq, Eq, EnumIter, Hash)]
pub enum ExpenseCategory {
    #[serde(rename = "UNKNOWN" )]
    #[strum(serialize="UNKNOWN", to_string="UNKNOWN")]
    Unknown,
    #[serde(rename = "OTHER" )]
    #[strum(serialize="OTHER", to_string="OTHER")]
    Other,

    #[serde(rename = "BILLS" )]
    #[strum(serialize="BILLS", to_string="BILLS")]
    Bills,
    #[serde(rename = "CLOTHING" )]
    #[strum(serialize="CLOTHING", to_string="CLOTHING")]
    Clothing,
    #[serde(rename = "ELECTRONICS" )]
    #[strum(serialize="ELECTRONICS", to_string="ELECTRONICS")]
    Electronics,
    #[serde(rename = "ENTERTAINMENT" )]
    #[strum(serialize="ENTERTAINMENT", to_string="ENTERTAINMENT")]
    Entertainment,
    #[serde(rename = "FITNESS" )]
    #[strum(serialize="FITNESS", to_string="FITNESS")]
    Fitness,
    #[serde(rename = "GROCERIES" )]
    #[strum(serialize="GROCERIES", to_string="GROCERIES")]
    Groceries,
    #[serde(rename = "HOUSE" )]
    #[strum(serialize="HOUSE", to_string="HOUSE")]
    House,
    #[serde(rename = "MAINTENANCE" )]
    #[strum(serialize="MAINTENANCE", to_string="MAINTENANCE")]
    Maintenance,
    #[serde(rename = "MEDICAL" )]
    #[strum(serialize="MEDICAL", to_string="MEDICAL")]
    Medical,
    #[serde(rename = "PETS" )]
    #[strum(serialize="PETS", to_string="PETS")]
    Pets,
    #[serde(rename = "RESTAURANTS" )]
    #[strum(serialize="RESTAURANTS", to_string="RESTAURANTS")]
    Restaurants,
    #[serde(rename = "SMART_HOME" )]
    #[strum(serialize="SMART_HOME", to_string="SMART_HOME")]
    SmartHome,
    #[serde(rename = "SUBSCRIPTIONS" )]
    #[strum(serialize="SUBSCRIPTIONS", to_string="SUBSCRIPTIONS")]
    Subscriptions,
    #[serde(rename = "VACATIONS" )]
    #[strum(serialize="VACATIONS", to_string="VACATIONS")]
    Vacations,
}

impl FromRow for Expense {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Expense {
            id: row.get("id")?,
            description: row.get("description")?,
            external: row.get("external")?,
            category: row.get("category")?,
            date: crate::db::get_naive_date(row, "date")?,
            value: crate::db::get_decimal(row, "value")?,
        })
    }
}

impl FromSql for ExpenseCategory {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        match value.as_str() {
            Ok(value) => ExpenseCategory::from_str(value).map_err(|err| FromSqlError::Other(Box::new(err))),
            Err(err) => Err(err)
        }
    }
}

