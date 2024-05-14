use std::collections::HashMap;
use std::hash::Hash;
use actix_web::{Error, error, get, HttpResponse, web};
use anyhow::anyhow;
use chrono::{Datelike, Days, Local, Months, NaiveDate};
use log::{debug, error, info};
use rust_decimal::Decimal;
use strum::IntoEnumIterator;
use strum_macros::{EnumIter, Display};
use crate::account::db::list_accounts;
use crate::account::schema::{Account, AccountType};
use crate::db::{do_in_transaction, Pool};
use crate::statistics::api::Period::{Monthly, Weekly, Yearly};
use crate::statistics::schema::{Statistic, Value};
use crate::transaction::db::list_transactions;
use crate::transaction::schema::{Transaction, TransactionType};
use crate::transaction::schema::TransactionType::{Balance, Transfer};
use crate::util::SliceDisplay;

#[derive(Debug, Clone, PartialEq, Eq)]
enum Period {
    Weekly,
    Monthly,
    Yearly,
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Category {
    AccountBalances,
    AccountTransfers,
    TotalBalances,
    TotalTransfers,
    Flow,
    FlowGrouping,
}

#[derive(Debug, Clone, PartialEq, Eq, Display, EnumIter, Hash)]
enum TotalType {
    #[strum(serialize="NET", to_string="NET")]
    Net,
    #[strum(serialize="EXTERNAL", to_string="EXTERNAL")]
    External,
    #[strum(serialize="CASH", to_string="CASH")]
    Cash,
    #[strum(serialize="SHORT_TERM_ASSET", to_string="SHORT_TERM_ASSET")]
    ShortTermAsset,
    #[strum(serialize="LONG_TERM_ASSET", to_string="LONG_TERM_ASSET")]
    LongTermAsset,
    #[strum(serialize="PHYSICAL_ASSET", to_string="PHYSICAL_ASSET")]
    PhysicalAsset,
    #[strum(serialize="RETIREMENT_ASSET", to_string="RETIREMENT_ASSET")]
    Retirement,
    #[strum(serialize="SHORT_TERM_LIABILITY", to_string="SHORT_TERM_LIABILITY")]
    ShortTermLiability,
    #[strum(serialize="LONG_TERM_LIABILITY", to_string="LONG_TERM_LIABILITY")]
    LongTermLiability
}

#[get("/api/statistics/{period}/{category}/")]
pub async fn calculate_statistics(db: web::Data<Pool>, path: web::Path<(String, String)>) -> Result<HttpResponse, Error> {
    let (period, category) = path.into_inner();
    info!("HTTP statistics [{period:?}] [{category:?}]");
    do_in_transaction(&db, |transaction| {
        let (period, category) = extract_params((period, category))?;
        let transactions = list_transactions(transaction)?;
        let accounts = list_accounts(transaction)?;
        return Ok((period, category, transactions, accounts));
    })
        .await
        .map(|(period, category, mut transactions, accounts)| {
            if transactions.is_empty() {
                return vec![];
            }
            transactions.sort_by(|one, two| one.date.cmp(&two.date));
            let dates = dates(period, Local::now().date_naive());
            match category {
                Category::AccountBalances => calculate_account_balances(transactions, accounts, dates),
                Category::AccountTransfers => calculate_account_transfers(transactions, accounts, dates),
                Category::TotalBalances => calculate_total_balances(transactions, accounts, dates),
                Category::TotalTransfers => calculate_total_transfers(transactions, accounts, dates),
                _ => vec![Statistic {
                    date: Default::default(),
                    values: vec![],
                }]
            }
        })
        .map(|statistics| HttpResponse::Ok().json(statistics))
        .map_err(|err| {
            error!("HTTP account_balances: [{err}]");
            return error::ErrorInternalServerError(err);
        })
}

fn calculate_account_balances(mut transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    let mut statistics: Vec<Statistic> = vec![];
    transactions.retain(|transaction| transaction.transaction_type == Balance);

    let mut current_balances_by_account_id: HashMap<String, Decimal> = accounts.iter()
        .map(|account| (account.id.clone(), Decimal::ZERO))
        .collect();

    let mut previous_balances_by_account_id: HashMap<String, Decimal> = HashMap::new();

    let mut transaction_iterator = transactions.iter();
    let mut first_transaction_encountered = false;
    let mut current_transaction = transaction_iterator.next();

    for date in dates {
        while current_transaction.is_some() && current_transaction.unwrap().date <= date {
            let transaction = current_transaction.unwrap();
            current_balances_by_account_id.insert(transaction.account_id.clone(), transaction.value.clone());
            current_transaction = transaction_iterator.next();
            first_transaction_encountered = true;
        }
        if first_transaction_encountered {
            statistics.push(create_statistic_by_key(date, &current_balances_by_account_id, &previous_balances_by_account_id));
            previous_balances_by_account_id = current_balances_by_account_id.clone();
        }
    }

    return statistics;
}

fn calculate_account_transfers(mut transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    let mut statistics: Vec<Statistic> = vec![];
    transactions.retain(|transaction| transaction.transaction_type == TransactionType::Transfer);

    let mut current_transfers_by_account_id: HashMap<String, Decimal> = accounts.iter()
        .map(|account| (account.id.clone(), Decimal::ZERO))
        .collect();

    let mut previous_transfers_by_account_id: HashMap<String, Decimal> = HashMap::new();

    let mut transaction_iterator = transactions.iter();
    let mut first_transaction_encountered = false;
    let mut current_transaction = transaction_iterator.next();

    for date in dates {
        while current_transaction.is_some() && current_transaction.unwrap().date <= date {
            let transaction = current_transaction.unwrap();
            let value = current_transfers_by_account_id.remove(&transaction.account_id.clone()).unwrap();
            current_transfers_by_account_id.insert(transaction.account_id.clone(), value + transaction.value);
            let from_account_id = transaction.from_account_id.clone().unwrap();
            let value = current_transfers_by_account_id.remove(&from_account_id).unwrap();
            current_transfers_by_account_id.insert(from_account_id, value - transaction.value);
            current_transaction = transaction_iterator.next();
            first_transaction_encountered = true;
        }
        if first_transaction_encountered {
            statistics.push(create_statistic_by_key(date, &current_transfers_by_account_id, &previous_transfers_by_account_id));
            previous_transfers_by_account_id = current_transfers_by_account_id.clone();
        }
    }

    return statistics;
}

fn calculate_total_balances(mut transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    let mut statistics: Vec<Statistic> = vec![];
    transactions.retain(|transaction| transaction.transaction_type == Balance);

    let account_type_by_account_id: HashMap<String, TotalType> = accounts.iter()
        .map(|account| (account.id.clone(), total_type_from_account_type(account.account_type.clone())))
        .collect();

    let mut current_balances_by_account_id: HashMap<String, Decimal> = accounts.iter()
        .map(|account| (account.id.clone(), Decimal::ZERO))
        .collect();

    let mut previous_balances_by_total: HashMap<TotalType, Decimal> = HashMap::new();

    let mut transaction_iterator = transactions.iter();
    let mut first_transaction_encountered = false;
    let mut current_transaction = transaction_iterator.next();

    for date in dates {
        while current_transaction.is_some() && current_transaction.unwrap().date <= date {
            let transaction = current_transaction.unwrap();
            current_balances_by_account_id.insert(transaction.account_id.clone(), transaction.value.clone());
            current_transaction = transaction_iterator.next();
            first_transaction_encountered = true;
        }

        let mut balances_by_total: HashMap<TotalType, Decimal> = TotalType::iter()
            .map(|balance| (balance, Decimal::ZERO))
            .collect();

        let mut net = balances_by_total.remove(&TotalType::Net).unwrap();
        for (account_id, value) in current_balances_by_account_id.iter() {
            let total_type = account_type_by_account_id.get(account_id).unwrap();
            let balance_value = balances_by_total.remove(total_type).unwrap();
            balances_by_total.insert(total_type.clone(), value + balance_value);
            net = net + value;
        }
        balances_by_total.insert(TotalType::Net, net);

        if first_transaction_encountered {
            statistics.push(create_statistic_by_key(date, &balances_by_total, &previous_balances_by_total));
            previous_balances_by_total = balances_by_total.clone();
        }
    }

    return statistics;
}

fn calculate_total_transfers(mut transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    let mut statistics: Vec<Statistic> = vec![];
    transactions.retain(|transaction| transaction.transaction_type == Transfer);

    let account_type_by_account_id: HashMap<String, TotalType> = accounts.iter()
        .map(|account| (account.id.clone(), total_type_from_account_type(account.account_type.clone())))
        .collect();

    let mut current_transfers_by_account_id: HashMap<String, Decimal> = accounts.iter()
        .map(|account| (account.id.clone(), Decimal::ZERO))
        .collect();

    let mut previous_transfers_by_total: HashMap<TotalType, Decimal> = HashMap::new();

    let mut transaction_iterator = transactions.iter();
    let mut first_transaction_encountered = false;
    let mut current_transaction = transaction_iterator.next();

    for date in dates {
        while current_transaction.is_some() && current_transaction.unwrap().date <= date {
            let transaction = current_transaction.unwrap();
            let value = current_transfers_by_account_id.remove(&transaction.account_id.clone()).unwrap();
            current_transfers_by_account_id.insert(transaction.account_id.clone(), value + transaction.value);
            let from_account_id = transaction.from_account_id.clone().unwrap();
            let value = current_transfers_by_account_id.remove(&from_account_id).unwrap();
            current_transfers_by_account_id.insert(from_account_id, value - transaction.value);
            current_transaction = transaction_iterator.next();
            first_transaction_encountered = true;
        }

        let mut transfers_by_total: HashMap<TotalType, Decimal> = TotalType::iter()
            .map(|transfer| (transfer, Decimal::ZERO))
            .collect();

        let mut net = transfers_by_total.remove(&TotalType::Net).unwrap();
        for (account_id, value) in current_transfers_by_account_id.iter() {
            let total_type = account_type_by_account_id.get(account_id).unwrap();
            let transfer_value = transfers_by_total.remove(total_type).unwrap();
            transfers_by_total.insert(total_type.clone(), value + transfer_value);
            net = net + value;
        }
        transfers_by_total.insert(TotalType::Net, net);

        if first_transaction_encountered {
            statistics.push(create_statistic_by_key(date, &transfers_by_total, &previous_transfers_by_total));
            previous_transfers_by_total = transfers_by_total.clone();
        }
    }

    return statistics;
}

fn create_statistic_by_key<T: ToString + PartialEq + Eq + Hash>(date: NaiveDate, current_values_by_key: &HashMap<T, Decimal>, previous_values_by_key: &HashMap<T, Decimal>) -> Statistic {
    let values = current_values_by_key.iter()
        .map(|(account_id, transfer)| {
            Value {
                name: account_id.to_string(),
                value: transfer.clone(),
                value_difference: previous_values_by_key.get(&account_id)
                    .map(|previous_value| transfer - previous_value)
                    .unwrap_or(Decimal::ZERO),
            }
        }).collect();

    Statistic { date, values }
}

fn extract_params(path: (String, String)) -> anyhow::Result<(Period, Category)> {
    let (raw_period, raw_category) = path.into();
    let period = if raw_period.eq_ignore_ascii_case("weekly") {
        Weekly
    } else if raw_period.eq_ignore_ascii_case("monthly") {
        Monthly
    } else if raw_period.eq_ignore_ascii_case("yearly") {
        Yearly
    } else {
        return Err(anyhow!("Unknown period {raw_period}"));
    };
    let category = if raw_category.eq_ignore_ascii_case("account_balance") {
        Category::AccountBalances
    } else if raw_category.eq_ignore_ascii_case("account_transfer") {
        Category::AccountTransfers
    } else if raw_category.eq_ignore_ascii_case("total_balance") {
        Category::TotalBalances
    } else if raw_category.eq_ignore_ascii_case("total_transfer") {
        Category::TotalTransfers
    } else if raw_category.eq_ignore_ascii_case("flow") {
        Category::Flow
    } else if raw_category.eq_ignore_ascii_case("flow_grouping") {
        Category::FlowGrouping
    } else {
        return Err(anyhow!("Unknown category {raw_category}"));
    };
    return Ok((period, category));
}

fn total_type_from_account_type(account_type: AccountType) -> TotalType {
    match account_type {
        AccountType::Savings => TotalType::ShortTermAsset,
        AccountType::Checking => TotalType::Cash,
        AccountType::Loan => TotalType::LongTermLiability,
        AccountType::CreditCard => TotalType::ShortTermLiability,
        AccountType::Investment => TotalType::LongTermAsset,
        AccountType::Retirement => TotalType::Retirement,
        AccountType::PhysicalAsset => TotalType::PhysicalAsset,
        AccountType::External => TotalType::External,
    }
}

fn dates(period: Period, start: NaiveDate) -> Vec<NaiveDate> {
    fn generate<T: Fn(NaiveDate) -> NaiveDate, U: FnMut(NaiveDate) -> NaiveDate>(period: Period, start: NaiveDate, origin: T, mut iteration: U) -> Vec<NaiveDate> {
        let mut current = origin(start);
        let mut dates = vec![];
        while current <= start {
            dates.push(current);
            current = iteration(current)
        }
        debug!("From [{:?}] [{}] generated [{}]", period, start, SliceDisplay(dates.as_slice()));
        return dates;
    }
    info!("Start date [{:?}] [{}]", period, start);
    match period {
        Weekly => {
            generate(
                Weekly,
                start.checked_sub_days(Days::new(start.weekday().num_days_from_monday() as u64)).unwrap().checked_add_days(Days::new(7)).unwrap(),
                |start| start.checked_sub_days(Days::new(11 * 7)).unwrap(),
                |week| week.checked_add_days(Days::new(7)).unwrap(),
            )
        }
        Monthly => {
            generate(
                Monthly,
                start.with_day(1).unwrap().checked_add_months(Months::new(1)).unwrap(),
                |start| start.checked_sub_months(Months::new(11)).unwrap(),
                |month| month.checked_add_months(Months::new(1)).unwrap(),
            )
        }
        Yearly => {
            generate(
                Yearly,
                start.with_day(1).unwrap().with_month(1).unwrap().checked_add_months(Months::new(12)).unwrap(),
                |start| start.checked_sub_months(Months::new(9 * 12)).unwrap(),
                |year| year.checked_add_months(Months::new(12)).unwrap(),
            )
        }
    }
}

#[cfg(test)]
mod tests {
    use chrono::NaiveDate;
    use super::*;

    #[test]
    fn test_months() {
        let months = dates(Monthly, NaiveDate::from_ymd_opt(2024, 3, 4).unwrap());
        assert_eq!(months, vec![
            NaiveDate::from_ymd_opt(2023, 05, 01).unwrap(),
            NaiveDate::from_ymd_opt(2023, 06, 01).unwrap(),
            NaiveDate::from_ymd_opt(2023, 07, 01).unwrap(),
            NaiveDate::from_ymd_opt(2023, 08, 01).unwrap(),
            NaiveDate::from_ymd_opt(2023, 09, 01).unwrap(),
            NaiveDate::from_ymd_opt(2023, 10, 01).unwrap(),
            NaiveDate::from_ymd_opt(2023, 11, 01).unwrap(),
            NaiveDate::from_ymd_opt(2023, 12, 01).unwrap(),
            NaiveDate::from_ymd_opt(2024, 01, 01).unwrap(),
            NaiveDate::from_ymd_opt(2024, 02, 01).unwrap(),
            NaiveDate::from_ymd_opt(2024, 03, 01).unwrap(),
            NaiveDate::from_ymd_opt(2024, 04, 01).unwrap(),
        ])
    }

    #[test]
    fn test_weeks() {
        let weeks = dates(Weekly, NaiveDate::from_ymd_opt(2024, 5, 12).unwrap());
        assert_eq!(weeks, vec![
            NaiveDate::from_ymd_opt(2024, 2, 26).unwrap(),
            NaiveDate::from_ymd_opt(2024, 3, 4).unwrap(),
            NaiveDate::from_ymd_opt(2024, 3, 11).unwrap(),
            NaiveDate::from_ymd_opt(2024, 3, 18).unwrap(),
            NaiveDate::from_ymd_opt(2024, 3, 25).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 1).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 8).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 15).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 22).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 29).unwrap(),
            NaiveDate::from_ymd_opt(2024, 5, 6).unwrap(),
            NaiveDate::from_ymd_opt(2024, 5, 13).unwrap(),
        ]);

        let weeks = dates(Weekly, NaiveDate::from_ymd_opt(2024, 5, 13).unwrap());
        assert_eq!(weeks, vec![
            NaiveDate::from_ymd_opt(2024, 3, 4).unwrap(),
            NaiveDate::from_ymd_opt(2024, 3, 11).unwrap(),
            NaiveDate::from_ymd_opt(2024, 3, 18).unwrap(),
            NaiveDate::from_ymd_opt(2024, 3, 25).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 1).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 8).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 15).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 22).unwrap(),
            NaiveDate::from_ymd_opt(2024, 4, 29).unwrap(),
            NaiveDate::from_ymd_opt(2024, 5, 6).unwrap(),
            NaiveDate::from_ymd_opt(2024, 5, 13).unwrap(),
            NaiveDate::from_ymd_opt(2024, 5, 20).unwrap()
        ]);

        let start = NaiveDate::from_ymd_opt(2024, 5, 13).unwrap();
        let date = start.checked_sub_days(Days::new(start.weekday().num_days_from_monday() as u64)).unwrap().checked_add_days(Days::new(7)).unwrap();
        assert_eq!(NaiveDate::from_ymd_opt(2024, 5, 20).unwrap(), date);
    }

    #[test]
    fn test_years() {
        let years = dates(Yearly, NaiveDate::from_ymd_opt(2024, 5, 13).unwrap());
        assert_eq!(years, vec![
            NaiveDate::from_ymd_opt(2016, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2017, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2018, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2019, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2020, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2021, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2022, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2023, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2024, 1, 1).unwrap(),
            NaiveDate::from_ymd_opt(2025, 1, 1).unwrap(),
        ])
    }
}
