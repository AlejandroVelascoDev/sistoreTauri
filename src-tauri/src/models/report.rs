use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct ReportModel {
    pub id: i64,
    pub name: String,
    pub category: Option<String>,
    pub created_at: String,
    pub description: Option<String>
}

#[derive(Deserialize, Debug)]
pub struct CreateReportRequest {
    pub name: String,
    pub category: Option<String>,
    pub description: Option<String>
}

#[derive(Deserialize, Debug)]
pub struct UpdateReportRequest {
    pub id: i64,
    pub name: String,
    pub category: Option<String>,
    pub description: Option<String>
}
