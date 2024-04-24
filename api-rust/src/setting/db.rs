use anyhow::anyhow;
use const_format::formatcp;
use rusqlite::Transaction;
use uuid::Uuid;
use crate::account::db::get_account;
use crate::db::{list, single};
use crate::setting::schema::{NewSetting, Setting, SettingKey};

const SETTING_COLUMNS: &str = "id, key, value";
const SETTING_SELECT: &str = formatcp!("SELECT {} FROM setting", SETTING_COLUMNS);
const SETTING_RETURNING: &str = formatcp!("RETURNING {}", SETTING_COLUMNS);

pub fn create_setting(transaction: &Transaction, new_setting: NewSetting) -> anyhow::Result<Option<Setting>> {
    verify(transaction, new_setting.key.clone(), new_setting.value.clone())?;
    return single(
        transaction,
        formatcp!("INSERT INTO setting VALUES (?1, ?2, ?3) {}", SETTING_RETURNING),
        [Uuid::new_v4().to_string(), new_setting.key.to_string(), new_setting.value],
    );
}

pub fn update_setting(transaction: &Transaction, updated_setting: Setting) -> anyhow::Result<Option<Setting>> {
    verify_account_exists(transaction, updated_setting.value.clone())?;
    return single(
        transaction,
        formatcp!("UPDATE setting SET key = ?1, value = ?2 WHERE id = ?3 {}", SETTING_RETURNING),
        [updated_setting.key.to_string(), updated_setting.value, updated_setting.id],
    );
}

pub fn delete_setting(transaction: &Transaction, id: String) -> anyhow::Result<Option<Setting>> {
    return single(
        transaction,
        formatcp!("DELETE FROM setting WHERE id = ?1 {}", SETTING_RETURNING),
        [id],
    );
}

pub fn get_setting(transaction: &Transaction, id: String) -> anyhow::Result<Option<Setting>> {
    return single(
        transaction,
        formatcp!("{} WHERE id = ?1", SETTING_SELECT),
        [id],
    );
}

pub fn list_settings(transaction: &Transaction) -> anyhow::Result<Vec<Setting>> {
    return list(
        transaction,
        SETTING_SELECT,
        [],
    );
}

fn verify(transaction: &Transaction, setting_key: SettingKey, value: String) -> anyhow::Result<()> {
    match setting_key {
        SettingKey::DefaultTransactionFromAccountId => verify_account_exists(transaction, value),
        SettingKey::TransferWithoutBalanceIgnoredAccounts => {
            return value.split(",")
                .map(|id| verify_account_exists(transaction, id.to_string()))
                .filter(|result| result.is_err())
                .collect();
        }
    }
}

fn verify_account_exists(transaction: &Transaction, id: String) -> anyhow::Result<()> {
    let result = get_account(transaction, id.clone())?;
    if result.is_none() {
        return Err(anyhow!("Account {} does not exist", id.clone()));
    }
    return Ok(())
}