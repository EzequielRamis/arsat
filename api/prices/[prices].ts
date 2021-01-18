/* eslint-disable import/no-anonymous-default-export */
import {
  lightFormat,
  parse,
  getUnixTime,
  isSameDay,
  addDays,
  subDays,
  isBefore,
  differenceInDays,
} from "date-fns";
import { NowRequest, NowResponse } from "@vercel/node";
import get from "axios";

const AMBITO_API =
  "https://mercados.ambito.com/dolar/informal/historico-general";
const BLUELYTICS_API = "https://api.bluelytics.com.ar/v2/latest";
const COINGECKO_API = "https://api.coingecko.com/api/v3";
const ARS_MIN_DATE = parse("2002-01-11", "yyyy-MM-dd", new Date());
const BTC_MIN_DATE = parse("2013-04-30", "yyyy-MM-dd", new Date());

interface Price {
  date: number;
  value: number;
}

enum Pair {
  USDARS,
  USDBTC,
  USDSAT,
  ARSUSD,
  ARSBTC,
  ARSSAT,
  BTCUSD,
  BTCARS,
  SATUSD,
  SATARS,
}

export default async function (req: NowRequest, res: NowResponse) {
  const now = Date.now();
  const pairValue = req.query.prices.toString().toUpperCase();
  const pair = Pair[pairValue as keyof typeof Pair];
  let { from, to } = req.query;
  const f = from ? parseInt(from.toString()) : now;
  const t = to ? parseInt(to.toString()) : now;
  if (queryError(f, t, pair, res)) res.end();
  (async (p) => {
    switch (p) {
      case Pair.USDARS:
        return await getUsdArs(f, t);
      case Pair.USDBTC:
        return await getUsdBtc(f, t);
      case Pair.USDSAT:
        return await getUsdSat(f, t);
      case Pair.ARSUSD:
        return await getArsUsd(f, t);
      case Pair.ARSBTC:
        return await getArsBtc(f, t);
      case Pair.ARSSAT:
        return await getArsSat(f, t);
      case Pair.BTCUSD:
        return await getBtcUsd(f, t);
      case Pair.BTCARS:
        return await getBtcArs(f, t);
      case Pair.SATUSD:
        return await getSatUsd(f, t);
      case Pair.SATARS:
        return await getSatArs(f, t);
      default:
        return Promise.reject("Invalid pair");
    }
  })(pair)
    .then((prices) => {
      if (prices.length === 0)
        res.status(404).json({
          error: "Prices not found",
        });
      else res.json(prices);
    })
    .catch((error) => {
      res.status(error.response.status).json(error.toJSON());
    });
}

function queryError(from: number, to: number, pair: Pair, res: NowResponse) {
  if (pair === Pair.USDARS || pair === Pair.ARSUSD) {
    if (isBefore(from, ARS_MIN_DATE)) {
      res.status(404).json({
        error:
          "There is no data about Peso before " +
          lightFormat(ARS_MIN_DATE, "yyyy-MM-dd"),
      });
      return true;
    }
  } else if (isBefore(from, BTC_MIN_DATE)) {
    res.status(404).json({
      error:
        "There is no data about Bitcoin before " +
        lightFormat(BTC_MIN_DATE, "yyyy-MM-dd"),
    });
    return true;
  }
  if (isBefore(to, from)) {
    res.status(404).json({
      error: "Invalid date arguments",
    });
    return true;
  }
  return false;
}

async function getUsdArs(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  const now = Date.now();
  let today = await get(BLUELYTICS_API)
    .then((res: any) => {
      let price: Price = {
        date: now,
        value: parseFloat(res.data.blue.value_sell),
      };
      return price;
    })
    .catch((err) => Promise.reject(err));
  if (differenceInDays(to, now) > 0) to = now;
  if (isSameDay(from, now) && isSameDay(to, now)) return [today];
  else {
    let url = `${AMBITO_API}/${lightFormat(from, "dd-MM-yyyy")}/${lightFormat(
      addDays(to, 1),
      "dd-MM-yyyy"
    )}`;
    return await get(url)
      .then((res) => res.data)
      .then((res: any) => {
        res.shift();
        if (res.length === 0) return retry(from, to);
        let prices = res
          .map((item: string[]) => {
            let price: Price = {
              date: parse(item[0], "dd-MM-yyyy", new Date()).getTime(),
              value: parseFloat(item[2].replace(/,/g, ".")),
            };
            return price;
          })
          .reverse();
        if (!isSameDay(prices[0].date, from)) return retry(from, to);
        for (let index = 0; index < prices.length; index++) {
          const actual = prices[index];
          const last = prices.length - 1;
          if (index !== last) {
            let tomorrow = addDays(actual.date, 1).getTime();
            let next = prices[index + 1].date;
            // there are duplicated dates
            if (isSameDay(actual.date, next)) {
              prices.splice(index + 1, 1);
              index--;
              continue;
            }
            // fill dates without info with last price
            if (!isSameDay(tomorrow, next)) {
              let filledPrice: Price = {
                date: tomorrow,
                value: actual.value,
              };
              prices.splice(index + 1, 0, filledPrice);
            }
          } else if (!isSameDay(prices[last].date, to)) {
            let filledPrice: Price = {
              date: addDays(prices[last].date, 1).getTime(),
              value: actual.value,
            };
            prices.splice(index + 1, 0, filledPrice);
          }
        }
        if (isSameDay(to, now)) prices[prices.length - 1] = today;
        return prices;
      })
      .catch((err) => Promise.reject(err));
  }
}

async function retry(from: number, to: number) {
  let r = await getUsdArs(subDays(from, 1).getTime(), to);
  r.shift();
  return r;
}

async function getBtcUsd(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  const now = Date.now();
  if (isSameDay(from, now) && isSameDay(to, now)) {
    return await get(
      `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
    )
      .then((res: any) => {
        let today: Price = {
          date: now,
          value: parseFloat(res.data.bitcoin.usd),
        };
        return [today];
      })
      .catch((err) => Promise.reject(err));
  } else if (isSameDay(from, to)) {
    return await get(
      `${COINGECKO_API}/coins/bitcoin/history?date=${lightFormat(
        from,
        "dd-MM-yyyy"
      )}&localization=false`
    )
      .then((res: any) => {
        let price: Price = {
          date: from,
          value: res.data.market_data.current_price.usd,
        };
        return [price];
      })
      .catch((err) => Promise.reject(err));
  } else {
    let url = `${COINGECKO_API}/coins/bitcoin/market_chart/range?vs_currency=usd&from=${getUnixTime(
      from
    )}&to=${getUnixTime(to)}`;
    return await get(url)
      .then((res: any) => res.data.prices)
      .then((res: number[][]) => {
        if (res.length === 0) {
          throw new Error("Invalid date arguments");
        }
        let prices = res.map((item: number[]) => {
          let price: Price = {
            date: item[0],
            value: item[1],
          };
          return price;
        });
        return prices;
      })
      .catch((err) => Promise.reject(err));
  }
}

async function getBtcArs(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  const usdars = await getUsdArs(from, to);
  const btcusd = await getBtcUsd(from, to);
  let btcars: Price[] = [];
  let i = 0;
  for (const p of btcusd) {
    while (!isSameDay(usdars[i].date, p.date)) i++;
    let price: Price = {
      date: p.date,
      value: usdars[i].value * p.value,
    };
    btcars.push(price);
  }
  return btcars;
}

function mapValue(p: Price[], m: Function) {
  p.forEach((price) => {
    price.value = m(price.value);
  });
  return p;
}

function inverse(p: Price[]) {
  return mapValue(p, (v: number) => 1 / v);
}

function satoshi(p: Price[]) {
  return mapValue(p, (v: number) => v / Math.pow(10, 8));
}

async function getSatUsd(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  return satoshi(await getBtcUsd(from, to));
}

async function getSatArs(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  return satoshi(await getBtcArs(from, to));
}

async function getArsUsd(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  return inverse(await getUsdArs(from, to));
}

async function getUsdBtc(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  return inverse(await getBtcUsd(from, to));
}

async function getArsBtc(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  return inverse(await getBtcArs(from, to));
}

async function getUsdSat(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  return inverse(await getSatUsd(from, to));
}

async function getArsSat(
  from: number = Date.now(),
  to: number = Date.now()
): Promise<Price[]> {
  return inverse(await getSatArs(from, to));
}
