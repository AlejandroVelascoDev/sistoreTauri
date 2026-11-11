use crate::db::open_database;
use crate::models::cash::{
    CashMovementModel, CashSession, CloseCashRequest, CreateMovementRequest, CutSummary,
    DenominationCount, OpenCashRequest,
};
use chrono::Utc;
use rusqlite::{params, Connection, OptionalExtension};
use tauri::{command, AppHandle};

const INFLOW_KINDS: [&str; 1] = ["ingreso"];
const OUTFLOW_KINDS: [&str; 2] = ["retiro", "devolucion"];

fn read_session(conn: &Connection, session_id: i64) -> Result<Option<CashSession>, String> {
    conn.query_row(
        "SELECT id, opened_at, opening_fund, closed_at, counted_cash, expected_cash, difference, notes, kept_fund
         FROM cash_sessions WHERE id = ?1",
        params![session_id],
        |row| {
            Ok(CashSession {
                id: row.get(0)?,
                opened_at: row.get(1)?,
                opening_fund: row.get(2)?,
                closed_at: row.get(3)?,
                counted_cash: row.get(4)?,
                expected_cash: row.get(5)?,
                difference: row.get(6)?,
                notes: row.get(7)?,
                kept_fund: row.get(8)?,
            })
        },
    )
    .optional()
    .map_err(|e| e.to_string())
}

fn open_session_id(conn: &Connection) -> Result<Option<i64>, String> {
    conn.query_row(
        "SELECT id FROM cash_sessions WHERE closed_at IS NULL ORDER BY id DESC LIMIT 1",
        [],
        |row| row.get(0),
    )
    .optional()
    .map_err(|e| e.to_string())
}

fn build_summary(
    conn: &Connection,
    session: CashSession,
    denominations: Vec<DenominationCount>,
) -> Result<CutSummary, String> {
    let (sales_count, cash_sales, card_sales, transfer_sales) = {
        let mut stmt = conn
            .prepare(
                "SELECT payment_method, COUNT(*), COALESCE(SUM(total), 0)
                 FROM sales WHERE session_id = ?1 GROUP BY payment_method",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![session.id], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, f64>(2)?,
                ))
            })
            .map_err(|e| e.to_string())?;

        let (mut count, mut cash, mut card, mut transfer) = (0i64, 0f64, 0f64, 0f64);
        for row in rows {
            let (method, n, total) = row.map_err(|e| e.to_string())?;
            count += n;
            match method.as_str() {
                "efectivo" => cash += total,
                "tarjeta" => card += total,
                "transferencia" => transfer += total,
                _ => {}
            }
        }
        (count, cash, card, transfer)
    };

    let movements = {
        let mut stmt = conn
            .prepare(
                "SELECT id, session_id, kind, amount, concept, reference, created_at
                 FROM cash_movements WHERE session_id = ?1 ORDER BY id",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![session.id], |row| {
                Ok(CashMovementModel {
                    id: row.get(0)?,
                    session_id: row.get(1)?,
                    kind: row.get(2)?,
                    amount: row.get(3)?,
                    concept: row.get(4)?,
                    reference: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;
        let mut list = vec![];
        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
        list
    };

    let sum_kind = |kind: &str| -> f64 {
        movements
            .iter()
            .filter(|m| m.kind == kind)
            .map(|m| m.amount)
            .sum()
    };
    let cash_in = sum_kind("ingreso");
    let withdrawals = sum_kind("retiro");
    let refunds = sum_kind("devolucion");

    let expected_cash = session.opening_fund + cash_sales + cash_in - withdrawals - refunds;

    Ok(CutSummary {
        session,
        sales_count,
        cash_sales,
        card_sales,
        transfer_sales,
        total_sales: cash_sales + card_sales + transfer_sales,
        cash_in,
        withdrawals,
        refunds,
        expected_cash,
        movements,
        denominations,
    })
}

fn summary_for(conn: &Connection, session_id: i64) -> Result<CutSummary, String> {
    let session = read_session(conn, session_id)?
        .ok_or_else(|| "La sesión de caja no existe".to_string())?;

    let denominations = load_denominations(conn, session_id)?;

    build_summary(conn, session, denominations)
}

fn load_denominations(conn: &Connection, session_id: i64) -> Result<Vec<DenominationCount>, String> {
    let raw: Option<String> = conn
        .query_row(
            "SELECT denominations FROM cash_sessions WHERE id = ?1",
            params![session_id],
            |row| row.get(0),
        )
        .map_err(|e| e.to_string())?;

    match raw {
        Some(json) => serde_json::from_str(&json).map_err(|e| e.to_string()),
        None => Ok(vec![]),
    }
}

#[command]
pub fn cash_get_current(app: AppHandle) -> Result<Option<CutSummary>, String> {
    let conn = open_database(&app);

    match open_session_id(&conn)? {
        Some(id) => Ok(Some(summary_for(&conn, id)?)),
        None => Ok(None),
    }
}

#[command]
pub fn cash_open(app: AppHandle, req: OpenCashRequest) -> Result<i64, String> {
    let conn = open_database(&app);

    if open_session_id(&conn)?.is_some() {
        return Err("La caja ya está abierta".to_string());
    }
    if req.opening_fund < 0.0 {
        return Err("El fondo inicial no puede ser negativo".to_string());
    }

    conn.execute(
        "INSERT INTO cash_sessions (opened_at, opening_fund) VALUES (?1, ?2)",
        params![Utc::now().to_rfc3339(), req.opening_fund],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

#[command]
pub fn cash_movement_create(app: AppHandle, req: CreateMovementRequest) -> Result<i64, String> {
    let conn = open_database(&app);

    let session_id = open_session_id(&conn)?
        .ok_or_else(|| "Abre la caja antes de registrar movimientos".to_string())?;

    let kind = req.kind.as_str();
    if !INFLOW_KINDS.contains(&kind) && !OUTFLOW_KINDS.contains(&kind) {
        return Err("Tipo de movimiento no válido".to_string());
    }
    if req.amount <= 0.0 {
        return Err("El monto debe ser mayor a cero".to_string());
    }
    if req.concept.trim().is_empty() {
        return Err("El concepto es obligatorio".to_string());
    }

    if OUTFLOW_KINDS.contains(&kind) {
        let summary = summary_for(&conn, session_id)?;
        if req.amount > summary.expected_cash + 0.005 {
            return Err(format!(
                "No hay suficiente efectivo en caja. Disponible: {:.2}",
                summary.expected_cash
            ));
        }
    }

    let reference = req
        .reference
        .map(|r| r.trim().to_string())
        .filter(|r| !r.is_empty());

    conn.execute(
        "INSERT INTO cash_movements (session_id, kind, amount, concept, reference, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            session_id,
            kind,
            req.amount,
            req.concept.trim(),
            reference,
            Utc::now().to_rfc3339()
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(conn.last_insert_rowid())
}

#[command]
pub fn cash_close(app: AppHandle, req: CloseCashRequest) -> Result<CutSummary, String> {
    let conn = open_database(&app);

    let open_id = open_session_id(&conn)?.ok_or_else(|| "No hay una caja abierta".to_string())?;
    if open_id != req.session_id {
        return Err("La sesión indicada no es la caja abierta".to_string());
    }

    let summary = summary_for(&conn, open_id)?;

    let counted: f64 = req
        .denominations
        .iter()
        .map(|d| d.value * d.count as f64)
        .sum();
    let difference = counted - summary.expected_cash;

    let notes = req
        .notes
        .map(|n| n.trim().to_string())
        .filter(|n| !n.is_empty());

    if difference.abs() >= 0.005 && notes.is_none() {
        return Err("Explica la diferencia en las notas antes de cerrar el corte".to_string());
    }

    let kept_fund = req.kept_fund.unwrap_or(summary.session.opening_fund);
    if kept_fund < 0.0 {
        return Err("El fondo que queda en caja no puede ser negativo".to_string());
    }
    if kept_fund > counted + 0.005 {
        return Err("El fondo que queda en caja no puede ser mayor al efectivo contado".to_string());
    }

    let denominations_json = serde_json::to_string(&req.denominations).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE cash_sessions
         SET closed_at = ?1, counted_cash = ?2, expected_cash = ?3, difference = ?4,
             denominations = ?5, notes = ?6, kept_fund = ?7
         WHERE id = ?8",
        params![
            Utc::now().to_rfc3339(),
            counted,
            summary.expected_cash,
            difference,
            denominations_json,
            notes,
            kept_fund,
            open_id
        ],
    )
    .map_err(|e| e.to_string())?;

    summary_for(&conn, open_id)
}

#[command]
pub fn cash_suggested_fund(app: AppHandle) -> Result<Option<f64>, String> {
    let conn = open_database(&app);

    conn.query_row(
        "SELECT kept_fund FROM cash_sessions WHERE closed_at IS NOT NULL ORDER BY id DESC LIMIT 1",
        [],
        |row| row.get::<_, Option<f64>>(0),
    )
    .optional()
    .map(|value| value.flatten())
    .map_err(|e| e.to_string())
}

#[command]
pub fn cash_history(app: AppHandle) -> Result<Vec<CutSummary>, String> {
    let conn = open_database(&app);

    let ids = {
        let mut stmt = conn
            .prepare("SELECT id FROM cash_sessions WHERE closed_at IS NOT NULL ORDER BY id DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| row.get::<_, i64>(0))
            .map_err(|e| e.to_string())?;
        let mut list = vec![];
        for row in rows {
            list.push(row.map_err(|e| e.to_string())?);
        }
        list
    };

    ids.into_iter().map(|id| summary_for(&conn, id)).collect()
}
