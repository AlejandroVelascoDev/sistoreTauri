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
    migrate(&conn).expect("Failed migrating tables");

    conn
}

fn add_column_if_missing(conn: &Connection, table: &str, column: &str, definition: &str) -> Result<()> {
    let exists = conn
        .prepare(&format!("PRAGMA table_info({})", table))?
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<String>>>()?
        .iter()
        .any(|name| name == column);

    if !exists {
        conn.execute_batch(&format!(
            "ALTER TABLE {} ADD COLUMN {} {};",
            table, column, definition
        ))?;
    }

    Ok(())
}

fn migrate(conn: &Connection) -> Result<()> {
    add_column_if_missing(conn, "sales", "session_id", "INTEGER")?;
    add_column_if_missing(conn, "sales", "payment_method", "TEXT NOT NULL DEFAULT 'efectivo'")?;
    add_column_if_missing(conn, "sales", "received", "REAL")?;
    add_column_if_missing(conn, "sales", "change_given", "REAL")?;
    add_column_if_missing(conn, "products", "barcode", "TEXT")?;
    conn.execute_batch(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode
         ON products(barcode) WHERE barcode IS NOT NULL;",
    )?;
    Ok(())
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

        CREATE TABLE IF NOT EXISTS cash_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opened_at TEXT NOT NULL,
            opening_fund REAL NOT NULL,
            closed_at TEXT,
            counted_cash REAL,
            expected_cash REAL,
            difference REAL,
            denominations TEXT,
            notes TEXT
        );

        CREATE TABLE IF NOT EXISTS cash_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            kind TEXT NOT NULL,
            amount REAL NOT NULL,
            concept TEXT NOT NULL,
            reference TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(session_id) REFERENCES cash_sessions(id)
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        "
    )?;

    Ok(())
}
