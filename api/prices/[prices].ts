/* eslint-disable import/no-anonymous-default-export */
import {
  lightFormat,
  parse,
  getUnixTime,
  isSameDay,
  addDays,
  subDays,
  isBefore,
  differenceInMinutes,
  differenceInDays,
  addHours,
} from "date-fns";
import { NowRequest, NowResponse } from "@vercel/node";
import get from "axios";

const AMBITO_API = "https://mercados.ambito.com";
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
  if (queryError(f, t, pair, res, now)) res.end();
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
        res.status(404).json({ error: "Invalid pair" });
    }
  })(pair)
    .then((prices) => {
      if (prices !== undefined) {
        if (prices.length === 0)
          res.status(404).json({
            error: "Prices not found",
          });
        else res.json(prices);
      }
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
}

function queryError(
  from: number,
  to: number,
  pair: Pair,
  res: NowResponse,
  now: number
) {
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
  if (isBefore(now, from) || isBefore(now, to)) {
    res.status(404).json({
      error: "There is no data about the future",
    });
    return true;
  }
  return false;
}

async function getUsdArs(from: number = Date.now(), to: number = Date.now()) {
  const now = Date.now();
  if (isSameDay(from, now) && isSameDay(to, now))
    return await get(BLUELYTICS_API).then((res: any) => {
      let price: Price = {
        date: now,
        value: parseFloat(res.data.blue.value_sell),
      };
      return [price];
    });
  else {
    let url = `${AMBITO_API}/dolar/informal/historico-general/${lightFormat(
      from,
      "dd-MM-yyyy"
    )}/${lightFormat(addDays(to, 1), "dd-MM-yyyy")}`;
    return await get(url)
      .then((res) => res.data)
      .then(async (res: any) => {
        res.shift(); // first item is a table header
        if (res.length === 0) return retry(from, to);
        let prices: Price[] = res
          .map((item: string[]) => {
            let price: Price = {
              date: addHours(
                parse(item[0], "dd-MM-yyyy", new Date()),
                3
              ).getTime(),
              value: parseFloat(item[2].replace(/,/g, ".")),
            };
            return price;
          })
          .reverse();
        if (!isSameDay(prices[0].date, from)) return retry(from, to);
        // looping for misinformation
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
          } // same here
          else if (!isSameDay(prices[last].date, to)) {
            let filledPrice: Price = {
              date: addDays(prices[last].date, 1).getTime(),
              value: actual.value,
            };
            prices.splice(index + 1, 0, filledPrice);
          }
          if (prices[index].value === 0) {
            prices[index].value = prices[index - 1].value;
          }
        }
        // replace last filled price with today's one
        if (isSameDay(to, now)) {
          const today = await get(BLUELYTICS_API).then((res: any) => {
            let price: Price = {
              date: now,
              value: parseFloat(res.data.blue.value_sell),
            };
            return price;
          });
          prices[prices.length - 1] = today;
        }
        return prices;
      });
  }
}

async function retry(from: number, to: number) {
  let r: Price[] = await getUsdArs(subDays(from, 1).getTime(), to);
  r.shift();
  return r;
}

async function getBtcUsd(from: number = Date.now(), to: number = Date.now()) {
  const now = Date.now();
  const today = await get(
    `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
  ).then((res: any) => {
    let t: Price = {
      date: to,
      value: parseFloat(res.data.bitcoin.usd),
    };
    return t;
  });
  if (from === to || Math.abs(differenceInMinutes(from, now)) < 5) {
    return [today];
  } else {
    let url = `${COINGECKO_API}/coins/bitcoin/market_chart/range?vs_currency=usd&from=${getUnixTime(
      from
    )}&to=${getUnixTime(to)}`;
    return await get(url)
      .then((res: any) => res.data.prices)
      .then((res: number[][]) => {
        let prices = res.map((item: number[]) => {
          let price: Price = {
            date: item[0],
            value: item[1],
          };
          return price;
        });
        if (isSameDay(to, now) && Math.abs(differenceInDays(from, to)) > 90) {
          prices.push(today);
        }
        return prices;
      });
  }
}

async function getBtcArs(from: number = Date.now(), to: number = Date.now()) {
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

async function getSatUsd(from: number = Date.now(), to: number = Date.now()) {
  return satoshi(await getBtcUsd(from, to));
}

async function getSatArs(from: number = Date.now(), to: number = Date.now()) {
  return satoshi(await getBtcArs(from, to));
}

async function getArsUsd(from: number = Date.now(), to: number = Date.now()) {
  return inverse(await getUsdArs(from, to));
}

async function getUsdBtc(from: number = Date.now(), to: number = Date.now()) {
  return inverse(await getBtcUsd(from, to));
}

async function getArsBtc(from: number = Date.now(), to: number = Date.now()) {
  return inverse(await getBtcArs(from, to));
}

async function getUsdSat(from: number = Date.now(), to: number = Date.now()) {
  return inverse(await getSatUsd(from, to));
}

async function getArsSat(from: number = Date.now(), to: number = Date.now()) {
  return inverse(await getSatArs(from, to));
}
