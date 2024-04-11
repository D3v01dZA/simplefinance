use actix_web::{Error, get, HttpResponse, web};
use log::info;
use crate::db::Pool;
use crate::transaction::db;

#[get("/api/transaction/")]
pub async fn list_transactions(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_transactions");
    db::list_transactions(&db).await
        .map(|value| HttpResponse::Ok().json(value))
}