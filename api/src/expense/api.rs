use actix_web::{delete, Error, error, get, HttpResponse, post, web};
use log::{error, info};
use crate::db::{do_in_transaction, Pool};
use crate::expense::db;
use crate::expense::schema::{NewExpense, Expense};

#[post("/api/expense/")]
pub async fn create_expense(db: web::Data<Pool>, new_expense: web::Json<NewExpense>) -> Result<HttpResponse, Error> {
    let new_expense = new_expense.into_inner();
    info!("HTTP create_expense new_expense:[{:?}]", &new_expense);
    do_in_transaction(&db, |transaction| db::create_expense(transaction, new_expense))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP create_expense: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[post("/api/expense/{id}/")]
pub async fn update_expense(db: web::Data<Pool>, path: web::Path<String>, updated_expense: web::Json<Expense>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    let updated_expense = updated_expense.into_inner();
    info!("HTTP update_expense id:[{}] updated_expense:[{:?}]", id, &updated_expense);
    let option = crate::api::compare_ids(&id, &updated_expense.id);
    if option.is_some() {
        return Err(option.unwrap());
    }
    do_in_transaction(&db, |transaction| db::update_expense(transaction, updated_expense))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP update_expense: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[delete("/api/expense/{id}/")]
pub async fn delete_expense(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP delete_expense id:[{}]", id);
    do_in_transaction(&db, |transaction| db::delete_expense(transaction, id))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP delete_expense: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[get("/api/expense/{id}/")]
pub async fn get_expense(db: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, Error> {
    let id = path.clone();
    info!("HTTP get_expense id:[{}]", &id);
    do_in_transaction(&db, |transaction| db::get_expense(transaction, id))
        .await
        .map(crate::api::handle_option)
        .map_err(|err| {
            error!("HTTP get_expense: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}

#[get("/api/expense/")]
pub async fn list_expenses(db: web::Data<Pool>) -> Result<HttpResponse, Error> {
    info!("HTTP list_expenses");
    do_in_transaction(&db, |transaction| db::list_expenses(transaction))
        .await
        .map(|value| HttpResponse::Ok().json(value))
        .map_err(|err| {
            error!("HTTP list_expenses: [{err}]");
            return error::ErrorInternalServerError(err)
        })
}
