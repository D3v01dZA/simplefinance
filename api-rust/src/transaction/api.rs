use actix_web::{Error, error, get, HttpResponse, web};
use log::info;
use crate::db::{do_in_transaction, Pool};
use crate::transaction::db;

#[get("/api/transaction/")]
pub async fn list_transactions(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_transactions");
    do_in_transaction(&db, |transaction| db::list_transactions(transaction))
        .await
        .map(|value| HttpResponse::Ok().json(value))
        .map_err(error::ErrorInternalServerError)
}