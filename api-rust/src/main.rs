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
    use crate::api;
    use crate::db::Pool;
    use crate::run_migrations;
    use crate::schema::*;

    #[actix_web::test]
    async fn test_api() {
        env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

        let manager = SqliteConnectionManager::memory();
        run_migrations(&manager);
        let pool = Pool::new(manager).unwrap();

        info!("Starting test service");
        let app = test::init_service(app!(pool)).await;

        let req = test::TestRequest::post()
            .uri("/api/setting/")
            .set_json(NewSetting {
                key: SettingKey::TransferWithoutBalanceIgnoredAccounts,
                value: "10".to_string()
            })
            .to_request();
        let resp: Setting = test::call_and_read_body_json(&app, req).await;

        // assert_eq!(resp.len(), 0);
    }

}