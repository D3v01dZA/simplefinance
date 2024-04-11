use actix_web::{HttpResponse, Error, error};
use serde::Serialize;

pub fn handle_option<T: Serialize>(option: Option<T>) -> HttpResponse {
    return match option {
        None => HttpResponse::NotFound().finish(),
        Some(value) => HttpResponse::Ok().json(value)
    }
}

pub fn compare_ids(id1: &String, id2: &String) -> Option<Error> {
    if id1 != id2 {
        return Some(error::ErrorBadRequest("Mismatched entity id and request id"))
    }
    return None
}