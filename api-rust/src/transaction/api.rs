use actix_web::{delete, Error, error, get, HttpResponse, post, web};
use log::{error, info};
use crate::db::{do_in_transaction, Pool};
use crate::transaction::db;
use crate::transaction::schema::{NewTransaction, Transaction};

#[post("/api/transaction/")]
pub async fn create_transaction(db: web::Data<Pool>, new_transaction: web::Json<NewTransaction>) -> Result<HttpResponse, Error> {
    let new_transaction= new_transaction.into_inner();
    info!("HTTP create_transaction new_transaction:[{new_transaction:?}]");
    do_in_transaction(&db, |transaction| db::create_transaction(transaction, new_transaction))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP create_transaction: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[post("/api/transaction/{id}/")]
pub async fn update_transaction(db: web::Data<Pool>, path: web::Path<String>, updated_transaction: web::Json<Transaction>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    let updated_transaction= updated_transaction.into_inner();
    info!("HTTP update_transaction id:[{id}] updated_transaction: [{updated_transaction:?}]");
    let option = crate::api::compare_ids(&id, &updated_transaction.id);
    if option.is_some() {
        return Err(option.unwrap());
    }
    do_in_transaction(&db, |transaction| db::update_transaction(transaction, updated_transaction))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP update_transaction: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[delete("/api/transaction/{id}/")]
pub async fn delete_transaction(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP delete_transaction transaction_id:[{id}]");
    do_in_transaction(&db, |transaction| db::delete_transaction(transaction, id))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP delete_transaction: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[get("/api/transaction/{transaction_id}/")]
pub async fn get_transaction(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP get_transaction id:[{id}]");
    do_in_transaction(&db, |transaction| db::get_transaction(transaction, id))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP get_transaction: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[get("/api/account/{account_id}/transaction/")]
pub async fn list_account_transactions(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let account_id = path.clone();
    info!("HTTP list_transactions account_id:[{account_id}]");
    do_in_transaction(&db, |transaction| db::list_account_transactions(transaction, account_id))
        .await
        .map(|value| HttpResponse::Ok().json(value))
        .map_err(|err| {
            error!("HTTP list_transactions: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[get("/api/transaction/")]
pub async fn list_transactions(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_all_transactions");
    do_in_transaction(&db, |transaction| db::list_transactions(transaction))
        .await
        .map(|value| HttpResponse::Ok().json(value))
        .map_err(|err| {
            error!("HTTP list_all_transactions: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}