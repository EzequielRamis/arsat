import {
  lightFormat,
  parse,
  getUnixTime,
  isSameDay,
  addDays,
  subDays,
  isBefore,
} from "date-fns";

const AMBITO_API =
  "https://mercados.ambito.com/dolar/informal/historico-general";
const BLUELYTICS_API = "https://api.bluelytics.com.ar/v2/latest";
const COINGECKO_API = "https://api.coingecko.com/api/v3";
const MIN_DATE = parse("2013-04-30", "yyyy-MM-dd", new Date());
const now = Date.now();

export interface Price {
  date: number;
  value: number;
}

function basicVal(step: number, from: number, to: number) {
  if (step < 1) throw new Error("Invalid step argument");
  if (isBefore(from, MIN_DATE))
    throw new Error(
      "Invalid from date argument. It must be after " +
        lightFormat(MIN_DATE, "yyyy-MM-dd")
    );
  if (isBefore(to, from)) throw new Error("Invalid date arguments");
}

function skip(s: number, p: Price[]) {
  if (s === 1) return p;
  let f: Price[] = [];
  for (var i = p.length - 1; i >= 0; i -= s) {
    f.unshift(p[i]);
  }
  f = f.filter((e) => e !== undefined);
  return f;
}

export async function getUsdArs(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  let today = await fetch(BLUELYTICS_API)
    .then((res) => res.json())
    .then((res) => {
      let price: Price = {
        date: now,
        value: parseFloat(res.blue.value_sell),
      };
      return price;
    });
  if (isSameDay(from, now) && isSameDay(to, now)) return [today];
  else {
    const retry = async () => {
      let r = await getUsdArs(1, subDays(from, 1).getTime(), to);
      r.shift();
      return skip(step, r);
    };
    let url = `${AMBITO_API}/${lightFormat(from, "dd-MM-yyyy")}/${lightFormat(
      addDays(to, 1),
      "dd-MM-yyyy"
    )}`;
    return await fetch(url)
      .then((res) => res.json())
      .then(async (res) => {
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
        for (let index = 0; index < prices.length; index++) {
          const actual = prices[index];
          const last = prices.length - 1;
          if (index !== last) {
            let tomorrow = addDays(actual.date, 1).getTime();
            let next: Date = prices[index + 1].date;
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
          }
          if (index === last && !isSameDay(prices[last].date, to)) {
            let filledPrice: Price = {
              date: addDays(prices[last].date, 1).getTime(),
              value: actual.value,
            };
            prices.splice(index + 1, 0, filledPrice);
            continue;
          }
        }
        if (!isSameDay(prices[0].date, from)) return retry();
        if (isSameDay(to, now)) prices[prices.length - 1] = today;
        return skip(step, prices);
      });
  }
}

export async function getBtcUsd(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  if (isSameDay(from, now) && isSameDay(to, now)) {
    return await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
    )
      .then((res) => res.json())
      .then((res) => {
        let today: Price = {
          date: now,
          value: parseFloat(res.bitcoin.usd),
        };
        return [today];
      });
  } else if (isSameDay(from, to)) {
    return await fetch(
      `${COINGECKO_API}/coins/bitcoin/history?date=${lightFormat(
        from,
        "dd-MM-yyyy"
      )}&localization=false`
    )
      .then((res) => res.json())
      .then((res) => {
        let price: Price = {
          date: from,
          value: res.market_data.current_price.usd,
        };
        return [price];
      });
  } else {
    let url = `${COINGECKO_API}/coins/bitcoin/market_chart/range?vs_currency=usd&from=${getUnixTime(
      from
    )}&to=${getUnixTime(to)}`;
    return await fetch(url)
      .then((res) => res.json())
      .then((res) => res.prices)
      .then((res) => {
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
        return skip(step, prices);
      });
  }
}

export async function getBtcArs(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const usdars = await getUsdArs(1, from, to);
  const btcusd = await getBtcUsd(1, from, to);
  let btcars: Price[] = [];
  let i = 0;
  for (const p of btcusd) {
    while (!isSameDay(usdars[i].date, p.date)) {
      i++;
    }
    let price: Price = {
      date: p.date,
      value: usdars[i].value * p.value,
    };
    btcars.push(price);
  }
  return skip(step, btcars);
}

export async function getSatUsd(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const res = await getBtcUsd(step, from, to);
  res.forEach((price) => {
    price.value = price.value / Math.pow(10, 8);
  });
  return res;
}

export async function getSatArs(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const res = await getBtcArs(step, from, to);
  res.forEach((price) => {
    price.value = price.value / Math.pow(10, 8);
  });
  return res;
}

export async function getArsUsd(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const res = await getUsdArs(step, from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

export async function getUsdBtc(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const res = await getBtcUsd(step, from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

export async function getArsBtc(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const res = await getBtcArs(step, from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

export async function getUsdSat(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const res = await getSatUsd(step, from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

export async function getArsSat(
  step: number = 1,
  from: number = now,
  to: number = now
): Promise<Price[]> {
  basicVal(step, from, to);
  const res = await getSatArs(step, from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}
