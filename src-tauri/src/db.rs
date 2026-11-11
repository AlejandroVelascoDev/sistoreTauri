use rusqlite::{Connection, Result};
use std::path::PathBuf;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Manager};

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

fn add_column_if_missing(
    conn: &Connection,
    table: &str,
    column: &str,
    definition: &str,
) -> Result<bool> {
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

    Ok(!exists)
}

fn migrate(conn: &Connection) -> Result<()> {
    add_column_if_missing(conn, "sales", "session_id", "INTEGER")?;
    add_column_if_missing(
        conn,
        "sales",
        "payment_method",
        "TEXT NOT NULL DEFAULT 'efectivo'",
    )?;
    add_column_if_missing(conn, "sales", "received", "REAL")?;
    add_column_if_missing(conn, "sales", "change_given", "REAL")?;
    add_column_if_missing(conn, "products", "barcode", "TEXT")?;
    add_column_if_missing(conn, "products", "cost", "REAL NOT NULL DEFAULT 0")?;
    let tx = conn.unchecked_transaction()?;
    if add_column_if_missing(&tx, "sale_items", "unit_cost", "REAL NOT NULL DEFAULT 0")? {
        tx.execute_batch(
            "UPDATE sale_items SET unit_cost = COALESCE(
            (SELECT cost FROM products WHERE products.id = sale_items.product_id), 0)",
        )?;
    }
    tx.commit()?;
    add_column_if_missing(conn, "cash_sessions", "kept_fund", "REAL")?;
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
        ",
    )?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cost_backfill_runs_only_once() {
        let conn = Connection::open_in_memory().unwrap();
        init_tables(&conn).unwrap();
        add_column_if_missing(&conn, "products", "cost", "REAL NOT NULL DEFAULT 0").unwrap();
        conn.execute_batch("INSERT INTO products(id,name,price,stock,created_at,cost) VALUES(1,'Test',10,2,'2026-01-01',4);
            INSERT INTO sales(id,occurred_at,subtotal,tax,total) VALUES(1,'2026-01-01',10,1.9,11.9);
            INSERT INTO sale_items(sale_id,product_id,quantity,unit_price) VALUES(1,1,1,10);").unwrap();
        migrate(&conn).unwrap();
        conn.execute("UPDATE products SET cost = 9", []).unwrap();
        migrate(&conn).unwrap();
        assert_eq!(
            conn.query_row("SELECT unit_cost FROM sale_items", [], |r| r
                .get::<_, f64>(0))
                .unwrap(),
            4.0
        );
    }
}
