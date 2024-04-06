use actix_web::{HttpResponse, web, Error};
use crate::db;
use crate::db::Pool;

pub async fn list_settings(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    db::list_settings(&db).await
        .map(|value| HttpResponse::Ok().json(value))
}

pub async fn list_accounts(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    db::list_accounts(&db).await
        .map(|value| HttpResponse::Ok().json(value))
}

pub async fn list_transactions(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    db::list_transactions(&db).await
        .map(|value| HttpResponse::Ok().json(value))
}

