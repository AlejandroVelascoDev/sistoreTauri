use rusqlite::{Connection, Result};
use tauri::{AppHandle, Manager};
use tauri::path::BaseDirectory;
use std::path::PathBuf;

pub fn open_database(app: &AppHandle) -> Connection {
    let dir = app
        .path()
        .resolve("database", BaseDirectory::AppData)
        .expect("Failed to resolve app data dir");

    std::fs::create_dir_all(&dir).expect("Failed to create DB folder");

    let db_path = dir.join("systore.db");

    let conn = Connection::open(db_path).expect("Failed to open database");

    init_tables(&conn).expect("Failed creating tables");

    conn
}

fn init_tables(conn: &Connection) -> Result<()> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            stock INTEGER NOT NULL,
            category TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            occurred_at TEXT NOT NULL,
            subtotal REAL NOT NULL,
            tax REAL NOT NULL,
            total REAL NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL,
            unit_price REAL NOT NULL,
            FOREIGN KEY(sale_id) REFERENCES sales(id),
            FOREIGN KEY(product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS report (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            created_at TEXT NOT NULL,
            description TEXT
        );
        "
    )?;

    Ok(())
}
