use async_recursion::async_recursion;
use chrono::{Date, DateTime, Duration, NaiveDate, NaiveDateTime, Utc};
use http::{Response, StatusCode};
use now_lambda::{error::NowError, lambda, IntoResponse, Request};
use std::str::FromStr;
use std::vec;
use utils::*;

type Prices = Vec<Price>;
type Error = Box<dyn std::error::Error>;

fn main() -> Result<(), Error> {
    Ok(lambda!(handler))
}

#[tokio::main]
async fn handler(request: Request) -> Result<impl IntoResponse, NowError> {
    let now = Utc::now();
    let url = {
        let uri = request.uri().to_string();
        let url = reqwest::Url::parse(&uri);
        if url.is_err() {
            let err = HttpError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Internal server error",
                "The URL could not be parsed",
            );
            return Ok(err.res());
        }
        url.unwrap()
    };
    let pair: Pair = {
        let path = url.path_segments().unwrap().last().unwrap().to_uppercase();
        if path.len() != 6 {
            let err = HttpError::new(
                StatusCode::NOT_FOUND,
                "Invalid pair argument",
                "A pair must be six chars long",
            );
            return Ok(err.res());
        }
        let (base, quote) = {
            let res = path.split_at(3);
            let b = Coin::from_str(res.0);
            let q = Coin::from_str(res.1);
            if b.is_err() || q.is_err() {
                let detail = &format!("There is no data about {}/{}", res.0, res.1);
                let err = HttpError::new(StatusCode::NOT_FOUND, "Invalid pair argument", detail);
                return Ok(err.res());
            } else {
                (b.unwrap(), q.unwrap())
            }
        };
        (base, quote)
    };
    let mut query = url.query_pairs();

    let mut get_param = |param: &str| -> Result<DateTime<Utc>, Response<String>> {
        let err = {
            let detail = &format!("The '{}' date could not be parsed", param);
            let err = HttpError::new(
                StatusCode::BAD_REQUEST,
                "Invalid time range argument",
                detail,
            );
            err.res()
        };
        let res = query.find(|q| q.0 == param);
        if res.is_none() {
            Ok(now)
        } else {
            let t = res.unwrap().1.to_string();
            if t.len() == 0 {
                return Err(err);
            }
            let (secs, nsecs) = t.split_at(t.len() - 3);
            let secs = secs.parse::<i64>();
            let nsecs = nsecs.parse::<u32>();
            if secs.is_err() || nsecs.is_err() {
                return Err(err);
            }
            Ok(DateTime::<Utc>::from_utc(
                NaiveDateTime::from_timestamp(secs.unwrap(), nsecs.unwrap()),
                Utc,
            ))
        }
    };

    let from = match get_param("from") {
        Ok(param) => param,
        Err(err) => {
            return Ok(err);
        }
    };
    let to = match get_param("to") {
        Ok(param) => param,
        Err(err) => {
            return Ok(err);
        }
    };

    match pair {
        (Coin::USD, Coin::ARS) | (Coin::ARS, Coin::USD) => {
            if from.timestamp() < ARS_MIN_DATE {
                let err = HttpError::new(
                    StatusCode::NOT_FOUND,
                    "Invalid time range argument",
                    "There is no data about Argentine Peso before Januanry 11th 2002",
                );
                return Ok(err.res());
            }
        }
        _ => {
            if from.timestamp() < BTC_MIN_DATE {
                let err = HttpError::new(
                    StatusCode::NOT_FOUND,
                    "Invalid time range argument",
                    "There is no data about Bitcoin before April 30th 2013",
                );
                return Ok(err.res());
            }
        }
    }
    if to < from {
        let err = HttpError::new(
            StatusCode::BAD_REQUEST,
            "Invalid time range argument",
            "The 'from' data must be before 'to' date",
        );
        return Ok(err.res());
    }
    if now < from || now < to {
        let err = HttpError::new(
            StatusCode::BAD_REQUEST,
            "Invalid time range argument",
            "There is no data about the future",
        );
        return Ok(err.res());
    }
    let prices = match pair {
        (Coin::ARS, Coin::USD) => get_ars_usd(from, to).await,
        (Coin::ARS, Coin::BTC) => get_ars_btc(from, to).await,
        (Coin::ARS, Coin::SAT) => get_ars_sat(from, to).await,
        (Coin::USD, Coin::ARS) => get_usd_ars(from, to).await,
        (Coin::USD, Coin::BTC) => get_usd_btc(from, to).await,
        (Coin::USD, Coin::SAT) => get_usd_sat(from, to).await,
        (Coin::BTC, Coin::ARS) => get_btc_ars(from, to).await,
        (Coin::BTC, Coin::USD) => get_btc_usd(from, to).await,
        (Coin::SAT, Coin::ARS) => get_sat_ars(from, to).await,
        (Coin::SAT, Coin::USD) => get_sat_usd(from, to).await,
        _ => {
            let detail = &format!(
                "There is no data about {}/{}",
                pair.0.to_string(),
                pair.1.to_string()
            );
            let err = HttpError::new(StatusCode::NOT_FOUND, "Invalid pair argument", detail);
            return Ok(err.res());
        }
    };
    let response = match prices {
        Ok(p) => {
            let json = {
                let s = p
                    .iter()
                    .map(|i| PriceJson {
                        date: i.date.timestamp_millis(),
                        value: i.value,
                    })
                    .collect::<Vec<PriceJson>>();
                serde_json::to_string(&s).unwrap()
            };
            now_res(StatusCode::OK, json)
        }
        Err(err) => {
            let detail = &err.to_string();
            let err = HttpError::new(StatusCode::BAD_GATEWAY, "Bad Gateway", detail);
            err.res()
        }
    };

    Ok(response)
}

async fn get_usd_ars(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let now = Utc::now();
    let today = {
        let res = fetch(BLUELYTICS_API).await?;
        Price {
            date: now,
            value: res["blue"]["value_sell"]
                .as_f64()
                .ok_or(Error::from("Bluelytics parsing error"))?,
        }
    };
    if is_same_day(from, now) && is_same_day(to, now) {
        return Ok(vec![today]);
    } else {
        let url = format!(
            "{}/dolar/informal/historico-general/{}/{}",
            AMBITO_API,
            from.format("%d-%m-%Y"),
            to.format("%d-%m-%Y"),
        );
        let mut res = fetch(&url).await?;
        let res = res
            .as_array_mut()
            .ok_or(Error::from("Ámbito array parsing error"))?;
        res.remove(0);
        if res.len() == 0 {
            return retry(from, to).await;
        }
        res.reverse();

        let first_date = {
            let date = Date::<Utc>::from_utc(
                NaiveDate::parse_from_str(
                    res[0][0]
                        .as_str()
                        .ok_or(Error::from("Ámbito date parsing error"))?,
                    "%d-%m-%Y",
                )?,
                Utc,
            )
            .and_hms(0, 0, 0);
            let date = date + Duration::hours(3);
            date
        };
        if !is_same_day(first_date, from) {
            return retry(from, to).await;
        };
        let mut prices = res
            .iter()
            .map(|item| {
                let date = Date::<Utc>::from_utc(
                    NaiveDate::parse_from_str(
                        item[0]
                            .as_str()
                            .ok_or(Error::from("Ámbito date parsing error"))?,
                        "%d-%m-%Y",
                    )?,
                    Utc,
                )
                .and_hms(0, 0, 0);
                let date = date + Duration::hours(3); // from UTC−03:00 to UTC
                let value: f64 = item[2]
                    .as_str()
                    .ok_or(Error::from("Ámbito price parsing error"))?
                    .replace(",", ".")
                    .parse()?;
                Ok(Price { date, value })
            })
            .collect::<Result<Prices, Error>>()?;

        let mut index: usize = 0;
        // looping for misinformation
        while index < prices.len() {
            let actual = &prices[index];
            let last = prices.len() - 1;
            if index != last {
                let tomorrow = add_days(actual.date, 1);
                let next = prices[index + 1].date;
                // there are duplicated dates
                if is_same_day(actual.date, next) {
                    prices.remove(index + 1);
                    index -= 1;
                    continue;
                }
                // fill dates without info with last price
                if !is_same_day(tomorrow, next) {
                    let filled_price = Price {
                        date: tomorrow,
                        value: actual.value,
                    };
                    prices.insert(index + 1, filled_price);
                }
            }
            // same here
            else if !is_same_day(prices[last].date, to) {
                let filled_price = Price {
                    date: add_days(prices[last].date, 1),
                    value: actual.value,
                };
                prices.insert(index + 1, filled_price);
            }

            index += 1;
        }
        // replace last filled price with today's one
        if is_same_day(to, now) {
            prices.pop();
            prices.push(today);
        }
        return Ok(prices);
    }
}

#[async_recursion]
async fn retry(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    return match get_usd_ars(sub_days(from, 1), to).await {
        Ok(mut r) => {
            r.remove(0);
            Ok(r)
        }
        Err(err) => Err(err),
    };
}

async fn get_btc_usd(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let now = Utc::now();
    let today = {
        let res = fetch(&format!(
            "{}/simple/price?ids=bitcoin&vs_currencies=usd",
            COINGECKO_API
        ))
        .await?;
        Price {
            date: to,
            value: res["bitcoin"]["usd"]
                .as_f64()
                .ok_or(Error::from("Coingecko price parsing error"))?,
        }
    };
    if difference_in_minutes(from, to).abs() < 5 && difference_in_minutes(from, now).abs() < 5 {
        return Ok(vec![today]);
    } else {
        let mut prices = {
            let url = format!(
                "{}/coins/bitcoin/market_chart/range?vs_currency=usd&from={}&to={}",
                COINGECKO_API,
                from.timestamp(),
                to.timestamp()
            );
            let res = fetch(&url).await?;
            let res = res["prices"]
                .as_array()
                .ok_or(Error::from("Coingecko array parsing error"))?;
            res.iter()
                .map(|item| {
                    let item = item
                        .as_array()
                        .ok_or(Error::from("Coingecko item parsing error"))?;
                    let secs = item[0]
                        .as_i64()
                        .ok_or(Error::from("Coingecko time parsing error"))?
                        / 1000;
                    let date = DateTime::from_utc(NaiveDateTime::from_timestamp(secs, 0), Utc);
                    let value = item[1]
                        .as_f64()
                        .ok_or(Error::from("Coingecko price parsing error"))?;
                    Ok(Price { date, value })
                })
                .collect::<Result<Prices, Error>>()?
        };
        if is_same_day(to, now) && difference_in_days(from, to).abs() > 90 {
            prices.push(today);
        }
        Ok(prices)
    }
}

async fn get_btc_ars(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let usd_ars = get_usd_ars(from, to).await?;
    let btc_usd = get_btc_usd(from, to).await?;
    let mut i: usize = 0;
    let btc_ars = btc_usd
        .iter()
        .map(|p| {
            while !is_same_day(usd_ars[i].date, p.date) && i < usd_ars.len() - 1 {
                i += 1;
            }
            let date = p.date;
            let value = usd_ars[i].value * p.value;
            Price { date, value }
        })
        .collect::<Prices>();
    Ok(btc_ars)
}

fn map_value(p: Prices, m: &dyn Fn(f64) -> f64) -> Prices {
    p.iter()
        .map(|i| Price {
            date: i.date,
            value: m(i.value),
        })
        .collect::<Prices>()
}

fn inverse(p: Prices) -> Prices {
    map_value(p, &|v: f64| v.recip())
}

fn satoshi(p: Prices) -> Prices {
    map_value(p, &|v: f64| v / 10_f64.powi(8))
}

async fn get_sat_usd(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let res = get_btc_usd(from, to).await?;
    Ok(satoshi(res))
}

async fn get_sat_ars(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let res = get_btc_ars(from, to).await?;
    Ok(satoshi(res))
}

async fn get_ars_usd(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let res = get_usd_ars(from, to).await?;
    Ok(inverse(res))
}

async fn get_usd_btc(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let res = get_btc_usd(from, to).await?;
    Ok(inverse(res))
}

async fn get_ars_btc(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let res = get_btc_ars(from, to).await?;
    Ok(inverse(res))
}

async fn get_usd_sat(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let res = get_sat_usd(from, to).await?;
    Ok(inverse(res))
}

async fn get_ars_sat(from: DateTime<Utc>, to: DateTime<Utc>) -> Result<Prices, Error> {
    let res = get_sat_ars(from, to).await?;
    Ok(inverse(res))
}
