use serde::{Serialize, Deserialize};

#[derive(Serialize, Debug, Clone)]
pub struct CashSession {
    pub id: i64,
    pub opened_at: String,
    pub opening_fund: f64,
    pub closed_at: Option<String>,
    pub counted_cash: Option<f64>,
    pub expected_cash: Option<f64>,
    pub difference: Option<f64>,
    pub notes: Option<String>,
    pub kept_fund: Option<f64>,
}

#[derive(Serialize, Debug, Clone)]
pub struct CashMovementModel {
    pub id: i64,
    pub session_id: i64,
    pub kind: String,
    pub amount: f64,
    pub concept: String,
    pub reference: Option<String>,
    pub created_at: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DenominationCount {
    pub value: f64,
    pub count: i64,
}

#[derive(Serialize, Debug, Clone)]
pub struct CutSummary {
    pub session: CashSession,
    pub sales_count: i64,
    pub cash_sales: f64,
    pub card_sales: f64,
    pub transfer_sales: f64,
    pub total_sales: f64,
    pub cash_in: f64,
    pub withdrawals: f64,
    pub refunds: f64,
    pub expected_cash: f64,
    pub movements: Vec<CashMovementModel>,
    pub denominations: Vec<DenominationCount>,
}

#[derive(Deserialize, Debug)]
pub struct OpenCashRequest {
    pub opening_fund: f64,
}

#[derive(Deserialize, Debug)]
pub struct CreateMovementRequest {
    pub kind: String,
    pub amount: f64,
    pub concept: String,
    pub reference: Option<String>,
}

#[derive(Deserialize, Debug)]
pub struct CloseCashRequest {
    pub session_id: i64,
    pub denominations: Vec<DenominationCount>,
    pub notes: Option<String>,
    pub kept_fund: Option<f64>,
}
