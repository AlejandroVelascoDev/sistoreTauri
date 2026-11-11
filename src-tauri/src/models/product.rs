use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ProductModel {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub stock: i64,
    pub category: Option<String>,
    pub created_at: String,
    pub barcode: Option<String>,
    pub cost: f64,
}

#[derive(Deserialize, Debug)]
pub struct CreateProductRequest {
    pub name: String,
    pub price: f64,
    pub stock: i64,
    pub category: Option<String>,
    pub barcode: Option<String>,
    #[serde(default)]
    pub cost: f64,
}

#[derive(Deserialize, Debug)]
pub struct UpdateProductRequest {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub stock: i64,
    pub category: Option<String>,
    pub barcode: Option<String>,
    #[serde(default)]
    pub cost: f64,
}
