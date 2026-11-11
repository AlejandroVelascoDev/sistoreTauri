use crate::db::open_database;
use crate::models::auth::{AuthUser, LoginRequest, RegisterRequest};
use argon2::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use argon2::Argon2;
use rand_core::OsRng;
use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use tauri::{command, AppHandle};

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
        params![username, display_name, password_hash, Utc::now().to_rfc3339()],
    )
    .map_err(|e| e.to_string())?;

    Ok(AuthUser {
        id: conn.last_insert_rowid(),
        username,
        display_name,
    })
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

    Ok(AuthUser {
        id,
        username,
        display_name,
    })
}
