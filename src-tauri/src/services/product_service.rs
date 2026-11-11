use crate::db::open_database;
use crate::models::product::{CreateProductRequest, ProductModel, UpdateProductRequest};
use chrono::Utc;
use rusqlite::{params, Error as SqlError, Row};
use tauri::{command, AppHandle};

const PRODUCT_COLUMNS: &str =
    "id, name, price, stock, category, created_at, barcode, cost";

fn clean_barcode(barcode: Option<String>) -> Option<String> {
    barcode
        .map(|b| b.trim().to_string())
        .filter(|b| !b.is_empty())
}

fn map_write_error(e: SqlError) -> String {
    let message = e.to_string();
    if message.contains("UNIQUE") && message.contains("barcode") {
        "Ya existe un producto con ese código de barras".to_string()
    } else {
        message
    }
}

fn row_to_product(row: &Row) -> rusqlite::Result<ProductModel> {
    Ok(ProductModel {
        id: row.get(0)?,
        name: row.get(1)?,
        price: row.get(2)?,
        stock: row.get(3)?,
        category: row.get(4).ok(),
        created_at: row.get(5)?,
        barcode: row.get(6)?,
        cost: row.get(7)?,
    })
}

#[command]
pub fn product_service_get_all(app: AppHandle) -> Result<Vec<ProductModel>, String> {
    let mut conn = open_database(&app);

    let mut stmt = conn
        .prepare(&format!(
            "SELECT {} FROM products ORDER BY id DESC",
            PRODUCT_COLUMNS
        ))
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], row_to_product)
        .map_err(|e| e.to_string())?;

    let mut res = vec![];
    for r in rows {
        res.push(r.map_err(|e| e.to_string())?);
    }

    Ok(res)
}

#[command]
pub fn product_service_get_one(app: AppHandle, id: i64) -> Result<Option<ProductModel>, String> {
    let mut conn = open_database(&app);

    let mut stmt = conn
        .prepare(&format!(
            "SELECT {} FROM products WHERE id = ?1",
            PRODUCT_COLUMNS
        ))
        .map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map(params![id], row_to_product)
        .map_err(|e| e.to_string())?;

    if let Some(row) = rows.next() {
        Ok(Some(row.map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}

#[command]
pub fn product_service_create(
    app: AppHandle,
    req: CreateProductRequest,
) -> Result<i64, String> {
    let mut conn = open_database(&app);

    let now = Utc::now().to_rfc3339();
    let barcode = clean_barcode(req.barcode);

    conn.execute(
        "INSERT INTO products (name, price, stock, category, created_at, barcode, cost)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![req.name, req.price, req.stock, req.category, now, barcode, req.cost],
    )
    .map_err(map_write_error)?;

    Ok(conn.last_insert_rowid())
}

#[command]
pub fn product_service_update(
    app: AppHandle,
    req: UpdateProductRequest,
) -> Result<(), String> {
    let mut conn = open_database(&app);

    let barcode = clean_barcode(req.barcode);

    conn.execute(
        "UPDATE products SET name = ?1, price = ?2, stock = ?3, category = ?4, barcode = ?5, cost = ?6
         WHERE id = ?7",
        params![req.name, req.price, req.stock, req.category, barcode, req.cost, req.id],
    )
    .map_err(map_write_error)?;

    Ok(())
}

#[command]
pub fn product_service_delete(app: AppHandle, id: i64) -> Result<(), String> {
    let mut conn = open_database(&app);

    conn.execute("DELETE FROM products WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
