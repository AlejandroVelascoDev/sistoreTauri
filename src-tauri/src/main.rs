mod db;
mod services;
mod models;
use db::open_database;
use services::{product_service, sale_service, report_service};


fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
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
