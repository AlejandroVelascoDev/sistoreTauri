use crate::db::open_database;
use crate::models::auth::{AuthUser, LoginRequest, RegisterRequest};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use chrono::Utc;
use rand_core::OsRng;
use rusqlite::{params, OptionalExtension};
use tauri::{command, AppHandle};

use std::sync::Mutex;
use tauri::Manager;

#[derive(Default)]
pub struct NativeSession(Mutex<Option<AuthUser>>);

impl NativeSession {
    fn current(&self) -> Result<Option<AuthUser>, String> {
        Ok(self.0.lock().map_err(|e| e.to_string())?.clone())
    }
    fn set(&self, user: Option<AuthUser>) -> Result<(), String> {
        *self.0.lock().map_err(|e| e.to_string())? = user;
        Ok(())
    }
}

pub fn require_session(app: &AppHandle) -> Result<AuthUser, String> {
    app.state::<NativeSession>()
        .current()?
        .ok_or_else(|| "Inicia sesión para continuar".to_string())
}

#[command]
pub fn auth_session(app: AppHandle) -> Result<Option<AuthUser>, String> {
    app.state::<NativeSession>().current()
}

#[command]
pub fn auth_logout(app: AppHandle) -> Result<(), String> {
    app.state::<NativeSession>().set(None)
}

const MIN_PASSWORD_LENGTH: usize = 6;

fn invalid_credentials() -> String {
    "Usuario o contraseña incorrectos".to_string()
}

#[command]
pub fn auth_has_users(app: AppHandle) -> Result<bool, String> {
    let conn = open_database(&app);

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;

    Ok(count > 0)
}

#[command]
pub fn auth_register(app: AppHandle, req: RegisterRequest) -> Result<AuthUser, String> {
    let conn = open_database(&app);

    let username = req.username.trim().to_lowercase();
    if username.is_empty() {
        return Err("El usuario es obligatorio".to_string());
    }
    if req.password.chars().count() < MIN_PASSWORD_LENGTH {
        return Err(format!(
            "La contraseña debe tener al menos {} caracteres",
            MIN_PASSWORD_LENGTH
        ));
    }

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
        .map_err(|e| e.to_string())?;
    if count > 0 {
        return Err("Ya existe una cuenta. Inicia sesión para continuar".to_string());
    }

    let display_name = match req.display_name.trim() {
        "" => username.clone(),
        name => name.to_string(),
    };

    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(req.password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();

    conn.execute(
        "INSERT INTO users (username, display_name, password_hash, created_at)
         VALUES (?1, ?2, ?3, ?4)",
        params![
            username,
            display_name,
            password_hash,
            Utc::now().to_rfc3339()
        ],
    )
    .map_err(|e| e.to_string())?;

    let user = AuthUser {
        id: conn.last_insert_rowid(),
        username,
        display_name,
    };
    app.state::<NativeSession>().set(Some(user.clone()))?;
    Ok(user)
}

#[command]
pub fn auth_login(app: AppHandle, req: LoginRequest) -> Result<AuthUser, String> {
    let conn = open_database(&app);

    let username = req.username.trim().to_lowercase();

    let row = conn
        .query_row(
            "SELECT id, username, display_name, password_hash FROM users WHERE username = ?1",
            params![username],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                ))
            },
        )
        .optional()
        .map_err(|e| e.to_string())?;

    let (id, username, display_name, stored_hash) = row.ok_or_else(invalid_credentials)?;

    let parsed_hash = PasswordHash::new(&stored_hash).map_err(|e| e.to_string())?;
    Argon2::default()
        .verify_password(req.password.as_bytes(), &parsed_hash)
        .map_err(|_| invalid_credentials())?;

    let user = AuthUser {
        id,
        username,
        display_name,
    };
    app.state::<NativeSession>().set(Some(user.clone()))?;
    Ok(user)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn session_requires_native_login_and_can_be_revoked() {
        let session = NativeSession::default();
        assert!(session.current().unwrap().is_none());
        session
            .set(Some(AuthUser {
                id: 1,
                username: "test".into(),
                display_name: "Test".into(),
            }))
            .unwrap();
        assert_eq!(session.current().unwrap().unwrap().id, 1);
        session.set(None).unwrap();
        assert!(session.current().unwrap().is_none());
    }
}
