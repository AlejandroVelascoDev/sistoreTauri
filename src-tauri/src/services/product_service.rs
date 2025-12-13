use crate::db::open_database;
use crate::models::product::{CreateProductRequest, ProductModel, UpdateProductRequest};
use chrono::Utc;
use rusqlite::params;
use tauri::{command, AppHandle};

#[command]
pub fn product_service_get_all(app: AppHandle) -> Result<Vec<ProductModel>, String> {
    let mut conn = open_database(&app);

    let mut stmt = conn
        .prepare(
            "SELECT id, name, price, stock, category, created_at FROM products ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ProductModel {
                id: row.get(0)?,
                name: row.get(1)?,
                price: row.get(2)?,
                stock: row.get(3)?,
                category: row.get(4).ok(),
                created_at: row.get(5)?,
            })
        })
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
        .prepare("SELECT id, name, price, stock, category, created_at FROM products WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map(params![id], |row| {
            Ok(ProductModel {
                id: row.get(0)?,
                name: row.get(1)?,
                price: row.get(2)?,
                stock: row.get(3)?,
                category: row.get(4).ok(),
                created_at: row.get(5)?,
            })
        })
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

    conn.execute(
        "INSERT INTO products (name, price, stock, category, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![req.name, req.price, req.stock, req.category, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

#[command]
pub fn product_service_update(
    app: AppHandle,
    req: UpdateProductRequest,
) -> Result<(), String> {
    let mut conn = open_database(&app);

    conn.execute(
        "UPDATE products SET name = ?1, price = ?2, stock = ?3, category = ?4 WHERE id = ?5",
        params![req.name, req.price, req.stock, req.category, req.id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn product_service_delete(app: AppHandle, id: i64) -> Result<(), String> {
    let mut conn = open_database(&app);

    conn.execute("DELETE FROM products WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
