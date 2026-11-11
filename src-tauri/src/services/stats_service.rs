use crate::db::open_database;
use chrono::{Duration, NaiveDate};
use rusqlite::params;
use serde::Serialize;
use std::collections::HashMap;
use tauri::{command, AppHandle};

#[derive(Serialize, Debug)]
pub struct DayStat {
    pub day: String,
    pub sales: f64,
    pub profit: f64,
    pub count: i64,
}

#[derive(Serialize, Debug)]
pub struct ProductStat {
    pub name: String,
    pub quantity: i64,
    pub profit: f64,
}

fn parse_day(value: &str) -> Result<NaiveDate, String> {
    NaiveDate::parse_from_str(value, "%Y-%m-%d").map_err(|e| e.to_string())
}

#[command]
pub fn stats_daily(app: AppHandle, from: String, to: String) -> Result<Vec<DayStat>, String> {
    crate::services::auth_service::require_session(&app)?;
    let conn = open_database(&app);
    let start = parse_day(&from)?;
    let end = parse_day(&to)?;
    validate_range(start, end)?;

    let mut by_day: HashMap<String, (f64, i64)> = HashMap::new();
    {
        let mut stmt = conn
            .prepare(
                "SELECT date(occurred_at, 'localtime') AS day, COALESCE(SUM(total), 0), COUNT(*)
                 FROM sales
                 WHERE date(occurred_at, 'localtime') BETWEEN ?1 AND ?2
                 GROUP BY day",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![from, to], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, f64>(1)?,
                    row.get::<_, i64>(2)?,
                ))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (day, sales, count) = row.map_err(|e| e.to_string())?;
            by_day.insert(day, (sales, count));
        }
    }

    let mut profit_by_day: HashMap<String, f64> = HashMap::new();
    {
        let mut stmt = conn
            .prepare(
                "SELECT date(s.occurred_at, 'localtime') AS day,
                        COALESCE(SUM(si.quantity * (si.unit_price - si.unit_cost)), 0)
                 FROM sale_items si
                 JOIN sales s ON s.id = si.sale_id
                 WHERE date(s.occurred_at, 'localtime') BETWEEN ?1 AND ?2
                 GROUP BY day",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![from, to], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (day, profit) = row.map_err(|e| e.to_string())?;
            profit_by_day.insert(day, profit);
        }
    }

    let mut result = vec![];
    let mut current = start;
    while current <= end {
        let key = current.format("%Y-%m-%d").to_string();
        let (sales, count) = by_day.get(&key).copied().unwrap_or((0.0, 0));
        let profit = profit_by_day.get(&key).copied().unwrap_or(0.0);
        result.push(DayStat {
            day: key,
            sales,
            profit,
            count,
        });
        if current == end {
            break;
        }
        current += Duration::days(1);
    }

    Ok(result)
}

#[command]
pub fn stats_top_products(
    app: AppHandle,
    from: String,
    to: String,
    limit: i64,
) -> Result<Vec<ProductStat>, String> {
    crate::services::auth_service::require_session(&app)?;
    let conn = open_database(&app);

    let mut stmt = conn
        .prepare(
            "SELECT p.name, SUM(si.quantity), SUM(si.quantity * (si.unit_price - si.unit_cost))
             FROM sale_items si
             JOIN sales s ON s.id = si.sale_id
             JOIN products p ON p.id = si.product_id
             WHERE date(s.occurred_at, 'localtime') BETWEEN ?1 AND ?2
             GROUP BY si.product_id
             ORDER BY SUM(si.quantity) DESC
             LIMIT ?3",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![from, to, limit], |row| {
            Ok(ProductStat {
                name: row.get(0)?,
                quantity: row.get(1)?,
                profit: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = vec![];
    for row in rows {
        list.push(row.map_err(|e| e.to_string())?);
    }
    Ok(list)
}

fn validate_range(start: NaiveDate, end: NaiveDate) -> Result<(), String> {
    // Up to ten years of daily results, including leap days.
    if end < start || (end - start).num_days() >= 3660 {
        return Err("El rango debe contener entre 1 y 3660 días".into());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn range_bounds_are_inclusive() {
        let start = parse_day("2026-01-01").unwrap();
        assert!(validate_range(start, start).is_ok());
        assert!(validate_range(start, start + Duration::days(3659)).is_ok());
        assert!(validate_range(start, start + Duration::days(3660)).is_err());
        assert!(validate_range(start, start - Duration::days(1)).is_err());
    }
}
