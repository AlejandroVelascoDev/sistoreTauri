use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AuthUser {
    pub id: i64,
    pub username: String,
    pub display_name: String,
}

#[derive(Deserialize, Debug)]
pub struct RegisterRequest {
    pub username: String,
    pub display_name: String,
    pub password: String,
}

#[derive(Deserialize, Debug)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}
