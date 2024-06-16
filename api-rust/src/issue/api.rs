use std::cmp::Ordering::{Equal, Greater, Less};
use std::collections::{HashMap, HashSet};
use actix_web::{Error, error, get, HttpResponse, web};
use chrono::{Datelike, Local, Months, NaiveDate};
use log::{error, info};
use crate::account::db::list_accounts;
use crate::account::schema::Account;
use crate::db::{do_in_transaction, Pool};
use crate::issue::schema::{Issue, IssueType};
use crate::setting::db::{get_setting_by_key};
use crate::setting::schema::SettingKey;
use crate::transaction::db::list_transactions;
use crate::transaction::schema::{TransactionType};

#[get("/api/issue/")]
pub async fn list_issues(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_issues");
    do_in_transaction(&db, |transaction| {
        let transactions = list_transactions(transaction)?;
        let transfer_without_balance_ignored_account_ids: HashSet<String> = get_setting_by_key(transaction, SettingKey::TransferWithoutBalanceIgnoredAccounts)?
            .map(|setting| HashSet::from_iter(setting.value.split(",").into_iter().map(|s| s.to_string())))
            .unwrap_or_else(HashSet::new);

        let no_regular_balance_account_ids: HashSet<String> = get_setting_by_key(transaction, SettingKey::NoRegularBalanceAccounts)?
            .map(|setting| HashSet::from_iter(setting.value.split(",").into_iter().map(|s| s.to_string())))
            .unwrap_or_else(HashSet::new);

        let accounts: HashMap<String, Account> = list_accounts(transaction)?.iter()
            .map(|account| (account.id.clone(), account.clone()))
            .collect();
        return Ok((transactions, transfer_without_balance_ignored_account_ids, no_regular_balance_account_ids, accounts))
    })
        .await
        .map(|(transactions, transfer_without_balance_ignored_account_ids, no_regular_balance_account_ids, accounts)| {
            let mut issues: Vec<Issue> = vec![];
            let mut account_ids_with_transfers_by_date: HashMap<NaiveDate, HashSet<String>> = HashMap::new();
            let mut dates_with_balances_by_account_ids: HashMap<String, HashSet<NaiveDate>> = HashMap::new();

            // Work out which dates have transfers for accounts and which dates accounts have balances for
            for transaction in transactions {
                match transaction.transaction_type {
                    TransactionType::Balance => {
                        let mut value = dates_with_balances_by_account_ids.remove(&transaction.account_id)
                            .unwrap_or_else(HashSet::new);
                        value.insert(transaction.date);
                        dates_with_balances_by_account_ids.insert(transaction.account_id, value);
                    }
                    TransactionType::Transfer => {
                        let mut value = account_ids_with_transfers_by_date.remove(&transaction.date)
                            .unwrap_or_else(HashSet::new);
                        value.insert(transaction.account_id);
                        if transaction.from_account_id.is_some() {
                            value.insert(transaction.from_account_id.unwrap());
                        }
                        account_ids_with_transfers_by_date.insert(transaction.date.clone(), value);
                    }
                }
            }

            // Look for dates that have a transfer but no balance
            for (date, account_ids) in account_ids_with_transfers_by_date.iter() {
                for account_id in account_ids {
                    if !transfer_without_balance_ignored_account_ids.contains(account_id) {
                        let dates_with_balances = dates_with_balances_by_account_ids.get(account_id);
                        if dates_with_balances.is_none() { // No balances for the account, it's always wrong
                            issues.push(Issue {
                                issue_type: IssueType::TransferWithoutBalance,
                                account_id: Some(account_id.clone()),
                                date: Some(date.clone()),
                            })
                        } else {
                            let set = dates_with_balances.unwrap();
                            if !set.contains(date) { // No balance for the account on that date
                                issues.push(Issue {
                                    issue_type: IssueType::TransferWithoutBalance,
                                    account_id: Some(account_id.clone()),
                                    date: Some(date.clone()),
                                })
                            }
                        }
                    }
                }
            }

            // Just look at the end of last month for missing balances, don't go further back because it becomes a meal
            let first_day_of_this_month = Local::now().date_naive().with_day(1).unwrap();
            for account_id in accounts.keys() {
                if !no_regular_balance_account_ids.contains(account_id) {
                    let dates_with_balances = dates_with_balances_by_account_ids.get(account_id);
                    if dates_with_balances.is_none() { // No balances for the account, it's always wrong
                        issues.push(Issue {
                            issue_type: IssueType::NoBalance,
                            account_id: Some(account_id.clone()),
                            date: Some(first_day_of_this_month.clone()),
                        })
                    } else {
                        let set = dates_with_balances.unwrap();
                        if !set.contains(&first_day_of_this_month) { // No balance for the account on that date
                            issues.push(Issue {
                                issue_type: IssueType::NoBalance,
                                account_id: Some(account_id.clone()),
                                date: Some(first_day_of_this_month.clone()),
                            })
                        }
                    }
                }
            }

            issues.sort_by(|one, two| {
                let ordered = one.issue_type.cmp(&two.issue_type);
                if ordered != Equal {
                    return ordered;
                }
                let ordered = one.date.cmp(&two.date);
                if ordered != Equal {
                    return ordered;
                }
                let one_a = one.account_id.clone()
                    .and_then(|account_id| accounts.get(&account_id));
                let two_a = two.account_id.clone()
                    .and_then(|account_id| accounts.get(&account_id));
                if one_a.is_some() && !two_a.is_some() {
                    return Greater
                } else if one_a.is_none() && two_a.is_some() {
                    return Less
                } else if one_a.is_none() && two_a.is_none() {
                    return Equal
                }
                let one_a = one_a.unwrap();
                let two_a = two_a.unwrap();
                let ordered = one_a.account_type.cmp(&two_a.account_type);
                if ordered != Equal {
                    return ordered;
                }
                return one_a.name.cmp(&two_a.name);
            });

            HttpResponse::Ok().json(issues)
        })
        .map_err(|err| {
            error!("HTTP list_issues: [{err}]");
            return error::ErrorInternalServerError(err);
        })
}