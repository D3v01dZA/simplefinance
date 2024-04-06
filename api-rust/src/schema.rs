#![allow(unreachable_patterns)]

use rust_decimal::Decimal;
// For some reason the strum macros are saying its unreachable which it obviously isn't
use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumString};

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    pub id: String,
    pub key: SettingKey,
    pub value: String,
}

#[derive(Debug, Display, EnumString, Serialize, Deserialize)]
pub enum SettingKey {
    #[serde(rename = "DEFAULT_TRANSACTION_FROM_ACCOUNT_ID" )]
    #[strum(serialize="DEFAULT_TRANSACTION_FROM_ACCOUNT_ID", to_string="DEFAULT_TRANSACTION_FROM_ACCOUNT_ID")]
    DefaultTransactionFromAccountId,
    #[serde(rename = "TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS" )]
    #[strum(serialize="TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS", to_string="TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS")]
    TransferWithoutBalanceIgnoredAccounts
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Account {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub account_type: AccountType,
}

#[derive(Debug, Display, EnumString, Serialize, Deserialize)]
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

#[derive(Debug, Serialize, Deserialize)]
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

#[derive(Debug, Display, EnumString, Serialize, Deserialize)]
pub enum TransactionType {
    #[serde(rename = "BALANCE" )]
    #[strum(serialize="BALANCE", to_string="BALANCE")]
    Balance,
    #[serde(rename = "TRANSFER" )]
    #[strum(serialize="TRANSFER", to_string="TRANSFER")]
    Transfer
}
