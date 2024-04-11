use std::fmt::Debug;
use std::str::FromStr;
use actix_web::{error, Error, web};
use rusqlite::{Params, Row};
use log::{*};
use rusqlite::types::{Type};
use rust_decimal::Decimal;
use crate::util::SliceDisplay;

pub type Pool = r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>;

pub async fn single<T: FromRow + 'static + Clone + Debug, P: Params + Send + 'static>(pool: &Pool, sql: &'static str, params: P) -> Result<Option<T>, Error> {
    let mut list: Vec<T> = list(pool, sql, params).await?;
    return if list.len() == 1 {
        Ok(Some(list.remove(0)))
    } else if list.len() == 0 {
        Ok(None)
    } else {
        error!("Multiple results returned sql:[{}] results:{}", sql, SliceDisplay(&list));
        Err(error::ErrorInternalServerError(format!("Multiple results returned for [{}]", sql)))
    }
}

pub async fn list<T: FromRow + 'static, P: Params + Send + 'static>(pool: &Pool, sql: &'static str, params: P) -> Result<Vec<T>, Error> {
    info!("Running sql:[{}]", &sql);

    let pool = pool.clone();
    let conn = web::block(move || pool.get())
        .await?
        .map_err(error::ErrorInternalServerError)?;

    web::block(move || {
        conn.prepare(sql)?
            .query_map(params, |row| FromRow::from_row(row))
            .and_then(Iterator::collect)
    })
        .await?
        .map_err(|err| {
            error!("SQL failed [{}]", err);
            error::ErrorInternalServerError(err)
        })
}

pub fn get_decimal(row: &Row, value: &str) -> rusqlite::Result<Decimal> {
    let string: String = row.get(value)?;
    return Decimal::from_str(string.as_str())
        .map(|decimal| {
            let mut scaled = decimal.clone();
            scaled.rescale(2);
            return scaled;
        })
        .map_err(|err| {
            error!("Couldn't parse {} as decimal {}", string, err);
            return rusqlite::Error::FromSqlConversionFailure(0, Type::Real, Box::from(err));
        })
}

pub trait FromRow: Sized + Send {

    fn from_row(row: &Row) -> rusqlite::Result<Self>;

}