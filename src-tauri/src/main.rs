mod db;
mod services;
mod models;
use db::open_database;
use services::{auth_service, cash_service, product_service, sale_service, report_service, stats_service};


fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            auth_service::auth_has_users,
            auth_service::auth_register,
            auth_service::auth_login,
            cash_service::cash_get_current,
            cash_service::cash_open,
            cash_service::cash_movement_create,
            cash_service::cash_close,
            cash_service::cash_history,
            cash_service::cash_suggested_fund,
            stats_service::stats_daily,
            stats_service::stats_top_products,
            product_service::product_service_get_all,
            product_service::product_service_get_one,
            product_service::product_service_create,
            product_service::product_service_update,
            product_service::product_service_delete,
            sale_service::sale_service_create,
            sale_service::sale_service_get_all,
            report_service::report_service_get_all,
            report_service::report_service_get_one,
            report_service::report_service_create,
            report_service::report_service_update,
            report_service::report_service_delete
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
