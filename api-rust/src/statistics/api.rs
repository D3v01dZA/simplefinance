use std::collections::HashMap;
use std::fmt::Display;
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
use crate::transaction::schema::{Transaction};
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
    #[strum(serialize = "NET", to_string = "NET")]
    Net,
    #[strum(serialize = "CASH", to_string = "CASH")]
    Cash,
    #[strum(serialize = "SHORT_TERM_ASSET", to_string = "SHORT_TERM_ASSET")]
    ShortTermAsset,
    #[strum(serialize = "LONG_TERM_ASSET", to_string = "LONG_TERM_ASSET")]
    LongTermAsset,
    #[strum(serialize = "PHYSICAL_ASSET", to_string = "PHYSICAL_ASSET")]
    PhysicalAsset,
    #[strum(serialize = "RETIREMENT_ASSET", to_string = "RETIREMENT_ASSET")]
    Retirement,
    #[strum(serialize = "SHORT_TERM_LIABILITY", to_string = "SHORT_TERM_LIABILITY")]
    ShortTermLiability,
    #[strum(serialize = "LONG_TERM_LIABILITY", to_string = "LONG_TERM_LIABILITY")]
    LongTermLiability,
}

#[derive(Debug, Clone, PartialEq, Eq, Display, EnumIter, Hash)]
enum FlowGroup {
    #[strum(serialize = "CASH", to_string = "CASH")]
    CASH,
    #[strum(serialize = "GAIN", to_string = "GAIN")]
    GAIN,
    #[strum(serialize = "RETIREMENT", to_string = "RETIREMENT")]
    RETIREMENT,
    #[strum(serialize = "APPRECIATION", to_string = "APPRECIATION")]
    APPRECIATION,
    #[strum(serialize = "INTEREST", to_string = "INTEREST")]
    INTEREST,
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
                Category::Flow => calculate_flow(transactions, accounts, dates),
                Category::FlowGrouping => calculate_flow_grouping(transactions, accounts, dates)
            }
        })
        .map(|statistics| HttpResponse::Ok().json(statistics))
        .map_err(|err| {
            error!("HTTP account_balances: [{err}]");
            return error::ErrorInternalServerError(err);
        })
}

fn calculate_account_balances(transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    return calculate_internal(transactions, accounts, dates, |transaction| transaction.transaction_type == Balance, add_balance, |map, _| map.clone());
}

fn calculate_account_transfers(transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    return calculate_internal(transactions, accounts, dates, |transaction| transaction.transaction_type == Transfer, add_transfer, |map, _| map.clone());
}

fn calculate_total_balances(transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    return calculate_internal(transactions, accounts, dates, |transaction| transaction.transaction_type == Balance, add_balance, accumulate_totals);
}

fn calculate_total_transfers(transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    return calculate_internal(transactions, accounts, dates, |transaction| transaction.transaction_type == Transfer, add_transfer, accumulate_totals);
}

fn calculate_flow(transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    return calculate_flow_internal(transactions, accounts, dates, calculate_flow_total);
}

fn calculate_flow_grouping(transactions: Vec<Transaction>, accounts: Vec<Account>, dates: Vec<NaiveDate>) -> Vec<Statistic> {
    return calculate_flow_internal(transactions, accounts, dates, calculate_flow_grouping_total);
}

fn calculate_internal<
    Filter: FnMut(&Transaction) -> bool,
    Mapper: FnMut(HashMap<String, Decimal>, &Transaction) -> HashMap<String, Decimal>,
    AccumulatorKey: Hash + PartialEq + Eq + Display + Clone,
    Accumulator: FnMut(&HashMap<String, Decimal>, &HashMap<String, Account>) -> HashMap<AccumulatorKey, Decimal>
>(
    mut transactions: Vec<Transaction>,
    accounts: Vec<Account>,
    dates: Vec<NaiveDate>,
    filter: Filter,
    mut mapper: Mapper,
    mut accumulator: Accumulator,
) -> Vec<Statistic> {
    let mut statistics: Vec<Statistic> = vec![];
    transactions.retain(filter);

    let account_by_account_id: HashMap<String, Account> = accounts.iter()
        .map(|account| (account.id.clone(), account.clone()))
        .collect();

    let mut current_by_account_id: HashMap<String, Decimal> = accounts.iter()
        .map(|account| (account.id.clone(), Decimal::ZERO))
        .collect();

    let mut previous_value_by_accumulator_key: HashMap<AccumulatorKey, Decimal> = HashMap::new();

    let mut transaction_iterator = transactions.iter();
    let mut first_transaction_encountered = false;
    let mut current_transaction = transaction_iterator.next();

    for date in dates {
        while current_transaction.is_some() && current_transaction.unwrap().date <= date {
            let transaction = current_transaction.unwrap();
            current_by_account_id = mapper(current_by_account_id, transaction);
            current_transaction = transaction_iterator.next();
            first_transaction_encountered = true;
        }

        let current_by_accumulator_key = accumulator(&current_by_account_id, &account_by_account_id);

        if first_transaction_encountered {
            statistics.push(create_statistic_by_key(date, &current_by_accumulator_key, &previous_value_by_accumulator_key));
            previous_value_by_accumulator_key = current_by_accumulator_key.clone();
        }
    }

    return statistics;
}

fn calculate_flow_internal<
    AccumulatorKey: Hash + PartialEq + Eq + Display + Clone,
    Accumulator: FnMut(&HashMap<TotalType, Decimal>, &HashMap<TotalType, Decimal>) -> HashMap<AccumulatorKey, Decimal>
>(
    transactions: Vec<Transaction>,
    accounts: Vec<Account>,
    dates: Vec<NaiveDate>,
    mut accumulator: Accumulator,
) -> Vec<Statistic> {
    let mut statistics: Vec<Statistic> = vec![];

    let account_by_account_id: HashMap<String, Account> = accounts.iter()
        .map(|account| (account.id.clone(), account.clone()))
        .collect();

    let mut current_balances_by_account_id: HashMap<String, Decimal> = accounts.iter()
        .map(|account| (account.id.clone(), Decimal::ZERO))
        .collect();

    let mut current_transfers_by_account_id: HashMap<String, Decimal> = accounts.iter()
        .map(|account| (account.id.clone(), Decimal::ZERO))
        .collect();

    let mut previous_flow: HashMap<AccumulatorKey, Decimal> = HashMap::new();

    let mut transaction_iterator = transactions.iter();
    let mut first_transaction_encountered = false;
    let mut current_transaction = transaction_iterator.next();

    for date in dates {
        while current_transaction.is_some() && current_transaction.unwrap().date <= date {
            let transaction = current_transaction.unwrap();
            match transaction.transaction_type {
                Balance => current_balances_by_account_id = add_balance(current_balances_by_account_id, transaction),
                Transfer => current_transfers_by_account_id = add_transfer(current_transfers_by_account_id, transaction)
            }
            current_transaction = transaction_iterator.next();
            first_transaction_encountered = true;
        }

        let accumulated_balances = accumulate_totals(&current_balances_by_account_id, &account_by_account_id);
        let accumulated_transfers = accumulate_totals(&current_transfers_by_account_id, &account_by_account_id);

        let current_flow = accumulator(&accumulated_balances, &accumulated_transfers);

        if first_transaction_encountered {
            statistics.push(create_statistic_by_key(date, &current_flow, &previous_flow));
            previous_flow = current_flow.clone();
        }
    }

    return statistics;
}

fn accumulate_totals(map: &HashMap<String, Decimal>, account_by_account_id: &HashMap<String, Account>) -> HashMap<TotalType, Decimal> {
    let mut value_by_total: HashMap<TotalType, Decimal> = TotalType::iter()
        .map(|transfer| (transfer, Decimal::ZERO))
        .collect();

    let mut net = value_by_total.remove(&TotalType::Net).unwrap();
    for (account_id, value) in map.iter() {
        let total_type = total_type_from_account_type(&account_by_account_id.get(account_id).unwrap().account_type);
        if total_type.is_some() {
            let total_type = total_type.unwrap();
            let transfer_value = value_by_total.remove(&total_type).unwrap();
            value_by_total.insert(total_type.clone(), value + transfer_value);
            net = net + value;
        }
    }
    value_by_total.insert(TotalType::Net, net);
    return value_by_total;
}

fn add_transfer(mut map: HashMap<String, Decimal>, transaction: &Transaction) -> HashMap<String, Decimal> {
    let value = map.remove(&transaction.account_id.clone()).unwrap();
    map.insert(transaction.account_id.clone(), value + transaction.value);
    let from_account_id = transaction.from_account_id.clone().unwrap();
    let value = map.remove(&from_account_id).unwrap();
    map.insert(from_account_id, value - transaction.value);
    return map;
}

fn add_balance(mut map: HashMap<String, Decimal>, transaction: &Transaction) -> HashMap<String, Decimal> {
    map.insert(transaction.account_id.clone(), transaction.value.clone());
    return map;
}

fn calculate_flow_total(balances: &HashMap<TotalType, Decimal>, transfers: &HashMap<TotalType, Decimal>) -> HashMap<TotalType, Decimal> {
    let mut flow_total: HashMap<TotalType, Decimal> = HashMap::new();
    for total_type in TotalType::iter() {
        match total_type {
            TotalType::Net => {}
            _ => {
                let balance = balances.get(&total_type).unwrap();
                let transfer = transfers.get(&total_type).unwrap();
                flow_total.insert(total_type, balance - transfer);
            }
        }
    }
    return flow_total;
}

fn calculate_flow_grouping_total(balances: &HashMap<TotalType, Decimal>, transfers: &HashMap<TotalType, Decimal>) -> HashMap<FlowGroup, Decimal> {
    let mut flow_grouping_total: HashMap<FlowGroup, Decimal> = FlowGroup::iter()
        .map(|flow_group| (flow_group, Decimal::ZERO))
        .collect();
    for total_type in TotalType::iter() {
        match total_type {
            TotalType::Net => {}
            _ => {
                let balance = balances.get(&total_type).unwrap();
                let transfer = transfers.get(&total_type).unwrap();
                let flow_grouping = match total_type {
                    TotalType::Net => None,
                    TotalType::Cash => Some(FlowGroup::CASH),
                    TotalType::ShortTermAsset => Some(FlowGroup::GAIN),
                    TotalType::LongTermAsset => Some(FlowGroup::GAIN),
                    TotalType::PhysicalAsset => Some(FlowGroup::APPRECIATION),
                    TotalType::Retirement => Some(FlowGroup::RETIREMENT),
                    TotalType::ShortTermLiability => Some(FlowGroup::INTEREST),
                    TotalType::LongTermLiability => Some(FlowGroup::INTEREST)
                };
                if flow_grouping.is_some() {
                    let flow_grouping = flow_grouping.unwrap();
                    let value = flow_grouping_total.remove(&flow_grouping).unwrap();
                    flow_grouping_total.insert(flow_grouping, value + (balance - transfer));
                }
            }
        }
    }
    return flow_grouping_total;
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

fn total_type_from_account_type(account_type: &AccountType) -> Option<TotalType> {
    match account_type {
        AccountType::Savings => Some(TotalType::ShortTermAsset),
        AccountType::Checking => Some(TotalType::Cash),
        AccountType::Loan => Some(TotalType::LongTermLiability),
        AccountType::CreditCard => Some(TotalType::ShortTermLiability),
        AccountType::Investment => Some(TotalType::LongTermAsset),
        AccountType::Retirement => Some(TotalType::Retirement),
        AccountType::PhysicalAsset => Some(TotalType::PhysicalAsset),
        AccountType::External => None,
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
            NaiveDate::from_ymd_opt(2024, 5, 20).unwrap(),
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
