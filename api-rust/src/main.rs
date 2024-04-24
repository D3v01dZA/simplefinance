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

        .service(transaction::api::list_transactions)
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
    use actix_web::{web, App, test, middleware};
    use actix_cors::Cors;
    use log::info;
    use r2d2_sqlite::SqliteConnectionManager;
    use crate::setting;
    use crate::account;
    use crate::account::schema::{Account, AccountType, NewAccount};
    use crate::transaction;
    use crate::db::Pool;
    use crate::run_migrations;
    use crate::setting::schema::{NewSetting, Setting, SettingKey};

    #[actix_web::test]
    async fn test_api() {
        env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

        let manager = SqliteConnectionManager::memory();
        run_migrations(&manager);
        let pool = Pool::new(manager).unwrap();

        info!("Starting test service");
        let app = test::init_service(app!(pool)).await;

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Create account
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Savings".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account{
            id: resp.id.clone(),
            name: "Savings".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // Update account
        let req = test::TestRequest::post()
            .uri(format!("/api/account/{}/", resp.id.clone()).as_str())
            .set_json(Account {
                id: resp.id.clone(),
                name: "Savings 2".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account{
            id: resp.id.clone(),
            name: "Savings 2".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // Delete account
        let req = test::TestRequest::delete()
            .uri(format!("/api/account/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account{
            id: resp.id.clone(),
            name: "Savings 2".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // List no accounts
        let req = test::TestRequest::get()
            .uri("/api/account/")
            .to_request();
        let resp: Vec<Account> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 0);

        // Create accounts
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Savings".to_string(),
                account_type: AccountType::Savings,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account{
            id: resp.id.clone(),
            name: "Savings".to_string(),
            account_type: AccountType::Savings,
        }, resp);
        let savings_account = resp.clone();

        // Get account
        let req = test::TestRequest::get()
            .uri(format!("/api/account/{}/", resp.id).as_str())
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account{
            id: resp.id.clone(),
            name: "Savings".to_string(),
            account_type: AccountType::Savings,
        }, resp);

        // Create second account
        let req = test::TestRequest::post()
            .uri("/api/account/")
            .set_json(NewAccount {
                name: "Loan".to_string(),
                account_type: AccountType::Loan,
            })
            .to_request();
        let resp: Account = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Account{
            id: resp.id.clone(),
            name: "Loan".to_string(),
            account_type: AccountType::Loan,
        }, resp);
        let loan_account = resp.clone();

        // List no accounts
        let req = test::TestRequest::get()
            .uri("/api/account/")
            .to_request();
        let resp: Vec<Account> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 2);

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // // Create transaction
        // let req = test::TestRequest::post()
        //     .uri("/api/transaction/")
        //     .set_json(NewTransaction {
        //         name: "Savings".to_string(),
        //         transaction_type: TransactionType::Savings,
        //     })
        //     .to_request();
        // let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        // assert_eq!(Transaction{
        //     id: resp.id.clone(),
        //     name: "Savings".to_string(),
        //     transaction_type: TransactionType::Savings,
        // }, resp);
        //
        // // Update transaction
        // let req = test::TestRequest::post()
        //     .uri(format!("/api/transaction/{}/", resp.id.clone()).as_str())
        //     .set_json(Transaction {
        //         id: resp.id.clone(),
        //         name: "Savings 2".to_string(),
        //         transaction_type: TransactionType::Savings,
        //     })
        //     .to_request();
        // let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        // assert_eq!(Transaction{
        //     id: resp.id.clone(),
        //     name: "Savings 2".to_string(),
        //     transaction_type: TransactionType::Savings,
        // }, resp);
        //
        // // Delete transaction
        // let req = test::TestRequest::delete()
        //     .uri(format!("/api/transaction/{}/", resp.id.clone()).as_str())
        //     .to_request();
        // let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        // assert_eq!(Transaction{
        //     id: resp.id.clone(),
        //     name: "Savings 2".to_string(),
        //     transaction_type: TransactionType::Savings,
        // }, resp);
        //
        // // List no transactions
        // let req = test::TestRequest::get()
        //     .uri("/api/transaction/")
        //     .to_request();
        // let resp: Vec<Transaction> = test::call_and_read_body_json(&app, req).await;
        // assert_eq!(resp.len(), 0);
        //
        // // Create transaction
        // let req = test::TestRequest::post()
        //     .uri("/api/transaction/")
        //     .set_json(NewTransaction {
        //         name: "Savings".to_string(),
        //         transaction_type: TransactionType::Savings,
        //     })
        //     .to_request();
        // let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        // assert_eq!(Transaction{
        //     id: resp.id.clone(),
        //     name: "Savings".to_string(),
        //     transaction_type: TransactionType::Savings,
        // }, resp);
        //
        // // Get transaction
        // let req = test::TestRequest::get()
        //     .uri(format!("/api/transaction/{}/", resp.id.clone()).as_str())
        //     .to_request();
        // let resp: Transaction = test::call_and_read_body_json(&app, req).await;
        // assert_eq!(Transaction{
        //     id: resp.id.clone(),
        //     name: "Savings".to_string(),
        //     transaction_type: TransactionType::Savings,
        // }, resp);

        // ------------------------------------------------------------------------------------------------------------------------------------------------

        // Create setting
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::DefaultTransactionFromAccountId,
                value: savings_account.id.clone(),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting{
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: savings_account.id.clone(),
        }, resp);

        // Update setting
        let req = test::TestRequest::post()
            .uri(format!("/api/setting/{}/", resp.id.clone()).as_str())
            .set_json(Setting {
                id: resp.id.clone(),
                key: SettingKey::DefaultTransactionFromAccountId,
                value: loan_account.id.clone(),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting{
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);

        // Delete setting
        let req = test::TestRequest::delete()
            .uri(format!("/api/setting/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting{
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);

        // List no settings
        let req = test::TestRequest::get()
            .uri("/api/setting/")
            .to_request();
        let resp: Vec<Setting> = test::call_and_read_body_json(&app, req).await;
        assert_eq!(resp.len(), 0);

        // Create setting
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::DefaultTransactionFromAccountId,
                value: loan_account.id.clone(),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting{
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);

        // Get setting
        let req = test::TestRequest::get()
            .uri(format!("/api/setting/{}/", resp.id.clone()).as_str())
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting{
            id: resp.id.clone(),
            key: SettingKey::DefaultTransactionFromAccountId,
            value: loan_account.id.clone(),
        }, resp);

        // Create setting
        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
                value: format!("{},{}", loan_account.id.clone(), savings_account.id.clone()),
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;
        assert_eq!(Setting{
            id: resp.id.clone(),
            key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
            value: format!("{},{}", loan_account.id.clone(), savings_account.id.clone()),
        }, resp);
    }

}