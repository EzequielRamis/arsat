use chrono::{DateTime, Datelike, Duration, Utc};
use http::{Response, StatusCode};
use reqwest::get;
use serde::Serialize;
use serde_json::Value;
use std::error::Error;
use strum::{EnumProperty, EnumString, ToString};

pub const AMBITO_API: &str = "https://mercados.ambito.com";
pub const BLUELYTICS_API: &str = "https://api.bluelytics.com.ar/v2/latest";
pub const COINGECKO_API: &str = "https://api.coingecko.com/api/v3";

pub const ARS_MIN_DATE: i64 = 1010707200;
pub const BTC_MIN_DATE: i64 = 1367280000;

#[derive(Debug)]
pub struct Price {
    pub date: DateTime<Utc>,
    pub value: f64,
}

#[derive(Debug, Serialize)]
pub struct PriceJson {
    pub date: i64,
    pub value: f64,
}

#[derive(Debug, EnumString, ToString, EnumProperty)]
#[strum(serialize_all = "UPPERCASE")]
pub enum Coin {
    #[strum(props(name = "peso"))]
    ARS,
    #[strum(props(name = "dollar"))]
    USD,
    #[strum(props(name = "bitcoin"))]
    BTC,
    #[strum(props(name = "satoshi"))]
    SAT,
}

pub type Pair = (Coin, Coin);

#[derive(Debug, Serialize)]
pub struct HttpError<'http> {
    pub status: u16,
    pub title: &'http str,
    pub detail: &'http str,
}

impl<'http> HttpError<'http> {
    pub fn new(status: StatusCode, title: &'http str, detail: &'http str) -> Self {
        HttpError {
            status: status.as_u16(),
            title,
            detail,
        }
    }

    pub fn res(&self) -> Response<String> {
        now_res(
            StatusCode::from_u16(self.status).unwrap(),
            serde_json::to_string(&self).unwrap(),
        )
    }
}

pub async fn fetch(url: &str) -> Result<Value, Box<dyn Error>> {
    let json: Value = serde_json::from_str(&get(url).await?.text().await?)?;
    Ok(json)
}

pub fn is_same_day(left: DateTime<Utc>, right: DateTime<Utc>) -> bool {
    left.ordinal() == right.ordinal() && left.year() == right.year()
}

pub fn add_days(date: DateTime<Utc>, days: i64) -> DateTime<Utc> {
    date.checked_add_signed(Duration::days(days)).unwrap()
}

pub fn sub_days(date: DateTime<Utc>, days: i64) -> DateTime<Utc> {
    date.checked_sub_signed(Duration::days(days)).unwrap()
}

pub fn difference_in_days(left: DateTime<Utc>, right: DateTime<Utc>) -> i64 {
    left.signed_duration_since(right).num_days()
}

pub fn difference_in_minutes(left: DateTime<Utc>, right: DateTime<Utc>) -> i64 {
    left.signed_duration_since(right).num_minutes()
}

pub fn now_res(status: StatusCode, body: String) -> Response<String> {
    Response::builder()
        .status(status)
        .header("Content-Type", "application/json")
        .body(body)
        .unwrap()
}
