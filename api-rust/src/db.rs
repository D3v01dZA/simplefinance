use std::str::FromStr;
use actix_web::{error, Error, web};
use rusqlite::Row;
use log::{*};
use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, Type, ValueRef};
use rust_decimal::Decimal;
use crate::schema::{Account, AccountType, Setting, SettingKey, Transaction, TransactionType};

pub type Pool = r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>;

pub async fn list_settings(pool: &Pool) -> Result<Vec<Setting>, Error> {
    return list(pool, "SELECT id, key, value FROM setting".to_string()).await;
}

pub async fn list_accounts(pool: &Pool) -> Result<Vec<Account>, Error> {
    return list(pool, "SELECT id, name, type FROM account".to_string()).await;
}

pub async fn list_transactions(pool: &Pool) -> Result<Vec<Transaction>, Error> {
    return list(pool, "SELECT id, description, date, value, type, account_id, from_account_id FROM account_transaction".to_string()).await;
}

async fn list<T: FromRow + 'static>(pool: &Pool, sql: String) -> Result<Vec<T>, Error> {
    let pool = pool.clone();

    let conn = web::block(move || pool.get())
        .await?
        .map_err(error::ErrorInternalServerError)?;

    web::block(move || {
        conn.prepare(sql.as_str())?
            .query_map([], |row| FromRow::from_row(row))
            .and_then(Iterator::collect)
    })
        .await?
        .map_err(|err| {
            error!("SQL failed {}", err);
            error::ErrorInternalServerError(err)
        })
}

fn get_decimal(row: &Row, value: &str) -> rusqlite::Result<Decimal> {
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

impl FromRow for Setting {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Setting {
            id: row.get("id")?,
            key: row.get("key")?,
            value: row.get("value")?,
        })
    }
}

impl FromRow for Account {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Account {
            id: row.get("id")?,
            name: row.get("name")?,
            account_type: row.get("type")?,
        })
    }
}

impl FromRow for Transaction {
    fn from_row(row: &Row) -> rusqlite::Result<Self> {
        Ok(Transaction {
            id: row.get("id")?,
            description: row.get("description")?,
            date: row.get("date")?,
            value: get_decimal(row, "value")?,
            transaction_type: row.get("type")?,
            account_id: row.get("account_id")?,
            from_account_id: row.get("from_account_id")?,
        })
    }
}

impl FromSql for SettingKey {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        match value.as_str() {
            Ok(value) => SettingKey::from_str(value).map_err(|err| FromSqlError::Other(Box::new(err))),
            Err(err) => Err(err)
        }
    }
}

impl FromSql for AccountType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        match value.as_str() {
            Ok(value) => AccountType::from_str(value).map_err(|err| FromSqlError::Other(Box::new(err))),
            Err(err) => Err(err)
        }
    }
}

impl FromSql for TransactionType {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        match value.as_str() {
            Ok(value) => TransactionType::from_str(value).map_err(|err| FromSqlError::Other(Box::new(err))),
            Err(err) => Err(err)
        }
    }
}