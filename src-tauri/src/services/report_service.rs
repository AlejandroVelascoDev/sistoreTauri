use crate::db::open_database;
use crate::models::report::{CreateReportRequest, ReportModel, UpdateReportRequest};
use chrono::Utc;
use rusqlite::params;
use tauri::{command, AppHandle};

#[command]
pub fn report_service_get_all(app: AppHandle) -> Result<Vec<ReportModel>, String> {
    let mut conn = open_database(&app);

    let mut stmt = conn
        .prepare(
            "SELECT id, name, category, created_at, description FROM report ORDER BY id DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(ReportModel {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                created_at: row.get(3)?,
                description: row.get(4)?,
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
pub fn report_service_get_one(app: AppHandle, id: i64) -> Result<Option<ReportModel>, String> {
    let mut conn = open_database(&app);

    let mut stmt = conn
        .prepare("SELECT id, name, category, created_at, description FROM report WHERE id = ?1")
        .map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map(params![id], |row| {
            Ok(ReportModel {
                id: row.get(0)?,
                name: row.get(1)?,
                category: row.get(2)?,
                created_at: row.get(3)?,
                description: row.get(4)?,
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
pub fn report_service_create(
    app: AppHandle,
    req: CreateReportRequest,
) -> Result<i64, String> {
    let mut conn = open_database(&app);

    let now = Utc::now().to_rfc3339();

    conn.execute(
    "INSERT INTO report (name, category, created_at, description)
     VALUES (?1, ?2, ?3, ?4)",
    params![req.name, req.category, now, req.description],
    )
    .map_err(|e| e.to_string())?;  

    Ok(conn.last_insert_rowid())
}

#[command]
pub fn report_service_update(
    app: AppHandle,
    req: UpdateReportRequest,
) -> Result<(), String> {
    let mut conn = open_database(&app);

    conn.execute(
        "UPDATE report SET name = ?1, category = ?2, description = ?3  WHERE id = ?4",
        params![req.name, req.category, req.description, req.id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn report_service_delete(app: AppHandle, id: i64) -> Result<(), String> {
    let mut conn = open_database(&app);

    conn.execute("DELETE FROM report WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}
