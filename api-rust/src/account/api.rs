use actix_web::{delete, Error, get, HttpResponse, post, web};
use log::info;
use crate::account::{db, schema};
use crate::db::Pool;

#[post("/api/account/")]
pub async fn create_account(db: web::Data<Pool>, new_account: web::Json<schema::NewAccount>) -> Result<HttpResponse, Error> {
    let new_account = new_account.into_inner();
    info!("HTTP create_account new_account:[{:?}]", &new_account);
    db::create_account(&db, new_account).await
        .map(crate::api::handle_option)
}


#[post("/api/account/{id}/")]
pub async fn update_account(db: web::Data<Pool>, path: web::Path<String>, updated_account: web::Json<schema::Account>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    let updated_account = updated_account.into_inner();
    info!("HTTP update_account id:[{}] updated_account:[{:?}]", id, &updated_account);
    let option = crate::api::compare_ids(&id, &updated_account.id);
    if option.is_some() {
        return Err(option.unwrap());
    }
    db::update_account(&db, updated_account).await
        .map(crate::api::handle_option)
}

#[delete("/api/account/{id}/")]
pub async fn delete_account(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP delete_account id:[{}]", id);
    db::delete_account(&db, id).await
        .map(crate::api::handle_option)
}

#[get("/api/account/{id}/")]
pub async fn get_account(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP get_account id:[{}]", &id);
    db::get_account(&db, id).await
        .map(crate::api::handle_option)
}

#[get("/api/account/")]
pub async fn list_accounts(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_accounts");
    db::list_accounts(&db).await
        .map(|value| HttpResponse::Ok().json(value))
}