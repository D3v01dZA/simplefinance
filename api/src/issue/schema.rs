#![allow(unreachable_patterns)]

use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use strum_macros::{Display, EnumString};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Issue {
    #[serde(rename = "type")]
    pub issue_type: IssueType,
    #[serde(rename = "date")]
    pub date: Option<NaiveDate>,
    #[serde(rename = "accountId")]
    pub account_id: Option<String>,
    #[serde(rename = "fromAccountId")]
    pub from_account_id: Option<String>,
}

#[derive(Debug, Clone, Display, EnumString, Serialize, Deserialize, PartialEq, Eq, Ord, PartialOrd)]
pub enum IssueType {
    #[serde(rename = "TRANSFER_WITHOUT_BALANCE" )]
    #[strum(serialize="TRANSFER_WITHOUT_BALANCE", to_string="TRANSFER_WITHOUT_BALANCE")]
    TransferWithoutBalance,
    #[serde(rename = "NO_BALANCE" )]
    #[strum(serialize="NO_BALANCE", to_string="NO_BALANCE")]
    NoBalance,
    #[serde(rename = "NO_TRANSFER" )]
    #[strum(serialize="NO_TRANSFER", to_string="NO_TRANSFER")]
    NoTransfer
}