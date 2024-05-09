use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware};
use log::{*};
use r2d2::ManageConnection;
use r2d2_sqlite::SqliteConnectionManager;

mod db;
mod api;
mod schema;
mod util;
mod account;
mod transaction;
mod setting;
mod issue;

use db::{Pool};

#[macro_export]
macro_rules! app (
    ($pool: expr) => ({
        App::new()
        .app_data(web::Data::new($pool.clone()))
        .wrap(middleware::Logger::default())
        .wrap(Cors::permissive())

        .service(setting::api::create_setting)
        .service(setting::api::update_setting)
        .service(setting::api::delete_setting)
        .service(setting::api::get_setting)
        .service(setting::api::list_settings)

        .service(account::api::create_account)
        .service(account::api::update_account)
        .service(account::api::delete_account)
        .service(account::api::get_account)
        .service(account::api::list_accounts)

        .service(transaction::api::list_account_transactions)
        .service(transaction::api::create_transaction)
        .service(transaction::api::update_transaction)
        .service(transaction::api::delete_transaction)
        .service(transaction::api::get_transaction)
        .service(transaction::api::list_transactions)

        .service(issue::api::list_issues)
    });
);

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let manager = SqliteConnectionManager::file("database.db");
    run_migrations(&manager);
    let pool = Pool::new(manager).unwrap();

    info!("Starting HTTP server at http://localhost:8080");
    HttpServer::new(move || { app!(pool) })
        .bind(("127.0.0.1", 8080))?
        .workers(4)
        .run()
        .await
}

fn run_migrations(manager: &SqliteConnectionManager) {
    info!("Running migrations");
    refinery::embed_migrations!("migrations");
    let mut conn = manager.connect()
        .expect("Couldn't open connection for migration");
    migrations::runner().run(&mut conn).unwrap();
    conn.close()
        .expect("Couldn't close connection for migration");
    info!("Finished running migrations");
}

#[cfg(test)]
mod tests {
    use actix_web::{web, App, test, middleware, http, body};
    use actix_cors::Cors;
    use chrono::NaiveDate;
    use log::info;
    use r2d2_sqlite::SqliteConnectionManager;
    use rust_decimal::Decimal;
    use crate::setting;
    use crate::account;
    use crate::account::schema::{Account, AccountType, NewAccount};
    use crate::transaction;
    use crate::transaction::schema::{Transaction, TransactionType, NewTransaction};
    use crate::issue;
    use crate::issue::schema::{Issue, IssueType};
    use crate::db::Pool;
    use crate::run_migrations;
    use crate::setting::schema::{NewSetting, Setting, SettingKey};

    #[actix_web::test]
    async fn test_crud() {
        env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

        let manager = SqliteConnectionManager::memory();
        run_migrations(&manager);
        let pool = Pool::new(manager).unwrap();

        info!("Starting test service");
        let app = test::init_service(app!(pool)).await;

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Create account - [Savings]
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Savings".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account {
            id: resp.id.clone(),
            name: "Savings".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // Update account - [Savings]
        let req = test::TestRequest::post()
            .uri(format!("/api/account/{}/", resp.id.clone()).as_str())
            .set_json(Account {
                id: resp.id.clone(),
                name: "Savings 2".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account {
            id: resp.id.clone(),
            name: "Savings 2".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // Delete original account - []
        let req = test::TestRequest::delete()
            .uri(format!("/api/account/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account {
            id: resp.id.clone(),
            name: "Savings 2".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // List no accounts - []
        let req = test::TestRequest::get()
            .uri("/api/account/")
            .to_request();
        let resp: Vec<Account> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 0);

        // Create account - [Savings]
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Savings".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account {
            id: resp.id.clone(),
            name: "Savings".to_string(),
            account_type: AccountType::Savings,
        }, resp);
        let savings_account = resp.clone();

        // Get account - [Savings]
        let req = test::TestRequest::get()
            .uri(format!("/api/account/{}/", resp.id).as_str())
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account {
            id: resp.id.clone(),
            name: "Savings".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // Create second account - [Savings, Loan]
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Loan".to_string(),
                account_type: AccountType::Loan,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account {
            id: resp.id.clone(),
            name: "Loan".to_string(),
            account_type: AccountType::Loan,
        }, resp);
        let loan_account = resp.clone();

        // List accounts - [Savings, Loan]
        let req = test::TestRequest::get()
            .uri("/api/account/")
            .to_request();
        let resp: Vec<Account> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 2);

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Create setting - [DefaultTransactionFromAccountId]
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::DefaultTransactionFromAccountId,
                value: savings_account.id.clone(),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting {
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: savings_account.id.clone(),
        }, resp);

        // Update setting - [DefaultTransactionFromAccountId]
        let req = test::TestRequest::post()
            .uri(format!("/api/setting/{}/", resp.id.clone()).as_str())
            .set_json(Setting {
                id: resp.id.clone(),
                key: SettingKey::DefaultTransactionFromAccountId,
                value: loan_account.id.clone(),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting {
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);

        // Delete setting - []
        let req = test::TestRequest::delete()
            .uri(format!("/api/setting/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting {
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);

        // List no settings - []
        let req = test::TestRequest::get()
            .uri("/api/setting/")
            .to_request();
        let resp: Vec<Setting> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 0);

        // Create setting - [DefaultTransactionFromAccountId]
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::DefaultTransactionFromAccountId,
                value: loan_account.id.clone(),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting {
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);

        // Get setting - [DefaultTransactionFromAccountId]
        let req = test::TestRequest::get()
            .uri(format!("/api/setting/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting {
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);
        let default_transaction_setting = resp;

        // Create setting - [DefaultTransactionFromAccountId, TransferWithoutBalanceIgnoredAccounts]
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
                value: format!("{},{}", loan_account.id.clone(), savings_account.id.clone()),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting {
            id: resp.id.clone(),
            key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
            value: format!("{},{}", loan_account.id.clone(), savings_account.id.clone()),
        }, resp);
        let transfer_without_setting = resp;

        // List no settings - [DefaultTransactionFromAccountId, TransferWithoutBalanceIgnoredAccounts]
        let req = test::TestRequest::get()
            .uri("/api/setting/")
            .to_request();
        let resp: Vec<Setting> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 2);

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Create transaction
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Balance,
                account_id: loan_account.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Transaction {
            id: resp.id.clone(),
            description: "".to_string(),
            date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
            value: Decimal::new(10, 2),
            transaction_type: TransactionType::Balance,
            account_id: loan_account.id.clone(),
            from_account_id: None,
        }, resp);

        // Update transaction
        let req = test::TestRequest::post()
            .uri(format!("/api/transaction/{}/", resp.id.clone()).as_str())
            .set_json(Transaction {
                id: resp.id.clone(),
                description: "Testing".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(15, 2),
                transaction_type: TransactionType::Balance,
                account_id: loan_account.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Transaction {
            id: resp.id.clone(),
            description: "Testing".to_string(),
            date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
            value: Decimal::new(15, 2),
            transaction_type: TransactionType::Balance,
            account_id: loan_account.id.clone(),
            from_account_id: None,
        }, resp);

        // Delete transaction
        let req = test::TestRequest::delete()
            .uri(format!("/api/transaction/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Transaction {
            id: resp.id.clone(),
            description: "Testing".to_string(),
            date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
            value: Decimal::new(15, 2),
            transaction_type: TransactionType::Balance,
            account_id: loan_account.id.clone(),
            from_account_id: None,
        }, resp);

        // List no transactions
        let req = test::TestRequest::get()
            .uri("/api/transaction/")
            .to_request();
        let resp: Vec<Transaction> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 0);

        // Create a transfer
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(12, 2),
                transaction_type: TransactionType::Transfer,
                account_id: loan_account.id.clone(),
                from_account_id: Some(savings_account.id.clone()),
            })
            .to_request();
        let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Transaction{
            id: resp.id.clone(),
            description: "That".to_string(),
            date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
            value: Decimal::new(12, 2),
            transaction_type: TransactionType::Transfer,
            account_id: loan_account.id.clone(),
            from_account_id: Some(savings_account.id.clone()),
        }, resp);

        // Create a balance
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Balance,
                account_id: loan_account.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Transaction{
            id: resp.id.clone(),
            description: "That".to_string(),
            date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
            value: Decimal::new(10, 2),
            transaction_type: TransactionType::Balance,
            account_id: loan_account.id.clone(),
            from_account_id: None,
        }, resp);

        // Get transaction
        let req = test::TestRequest::get()
            .uri(format!("/api/transaction/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Transaction{
            id: resp.id.clone(),
            description: "That".to_string(),
            date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
            value: Decimal::new(10, 2),
            transaction_type: TransactionType::Balance,
            account_id: loan_account.id.clone(),
            from_account_id: None,
        }, resp);

        // List no transactions
        let req = test::TestRequest::get()
            .uri(format!("/api/account/{}/transaction/", loan_account.id.clone()).as_str())
            .to_request();
        let resp: Vec<Transaction> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 2);

        let req = test::TestRequest::get()
            .uri(format!("/api/account/{}/transaction/", savings_account.id.clone()).as_str())
            .to_request();
        let resp: Vec<Transaction> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 1);

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Create transaction with unknown account
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Balance,
                account_id: "What".to_string(),
                from_account_id: None,
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Account What does not exist", text);

        // Create transaction with from account when balance
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 5).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Balance,
                account_id: loan_account.id.clone(),
                from_account_id: Some(savings_account.id.clone()),
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Balance cannot have a from_account_id", text);

        // Create transaction with the same date as a balance
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Balance,
                account_id: loan_account.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Conflicting transaction found on same date", text);

        // Create transaction with a from account
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 11).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Balance,
                account_id: loan_account.id.clone(),
                from_account_id: Some(savings_account.id.clone()),
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Balance cannot have a from_account_id", text);

        // Create transaction without from account when transaction
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Transfer,
                account_id: loan_account.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Transfer must have a from_account_id", text);

        // Create transaction with from account that doesn't exist
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "That".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Transfer,
                account_id: loan_account.id.clone(),
                from_account_id: Some("Who".to_string()),
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Account Who does not exist", text);

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Delete loan account - [Savings]
        let req = test::TestRequest::delete()
            .uri(format!("/api/account/{}/", loan_account.id.clone()).as_str())
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account {
            id: resp.id.clone(),
            name: "Loan".to_string(),
            account_type: AccountType::Loan,
        }, resp);

        // List no accounts - [Savings]
        let req = test::TestRequest::get()
            .uri("/api/account/")
            .to_request();
        let resp: Vec<Account> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 1);

        // Get transactions now deleted
        let req = test::TestRequest::get()
            .uri(format!("/api/account/{}/transaction/", loan_account.id.clone()).as_str())
            .to_request();
        let resp: Vec<Transaction> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 0);

        // Get setting now deleted - [DefaultTransactionFromAccountId]
        let req = test::TestRequest::get()
            .uri(format!("/api/setting/{}/", default_transaction_setting.id.clone()).as_str())
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        assert_eq!(http::StatusCode::NOT_FOUND, code);

        // Get setting now updated - [TransferWithoutBalanceIgnoredAccounts]
        let req = test::TestRequest::get()
            .uri(format!("/api/setting/{}/", transfer_without_setting.id.clone()).as_str())
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting {
            id: resp.id.clone(),
            key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
            value: format!("{}", loan_account.id.clone()),
        }, resp);

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Create setting with unknown account - [TransferWithoutBalanceIgnoredAccounts]
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::DefaultTransactionFromAccountId,
                value: "example".to_string(),
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Account example does not exist", text);

        // Create setting that already exists - [TransferWithoutBalanceIgnoredAccounts]
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
                value: savings_account.id.clone(),
            })
            .to_request();
        let response = test::call_service(&app, req).await;
        let code = response.response().status();
        let vec = body::to_bytes(response.into_body()).await.unwrap().into();
        let text = String::from_utf8(vec).unwrap();
        assert_eq!(http::StatusCode::INTERNAL_SERVER_ERROR, code);
        assert_eq!("Setting key TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS already exists", text);
    }

    #[actix_web::test]
    async fn test_issues() {
        // Create app
        env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

        let manager = SqliteConnectionManager::memory();
        run_migrations(&manager);
        let pool = Pool::new(manager).unwrap();

        info!("Starting test service");
        let app = test::init_service(app!(pool)).await;

        // Create External
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "External".to_string(),
                account_type: AccountType::External,
            })
            .to_request();
        let external: Account = test::call_and_read_body_json(&app, req).await;

        // Create Savings
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Savings".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let savings: Account = test::call_and_read_body_json(&app, req).await;

        // Create Loan
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Loan".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let loan: Account = test::call_and_read_body_json(&app, req).await;
        
        // Assign External to not show up in issues
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
                value: external.id.clone(),
            })
            .to_request();
        let _: Setting = test::call_and_read_body_json(&app, req).await;

        // Check there are 0 issues
        let req = test::TestRequest::get()
            .uri("/api/issue/")
            .to_request();
        let issues: Vec<Issue> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(issues, vec![]);

        // Create a transfer from external to savings
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(10, 2),
                transaction_type: TransactionType::Transfer,
                account_id: savings.id.clone(),
                from_account_id: Some(external.id.clone()),
            })
            .to_request();
        let _: Transaction = test::call_and_read_body_json(&app, req).await;

        // Check there is 1 issue
        let req = test::TestRequest::get()
            .uri("/api/issue/")
            .to_request();
        let issues: Vec<Issue> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(issues, vec![
            Issue {
                issue_type: IssueType::TransferWithoutBalance,
                account_id: Some(savings.id.clone()),
                date: Some(NaiveDate::from_ymd_opt(2024, 1, 10).unwrap())
            }
        ]);

        // Create a transfer from savings to loan on a different date
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 11).unwrap(),
                value: Decimal::new(12, 2),
                transaction_type: TransactionType::Transfer,
                account_id: savings.id.clone(),
                from_account_id: Some(loan.id.clone()),
            })
            .to_request();
        let _: Transaction = test::call_and_read_body_json(&app, req).await;

        // Check there are 3 issue
        let req = test::TestRequest::get()
            .uri("/api/issue/")
            .to_request();
        let issues: Vec<Issue> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(issues, vec![
            Issue {
                issue_type: IssueType::TransferWithoutBalance,
                account_id: Some(savings.id.clone()),
                date: Some(NaiveDate::from_ymd_opt(2024, 1, 10).unwrap())
            },
            Issue {
                issue_type: IssueType::TransferWithoutBalance,
                account_id: Some(loan.id.clone()),
                date: Some(NaiveDate::from_ymd_opt(2024, 1, 11).unwrap())
            },
            Issue {
                issue_type: IssueType::TransferWithoutBalance,
                account_id: Some(savings.id.clone()),
                date: Some(NaiveDate::from_ymd_opt(2024, 1, 11).unwrap())
            }
        ]);

        // Create a balance for savings on the 10th
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 11).unwrap(),
                value: Decimal::new(12, 2),
                transaction_type: TransactionType::Balance,
                account_id: savings.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let _: Transaction = test::call_and_read_body_json(&app, req).await;

        // Check there are 2 issue
        let req = test::TestRequest::get()
            .uri("/api/issue/")
            .to_request();
        let issues: Vec<Issue> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(issues, vec![
            Issue {
                issue_type: IssueType::TransferWithoutBalance,
                account_id: Some(savings.id.clone()),
                date: Some(NaiveDate::from_ymd_opt(2024, 1, 10).unwrap())
            },
            Issue {
                issue_type: IssueType::TransferWithoutBalance,
                account_id: Some(loan.id.clone()),
                date: Some(NaiveDate::from_ymd_opt(2024, 1, 11).unwrap())
            }
        ]);

        // Create a balance for loan on the 10th
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 11).unwrap(),
                value: Decimal::new(12, 2),
                transaction_type: TransactionType::Balance,
                account_id: loan.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let _: Transaction = test::call_and_read_body_json(&app, req).await;

        // Check there is 1 issue
        let req = test::TestRequest::get()
            .uri("/api/issue/")
            .to_request();
        let issues: Vec<Issue> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(issues, vec![
            Issue {
                issue_type: IssueType::TransferWithoutBalance,
                account_id: Some(savings.id.clone()),
                date: Some(NaiveDate::from_ymd_opt(2024, 1, 10).unwrap())
            }
        ]);

        // Create a balance for savings on the 10th
        let req = test::TestRequest::post()
            .uri("/api/transaction/")
            .set_json(NewTransaction {
                description: "".to_string(),
                date: NaiveDate::from_ymd_opt(2024, 1, 10).unwrap(),
                value: Decimal::new(12, 2),
                transaction_type: TransactionType::Balance,
                account_id: savings.id.clone(),
                from_account_id: None,
            })
            .to_request();
        let _: Transaction = test::call_and_read_body_json(&app, req).await;

        // Check there are no issues
        let req = test::TestRequest::get()
            .uri("/api/issue/")
            .to_request();
        let issues: Vec<Issue> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(issues, vec![]);
    }
}