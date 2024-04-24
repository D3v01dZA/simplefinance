use std::fmt::Debug;
use std::str::FromStr;
use actix_web::{web};
use anyhow::{anyhow};
use rusqlite::{Params, Row, Transaction};
use log::{*};
use rusqlite::types::{Type};
use rust_decimal::Decimal;

pub type Pool = r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>;

pub async fn do_in_transaction<R: Send + 'static, F: Send + 'static + FnOnce(&Transaction) -> anyhow::Result<R>>(pool: & Pool, function: F) -> anyhow::Result<R> {
    let pool = pool.clone();
    return web::block(move || {
        let mut connection = pool.get()?;
        let transaction = connection.transaction()?;
        let result = function(&transaction);
        match result {
            Ok(_) => transaction.commit()?,
            Err(_) => transaction.rollback()?
        }
        return result;
    })
        .await?;
}

pub fn single<T: FromRow + 'static + Clone + Debug, P: Params + Send + 'static>(transaction: &Transaction, sql: &'static str, params: P) -> anyhow::Result<Option<T>> {
    let mut list: Vec<T> = list(transaction, sql, params)?;
    return if list.len() == 1 {
        Ok(Some(list.remove(0)))
    } else if list.len() == 0 {
        Ok(None)
    } else {
        Err(anyhow!("Multiple results returned for [{}]", sql))
    };
}

pub fn list<T: FromRow + 'static, P: Params + Send + 'static>(transaction: &Transaction, sql: &'static str, params: P) -> anyhow::Result<Vec<T>> {
    debug!("Running [{}]", sql);
    return transaction.prepare(sql)?
        .query_map(params, |row| FromRow::from_row(row))
        .and_then(Iterator::collect)
        .map_err(|err| anyhow!("{}", err.to_string()));
}

pub fn get_decimal(row: &Row, value: &str) -> rusqlite::Result<Decimal> {
    let string: String = row.get(value)?;
    return Decimal::from_str(string.as_str())
        .map(|decimal| {
            let mut scaled = decimal.clone();
            scaled.rescale(2);
            return scaled;
        })
        .map_err(|err| rusqlite::Error::FromSqlConversionFailure(0, Type::Real, Box::from(err)));
}

pub trait FromRow: Sized + Send {

    fn from_row(row: &Row) -> rusqlite::Result<Self>;

}