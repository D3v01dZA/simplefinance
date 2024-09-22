use const_format::formatcp;
use rusqlite::{Transaction};
use rust_decimal::Decimal;
use uuid::Uuid;
use crate::db::{list, single};
use crate::expense::schema::{NewExpense, Expense};

const EXPENSE_COLUMNS: &str = "id, description, external, category, date, value";
const EXPENSE_SELECT: &str = formatcp!("SELECT {EXPENSE_COLUMNS} FROM expense");
const EXPENSE_RETURNING: &str = formatcp!("RETURNING {EXPENSE_COLUMNS}");
const EXPENSE_ORDERING: &str = "ORDER BY date, category, description, id ASC";

pub fn create_expense(transaction: &Transaction, new_expense: NewExpense) -> anyhow::Result<Option<Expense>> {
    return single(
        transaction,
        formatcp!("INSERT INTO expense ({EXPENSE_COLUMNS}) VALUES (?1, ?2, ?3, ?4, ?5, ?6) {EXPENSE_RETURNING}"),
        [Uuid::new_v4().to_string(), new_expense.description, new_expense.external, new_expense.category.to_string(), new_expense.date.to_string(), normalize_decimal(&new_expense.value).to_string()],
    );
}

pub fn update_expense(transaction: &Transaction, updated_expense: Expense) -> anyhow::Result<Option<Expense>> {
    return single(
        transaction,
        formatcp!("UPDATE expense SET description = ?1, external = ?2, category = ?3, date = ?4, value = ?5 WHERE id = ?6 {EXPENSE_RETURNING}"),
        [updated_expense.description, updated_expense.external, updated_expense.category.to_string(), updated_expense.date.to_string(), normalize_decimal(&updated_expense.value).to_string(), updated_expense.id],
    );
}

pub fn delete_expense(transaction: &Transaction, id: String) -> anyhow::Result<Option<Expense>> {
    return single(
        transaction,
        formatcp!("DELETE FROM expense WHERE id = ?1 {EXPENSE_RETURNING}"),
        [id],
    );
}

pub fn get_expense(transaction: &Transaction, id: String) -> anyhow::Result<Option<Expense>> {
    return single(
        transaction,
        formatcp!("{EXPENSE_SELECT} WHERE id = ?1"),
        [id],
    );
}

pub fn list_expenses(transaction: &Transaction) -> anyhow::Result<Vec<Expense>> {
    return list(
        transaction,
        formatcp!("{EXPENSE_SELECT} {EXPENSE_ORDERING}"),
        [],
    );
}

fn normalize_decimal(decimal: &Decimal) -> Decimal {
    let mut cloned = decimal.clone();
    cloned.rescale(2);
    return cloned
}

