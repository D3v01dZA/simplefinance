use actix_cors::Cors;
use actix_web::{web, App, HttpServer, middleware};
use log::{*};
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Connection;
mod db;
mod api;
mod schema;

use db::{Pool};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    run_migrations();

    let manager = SqliteConnectionManager::file("database.db");
    let pool = Pool::new(manager).unwrap();

    info!("Starting HTTP server at http://localhost:8080");

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(middleware::Logger::default())
            .wrap(Cors::permissive())
            .route("/api/setting/", web::get().to(api::list_settings))
            .route("/api/account/", web::get().to(api::list_accounts))
            .route("/api/transaction/", web::get().to(api::list_transactions))
    })
        .bind(("127.0.0.1", 8080))?
        .workers(4)
        .run()
        .await
}

fn run_migrations() {
    info!("Running migrations");
    refinery::embed_migrations!("migrations");
    let mut conn = Connection::open("database.db").unwrap();
    migrations::runner().run(&mut conn).unwrap();
    info!("Finished running migrations");
}