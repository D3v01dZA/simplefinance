use actix_web::{Error, get, HttpResponse, web};
use log::info;
use crate::account::db;
use crate::db::Pool;

#[get("/api/account/")]
pub async fn list_accounts(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_accounts");
    db::list_accounts(&db).await
        .map(|value| HttpResponse::Ok().json(value))
}