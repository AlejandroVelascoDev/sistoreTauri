use crate::db::open_database;
use crate::models::product::{CreateProductRequest, ProductModel, UpdateProductRequest};
use chrono::Utc;
use rusqlite::{params, Error as SqlError, Row};
use tauri::{command, AppHandle};

const PRODUCT_COLUMNS: &str = "id, name, price, stock, category, created_at, barcode, cost";

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
    crate::services::auth_service::require_session(&app)?;
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
    crate::services::auth_service::require_session(&app)?;
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
pub fn product_service_create(app: AppHandle, req: CreateProductRequest) -> Result<i64, String> {
    crate::services::auth_service::require_session(&app)?;
    let mut conn = open_database(&app);

    validate_cost(req.cost)?;
    let now = Utc::now().to_rfc3339();
    let barcode = clean_barcode(req.barcode);

    conn.execute(
        "INSERT INTO products (name, price, stock, category, created_at, barcode, cost)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            req.name,
            req.price,
            req.stock,
            req.category,
            now,
            barcode,
            req.cost
        ],
    )
    .map_err(map_write_error)?;

    Ok(conn.last_insert_rowid())
}

#[command]
pub fn product_service_update(app: AppHandle, req: UpdateProductRequest) -> Result<(), String> {
    crate::services::auth_service::require_session(&app)?;
    let mut conn = open_database(&app);

    if let Some(cost) = req.cost {
        validate_cost(cost)?;
    }
    let barcode = clean_barcode(req.barcode);

    conn.execute(
        "UPDATE products SET name = ?1, price = ?2, stock = ?3, category = ?4, barcode = ?5, cost = COALESCE(?6, cost)
         WHERE id = ?7",
        params![req.name, req.price, req.stock, req.category, barcode, req.cost, req.id],
    )
    .map_err(map_write_error)?;

    Ok(())
}

#[command]
pub fn product_service_delete(app: AppHandle, id: i64) -> Result<(), String> {
    crate::services::auth_service::require_session(&app)?;
    let mut conn = open_database(&app);

    conn.execute("DELETE FROM products WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn validate_cost(cost: f64) -> Result<(), String> {
    if !cost.is_finite() || cost < 0.0 {
        return Err("El costo no es válido".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cost_is_finite_nonnegative_and_optional_on_update() {
        for cost in [-1.0, f64::NAN, f64::INFINITY] {
            assert!(validate_cost(cost).is_err());
        }
        assert!(validate_cost(0.0).is_ok());
        let req: UpdateProductRequest =
            serde_json::from_str(r#"{"id":1,"name":"Test","price":10,"stock":2}"#).unwrap();
        assert!(req.cost.is_none());
    }
}
