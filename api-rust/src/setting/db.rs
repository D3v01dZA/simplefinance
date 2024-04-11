use actix_web::Error;
use const_format::formatcp;
use uuid::Uuid;
use crate::db::{list, Pool, single};
use crate::setting::schema::{NewSetting, Setting};

const SETTING_COLUMNS: &str = "id, key, value";
const SETTING_SELECT: &str = formatcp!("SELECT {} FROM setting", SETTING_COLUMNS);
const SETTING_RETURNING: &str = formatcp!("RETURNING {}", SETTING_COLUMNS);

pub async fn create_setting(pool: &Pool, new_setting: NewSetting) -> Result<Option<Setting>, Error> {
    return single(
        pool,
        formatcp!("INSERT INTO setting VALUES (?1, ?2, ?3) {}", SETTING_RETURNING),
        [Uuid::new_v4().to_string(), new_setting.key.to_string(), new_setting.value]
    )
        .await;
}

pub async fn update_setting(pool: &Pool, updated_setting: Setting) -> Result<Option<Setting>, Error> {
    return single(
        pool,
        formatcp!("UPDATE setting SET key = ?1, value = ?2 WHERE id = ?3 {}", SETTING_RETURNING),
        [updated_setting.key.to_string(), updated_setting.value, updated_setting.id]
    )
        .await;
}

pub async fn delete_setting(pool: &Pool, id: String) -> Result<Option<Setting>, Error> {
    return single(
        pool,
        formatcp!("DELETE FROM setting WHERE id = ?1 {}", SETTING_RETURNING),
        [id]
    )
        .await;
}

pub async fn get_setting(pool: &Pool, id: String) -> Result<Option<Setting>, Error> {
    return single(
        pool,
        formatcp!("{} WHERE id = ?1", SETTING_SELECT),
        [id]
    )
        .await;
}

pub async fn list_settings(pool: &Pool) -> Result<Vec<Setting>, Error> {
    return list(
        pool,
        SETTING_SELECT,
        []
    )
        .await;
}