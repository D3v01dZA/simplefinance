use actix_web::{delete, Error, error, get, HttpResponse, post, web};
use log::info;
use crate::db::{do_in_transaction, Pool};
use crate::setting::db;
use crate::setting::schema::{NewSetting, Setting};

#[post("/api/setting/")]
pub async fn create_setting(db: web::Data<Pool>, new_setting: web::Json<NewSetting>) -> Result<HttpResponse, Error> {
    let new_setting = new_setting.into_inner();
    info!("HTTP create_setting new_setting:[{:?}]", &new_setting);
    do_in_transaction(&db, |transaction| db::create_setting(transaction, new_setting))
        .await
        .map(crate::api::handle_option)
        .map_err(error::ErrorInternalServerError)
}

#[post("/api/setting/{id}/")]
pub async fn update_setting(db: web::Data<Pool>, path: web::Path<String>, updated_setting: web::Json<Setting>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    let updated_setting = updated_setting.into_inner();
    info!("HTTP update_setting id:[{}] updated_setting:[{:?}]", id, &updated_setting);
    let option = crate::api::compare_ids(&id, &updated_setting.id);
    if option.is_some() {
        return Err(option.unwrap());
    }
    do_in_transaction(&db, |transaction| db::update_setting(transaction, updated_setting))
        .await
        .map(crate::api::handle_option)
        .map_err(error::ErrorInternalServerError)
}

#[delete("/api/setting/{id}/")]
pub async fn delete_setting(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP delete_setting id:[{}]", id);
    do_in_transaction(&db, |transaction| db::delete_setting(transaction, id))
        .await
        .map(crate::api::handle_option)
        .map_err(error::ErrorInternalServerError)
}

#[get("/api/setting/{id}/")]
pub async fn get_setting(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP get_setting id:[{}]", &id);
    do_in_transaction(&db, |transaction| db::get_setting(transaction, id))
        .await
        .map(crate::api::handle_option)
        .map_err(error::ErrorInternalServerError)
}

#[get("/api/setting/")]
pub async fn list_settings(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_settings");
    do_in_transaction(&db, |transaction| db::list_settings(transaction))
        .await
        .map(|value| HttpResponse::Ok().json(value))
        .map_err(error::ErrorInternalServerError)
}