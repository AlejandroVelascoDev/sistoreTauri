mod db;
use db::open_database;

use rusqlite::{params, OptionalExtension};
use serde::{Serialize, Deserialize};
use tauri::{command, AppHandle, Manager};
use chrono::Utc;

/// ---- Models ----
#[derive(Serialize, Deserialize, Debug)]
pub struct ProductModel {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub stock: i64,
    pub category: Option<String>,
    pub created_at: String,
}

#[derive(Deserialize, Debug)]
pub struct CreateProductRequest {
    pub name: String,
    pub price: f64,
    pub stock: i64,
    pub category: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct UpdateProductRequest {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub stock: i64,
    pub category: Option<String>,
}

#[derive(Deserialize)]
pub struct SaleItemModel {
    pub product_id: i64,
    pub quantity: i64,
    pub unit_price: f64,
}

#[derive(Deserialize)]
pub struct CreateSaleRequest {
    pub items: Vec<SaleItemModel>,
    pub subtotal: f64,
    pub tax: f64,
    pub total: f64,
}

#[derive(Serialize)]
pub struct SaleSummary {
    pub id: i64,
    pub occurred_at: String,
    pub subtotal: f64,
    pub tax: f64,
    pub total: f64,
}


#[command]
fn product_service_get_all(app: AppHandle) -> Result<Vec<ProductModel>, String> {
   let mut conn = open_database(&app);

    let mut stmt = conn
        .prepare("SELECT id, name, price, stock, category, created_at FROM products ORDER BY id DESC")
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
fn product_service_get_one(app: AppHandle, id: i64) -> Result<Option<ProductModel>, String> {
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
fn product_service_create(app: AppHandle, req: CreateProductRequest) -> Result<i64, String> {
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
fn product_service_update(app: AppHandle, req: UpdateProductRequest) -> Result<(), String> {
    let mut conn = open_database(&app);

    conn.execute(
        "UPDATE products SET name = ?1, price = ?2, stock = ?3, category = ?4 WHERE id = ?5",
        params![req.name, req.price, req.stock, req.category, req.id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
fn product_service_delete(app: AppHandle, id: i64) -> Result<(), String> {
    let mut conn = open_database(&app);

    conn.execute("DELETE FROM products WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}


#[command]
fn sale_service_create(app: AppHandle, req: CreateSaleRequest) -> Result<i64, String> {
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
fn sale_service_get_all(app: AppHandle) -> Result<Vec<SaleSummary>, String> {
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



fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            product_service_get_all,
            product_service_get_one,
            product_service_create,
            product_service_update,
            product_service_delete,
            sale_service_create,
            sale_service_get_all
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
