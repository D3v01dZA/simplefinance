use anyhow::anyhow;
use const_format::formatcp;
use log::info;
use rusqlite::{Transaction};
use uuid::Uuid;
use crate::account::db::{verify_account_exists};
use crate::db::{list, single};
use crate::setting::schema::{NewSetting, Setting, SettingKey};

const SETTING_COLUMNS: &str = "id, key, value";
const SETTING_SELECT: &str = formatcp!("SELECT {SETTING_COLUMNS} FROM setting");
const SETTING_RETURNING: &str = formatcp!("RETURNING {SETTING_COLUMNS}");
const SETTING_ORDERING: &str = "ORDER BY key ASC";

pub fn create_setting(transaction: &Transaction, new_setting: NewSetting) -> anyhow::Result<Option<Setting>> {
    verify_new(transaction, new_setting.key.clone())?;
    verify(transaction, new_setting.key.clone(), new_setting.value.clone())?;
    return single(
        transaction,
        formatcp!("INSERT INTO setting ({SETTING_COLUMNS}) VALUES (?1, ?2, ?3) {SETTING_RETURNING}"),
        [Uuid::new_v4().to_string(), new_setting.key.to_string(), new_setting.value],
    );
}

pub fn update_setting(transaction: &Transaction, updated_setting: Setting) -> anyhow::Result<Option<Setting>> {
    verify(transaction, updated_setting.key.clone(), updated_setting.value.clone())?;
    return single(
        transaction,
        formatcp!("UPDATE setting SET key = ?1, value = ?2 WHERE id = ?3 {SETTING_RETURNING}"),
        [updated_setting.key.to_string(), updated_setting.value, updated_setting.id],
    );
}

pub fn delete_setting(transaction: &Transaction, id: String) -> anyhow::Result<Option<Setting>> {
    return single(
        transaction,
        formatcp!("DELETE FROM setting WHERE id = ?1 {SETTING_RETURNING}"),
        [id],
    );
}

pub fn get_setting(transaction: &Transaction, id: String) -> anyhow::Result<Option<Setting>> {
    return single(
        transaction,
        formatcp!("{SETTING_SELECT} WHERE id = ?1"),
        [id],
    );
}

pub fn list_settings(transaction: &Transaction) -> anyhow::Result<Vec<Setting>> {
    return list(
        transaction,
        formatcp!("{SETTING_SELECT} {SETTING_ORDERING}"),
        [],
    );
}

pub fn get_setting_by_key(transaction: &Transaction, setting_key: SettingKey) -> anyhow::Result<Option<Setting>> {
    return single(
        transaction,
        formatcp!("{SETTING_SELECT} WHERE key = ?1"),
        [setting_key.to_string()]
    )
}

pub fn cascade_delete_account(transaction: &Transaction, account_id: String) -> anyhow::Result<()> {
    let settings = list_settings(transaction)?;
    for setting in settings {
        if setting.value.contains(account_id.as_str()) {
            match setting.key {
                SettingKey::DefaultTransactionFromAccountId => {
                    info!("Deleting setting [{}] [{}] because account [{}] was deleted", setting.id, setting.key, account_id);
                    delete_setting(transaction, setting.id)
                        .map(|_| ())?
                }
                SettingKey::TransferWithoutBalanceIgnoredAccounts => {
                    let filter: Vec<&str> = setting.value.split(",")
                        .filter(|part| part == &account_id.as_str())
                        .collect();
                    if filter.len() == 0 {
                        info!("Deleting setting [{}] [{}] because account [{}] was deleted", setting.id, setting.key, account_id);
                        delete_setting(transaction, setting.id)
                            .map(|_| ())?
                    } else {
                        info!("Updating setting [{}] [{}] because account [{}] was deleted", setting.id, setting.key, account_id);
                        update_setting(transaction, Setting {
                            id: setting.id,
                            key: setting.key,
                            value:  filter.join(",")
                        }).map(|_| ())?
                    }
                }
            }
        }
    }
    Ok(())
}

fn verify_new(transaction: &Transaction, setting_key: SettingKey) -> anyhow::Result<()> {
    let exists = list_settings(transaction)?.iter().any(|setting| setting.key == setting_key);
    return if exists {
        Err(anyhow!("Setting key {} already exists", setting_key))
    } else {
        Ok(())
    }
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