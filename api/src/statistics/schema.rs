use chrono::NaiveDate;
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Statistic {
    pub date: NaiveDate,
    pub values: Vec<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Value {
    pub name: String,
    #[serde(with = "rust_decimal::serde::float")]
    pub value: Decimal,
    #[serde(with = "rust_decimal::serde::float")]
    pub value_difference: Decimal,
}
