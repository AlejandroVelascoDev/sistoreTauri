use crate::db::open_database;
use crate::models::sale::{CreateSaleRequest, SaleSummary};
use chrono::Utc;
use rusqlite::{params, OptionalExtension};
use tauri::{command, AppHandle};

const PAYMENT_METHODS: [&str; 3] = ["efectivo", "tarjeta", "transferencia"];

#[command]
pub fn sale_service_create(app: AppHandle, req: CreateSaleRequest) -> Result<i64, String> {
    crate::services::auth_service::require_session(&app)?;
    let mut conn = open_database(&app);

    create_sale(&mut conn, req)
}

fn create_sale(conn: &mut rusqlite::Connection, req: CreateSaleRequest) -> Result<i64, String> {
    validate_payload(&req)?;
    let tx = conn
        .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)
        .map_err(|e| e.to_string())?;
    let session_id: i64 = tx
        .query_row(
            "SELECT id FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Abre la caja antes de registrar ventas".to_string())?;

    let mut subtotal = 0.0;
    let mut quantities = std::collections::HashMap::<i64, i64>::new();
    for item in &req.items {
        let (price, stock): (f64, i64) = tx
            .query_row(
                "SELECT price, stock FROM products WHERE id = ?1",
                params![item.product_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|e| e.to_string())?;
        if !price.is_finite() || price < 0.0 || (item.unit_price - price).abs() > 0.005 {
            return Err("El precio del producto ha cambiado".into());
        }
        let quantity = quantities.entry(item.product_id).or_default();
        *quantity = quantity
            .checked_add(item.quantity)
            .ok_or("Cantidad no válida")?;
        if *quantity > stock {
            return Err("Stock insuficiente".into());
        }
        subtotal += price * item.quantity as f64;
    }
    // Preserve the POS's existing 19% tax contract.
    let tax = subtotal * 0.19;
    let total = subtotal + tax;
    if !total.is_finite()
        || (req.subtotal - subtotal).abs() > 0.005
        || (req.tax - tax).abs() > 0.005
        || (req.total - total).abs() > 0.005
    {
        return Err("El total no coincide con los precios actuales".into());
    }
    let (received, change_given) = if req.payment_method == "efectivo" {
        let received = req.received.unwrap_or(total);
        if received + 0.005 < total {
            return Err("El efectivo recibido no alcanza".into());
        }
        (Some(received), Some((received - total).max(0.0)))
    } else {
        (None, None)
    };

    let occurred_at = Utc::now().to_rfc3339();

    tx.execute(
        "INSERT INTO sales (occurred_at, subtotal, tax, total, session_id, payment_method, received, change_given)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            occurred_at,
            subtotal,
            tax,
            total,
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
            params![
                sale_id,
                item.product_id,
                item.quantity,
                item.unit_price,
                unit_cost
            ],
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
    crate::services::auth_service::require_session(&app)?;
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

fn validate_payload(req: &CreateSaleRequest) -> Result<(), String> {
    if !PAYMENT_METHODS.contains(&req.payment_method.as_str()) {
        return Err("Método de pago no válido".into());
    }
    if req.items.is_empty()
        || [req.subtotal, req.tax, req.total]
            .iter()
            .any(|n| !n.is_finite() || *n < 0.0)
        || req.received.is_some_and(|n| !n.is_finite() || n < 0.0)
        || req
            .items
            .iter()
            .any(|i| i.quantity <= 0 || !i.unit_price.is_finite() || i.unit_price < 0.0)
    {
        return Err("Los importes y cantidades de la venta no son válidos".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn request() -> CreateSaleRequest {
        serde_json::from_value(serde_json::json!({
            "items": [{"product_id":1,"quantity":1,"unit_price":10.0}],
            "subtotal":10.0,"tax":1.9,"total":11.9,"payment_method":"efectivo","received":20.0
        }))
        .unwrap()
    }
    fn database() -> rusqlite::Connection {
        let conn = rusqlite::Connection::open_in_memory().unwrap();
        conn.execute_batch("
            CREATE TABLE products(id INTEGER, price REAL, stock INTEGER, cost REAL);
            INSERT INTO products VALUES(1,10,2,4);
            CREATE TABLE cash_sessions(id INTEGER, closed_at TEXT);
            INSERT INTO cash_sessions VALUES(1,NULL);
            CREATE TABLE sales(id INTEGER PRIMARY KEY,occurred_at TEXT,subtotal REAL,tax REAL,total REAL,session_id INTEGER,payment_method TEXT,received REAL,change_given REAL);
            CREATE TABLE sale_items(sale_id INTEGER,product_id INTEGER,quantity INTEGER,unit_price REAL,unit_cost REAL);
        ").unwrap();
        conn
    }
    #[test]
    fn rejects_invalid_payloads() {
        for quantity in [0, -1] {
            let mut req = request();
            req.items[0].quantity = quantity;
            assert!(validate_payload(&req).is_err());
        }
        for value in [f64::NAN, f64::INFINITY, f64::NEG_INFINITY] {
            let mut req = request();
            req.total = value;
            assert!(validate_payload(&req).is_err());
            let mut req = request();
            req.items[0].unit_price = value;
            assert!(validate_payload(&req).is_err());
            let mut req = request();
            req.received = Some(value);
            assert!(validate_payload(&req).is_err());
        }
    }
    #[test]
    fn validates_prices_totals_and_stock_without_writes() {
        let mut conn = database();
        let mut req = request();
        req.items[0].unit_price = 1.0;
        assert!(create_sale(&mut conn, req).is_err());
        let mut req = request();
        req.total = 1.0;
        assert!(create_sale(&mut conn, req).is_err());
        let mut req = request();
        req.received = Some(1.0);
        assert!(create_sale(&mut conn, req).is_err());
        let mut req = request();
        req.items.push(crate::models::sale::SaleItemModel {
            product_id: 1,
            quantity: 2,
            unit_price: 10.0,
        });
        assert!(create_sale(&mut conn, req).is_err());
        assert_eq!(
            conn.query_row("SELECT COUNT(*) FROM sales", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            0
        );
        assert_eq!(
            conn.query_row("SELECT stock FROM products", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
    }
    #[test]
    fn persists_authoritative_sale_and_cost() {
        let mut conn = database();
        create_sale(&mut conn, request()).unwrap();
        let (total, change): (f64, f64) = conn
            .query_row("SELECT total,change_given FROM sales", [], |r| {
                Ok((r.get(0)?, r.get(1)?))
            })
            .unwrap();
        assert!((total - 11.9).abs() < 0.00001);
        assert!((change - 8.1).abs() < 0.00001);
        assert_eq!(
            conn.query_row("SELECT unit_cost FROM sale_items", [], |r| r
                .get::<_, f64>(0))
                .unwrap(),
            4.0
        );
    }
}
