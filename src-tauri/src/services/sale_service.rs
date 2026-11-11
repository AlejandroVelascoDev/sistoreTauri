use crate::db::open_database;
use crate::models::sale::{CreateSaleRequest, SaleSummary};
use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use tauri::{command, AppHandle};

const PAYMENT_METHODS: [&str; 3] = ["efectivo", "tarjeta", "transferencia"];

#[command]
pub fn sale_service_create(app: AppHandle, req: CreateSaleRequest) -> Result<i64, String> {
    let mut conn = open_database(&app);

    let session_id: i64 = conn
        .query_row(
            "SELECT id FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Abre la caja antes de registrar ventas".to_string())?;

    if !PAYMENT_METHODS.contains(&req.payment_method.as_str()) {
        return Err("Método de pago no válido".to_string());
    }

    let (received, change_given) = if req.payment_method == "efectivo" {
        let received = req.received.unwrap_or(req.total);
        if received + 0.005 < req.total {
            return Err(format!(
                "El efectivo recibido ({:.2}) no alcanza para el total ({:.2})",
                received, req.total
            ));
        }
        (Some(received), Some((received - req.total).max(0.0)))
    } else {
        (None, None)
    };

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
        "INSERT INTO sales (occurred_at, subtotal, tax, total, session_id, payment_method, received, change_given)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            occurred_at,
            req.subtotal,
            req.tax,
            req.total,
            session_id,
            req.payment_method,
            received,
            change_given
        ],
    )
    .map_err(|e| e.to_string())?;

    let sale_id = tx.last_insert_rowid();

    for item in req.items {
        let unit_cost: f64 = tx
            .query_row(
                "SELECT cost FROM products WHERE id = ?1",
                params![item.product_id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;

        tx.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_cost)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![sale_id, item.product_id, item.quantity, item.unit_price, unit_cost],
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
