use crate::db::open_database;
use crate::models::sale::{CreateSaleRequest, SaleSummary};
use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use tauri::{command, AppHandle};

#[command]
pub fn sale_service_create(app: AppHandle, req: CreateSaleRequest) -> Result<i64, String> {
    let mut conn = open_database(&app);
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    for item in req.items.iter() {
        let stock_opt = tx
            .prepare("SELECT stock FROM products WHERE id = ?1")
            .map_err(|e| e.to_string())?
            .query_row(params![item.product_id], |r| r.get::<_, i64>(0))
            .optional()
            .map_err(|e| e.to_string())?;

        match stock_opt {
            Some(stock) => {
                if stock < item.quantity {
                    return Err(format!(
                        "Insufficient stock: product {}, available {}, requested {}",
                        item.product_id, stock, item.quantity
                    ));
                }
            }
            None => return Err(format!("Product {} not found", item.product_id)),
        }
    }

    let occurred_at = Utc::now().to_rfc3339();

    tx.execute(
        "INSERT INTO sales (occurred_at, subtotal, tax, total)
         VALUES (?1, ?2, ?3, ?4)",
        params![occurred_at, req.subtotal, req.tax, req.total],
    )
    .map_err(|e| e.to_string())?;

    let sale_id = tx.last_insert_rowid();

    for item in req.items {
        tx.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
             VALUES (?1, ?2, ?3, ?4)",
            params![sale_id, item.product_id, item.quantity, item.unit_price],
        )
        .map_err(|e| e.to_string())?;

        tx.execute(
            "UPDATE products SET stock = stock - ?1 WHERE id = ?2",
            params![item.quantity, item.product_id],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(sale_id)
}

#[command]
pub fn sale_service_get_all(app: AppHandle) -> Result<Vec<SaleSummary>, String> {
    let mut conn = open_database(&app);

    let mut stmt = conn
        .prepare("SELECT id, occurred_at, subtotal, tax, total FROM sales ORDER BY id DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(SaleSummary {
                id: row.get(0)?,
                occurred_at: row.get(1)?,
                subtotal: row.get(2)?,
                tax: row.get(3)?,
                total: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut res = vec![];
    for r in rows {
        res.push(r.map_err(|e| e.to_string())?);
    }

    Ok(res)
}
