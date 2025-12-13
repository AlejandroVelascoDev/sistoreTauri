use serde::{Serialize, Deserialize};

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
