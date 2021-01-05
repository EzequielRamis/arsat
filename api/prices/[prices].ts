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
const MIN_DATE = parse("2013-04-30", "yyyy-MM-dd", new Date());
const now = Date.now();

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
  const pairValue = req.query.prices.toString().toUpperCase();
  const pair = Pair[pairValue as keyof typeof Pair];
  let { from, to } = req.query;
  const f = from ? parseInt(from.toString()) : now;
  const t = to ? parseInt(to.toString()) : now;
  if (queryError(f, t, res)) res.end();
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
      res.status(404).json({
        error,
      });
    });
}

function queryError(from: number, to: number, res: NowResponse) {
  if (from.toString().length < 13 || to.toString().length < 13) {
    res.status(404).json({
      error:
        "Invalid date format. More info: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime",
    });
    return true;
  }
  if (isBefore(from, MIN_DATE)) {
    res.status(404).json({
      error:
        "Invalid 'from' date argument. It must be after " +
        lightFormat(MIN_DATE, "yyyy-MM-dd"),
    });
    return true;
  }
  if (isBefore(to, from)) {
    res.status(404).json({
      error: "Invalid date arguments",
    });
    return true;
  }
}

async function getUsdArs(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  let today = await get(BLUELYTICS_API).then((res: any) => {
    let price: Price = {
      date: now,
      value: parseFloat(res.data.blue.value_sell),
    };
    return price;
  });
  if (differenceInDays(to, now) > 0) to = now;
  if (isSameDay(from, now) && isSameDay(to, now)) return [today];
  else {
    const retry = async () => {
      let r = await getUsdArs(subDays(from, 1).getTime(), to);
      r.shift();
      return r;
    };
    let url = `${AMBITO_API}/${lightFormat(from, "dd-MM-yyyy")}/${lightFormat(
      addDays(to, 1),
      "dd-MM-yyyy"
    )}`;
    return await get(url)
      .then((res) => res.data)
      .then((res: any) => {
        res.shift();
        if (res.length === 0) return retry();
        let prices = res
          .map((item: string[]) => {
            let price: Price = {
              date: parse(item[0], "dd-MM-yyyy", new Date()).getTime(),
              value: parseFloat(item[2].replace(/,/g, ".")),
            };
            return price;
          })
          .reverse();
        if (!isSameDay(prices[0].date, from)) return retry();
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
      });
  }
}

async function getBtcUsd(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  if (isSameDay(from, now) && isSameDay(to, now)) {
    return await get(
      `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
    ).then((res: any) => {
      let today: Price = {
        date: now,
        value: parseFloat(res.data.bitcoin.usd),
      };
      return [today];
    });
  } else if (isSameDay(from, to)) {
    return await get(
      `${COINGECKO_API}/coins/bitcoin/history?date=${lightFormat(
        from,
        "dd-MM-yyyy"
      )}&localization=false`
    ).then((res: any) => {
      let price: Price = {
        date: from,
        value: res.data.market_data.current_price.usd,
      };
      return [price];
    });
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
      });
  }
}

async function getBtcArs(
  from: number = now,
  to: number = now
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

async function getSatUsd(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  const res = await getBtcUsd(from, to);
  res.forEach((price) => {
    price.value = price.value / Math.pow(10, 8);
  });
  return res;
}

async function getSatArs(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  const res = await getBtcArs(from, to);
  res.forEach((price) => {
    price.value = price.value / Math.pow(10, 8);
  });
  return res;
}

async function getArsUsd(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  const res = await getUsdArs(from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

async function getUsdBtc(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  const res = await getBtcUsd(from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

async function getArsBtc(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  const res = await getBtcArs(from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

async function getUsdSat(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  const res = await getSatUsd(from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

async function getArsSat(
  from: number = now,
  to: number = now
): Promise<Price[]> {
  const res = await getSatArs(from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}
