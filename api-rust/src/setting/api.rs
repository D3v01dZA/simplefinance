use actix_web::{delete, Error, get, HttpResponse, post, web};
use log::info;
use crate::db::Pool;
use crate::setting::db;
use crate::setting::schema::{NewSetting, Setting};

#[post("/api/setting/")]
pub async fn create_setting(db: web::Data<Pool>, new_setting: web::Json<NewSetting>) -> Result<HttpResponse, Error> {
    let new_setting = new_setting.into_inner();
    info!("HTTP create_setting new_setting:[{:?}]", &new_setting);
    db::create_setting(&db, new_setting).await
        .map(crate::api::handle_option)
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
    db::update_setting(&db, updated_setting).await
        .map(crate::api::handle_option)
}

#[delete("/api/setting/{id}/")]
pub async fn delete_setting(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP delete_setting id:[{}]", id);
    db::delete_setting(&db, id).await
        .map(crate::api::handle_option)
}

#[get("/api/setting/{id}/")]
pub async fn get_setting(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP get_setting id:[{}]", &id);
    db::get_setting(&db, id).await
        .map(crate::api::handle_option)
}

#[get("/api/setting/")]
pub async fn list_settings(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_settings");
    db::list_settings(&db).await
        .map(|value| HttpResponse::Ok().json(value))
}