use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ProductModel {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub stock: i32,
}