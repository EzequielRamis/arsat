import { lightFormat, parse, getUnixTime, isSameDay, addDays } from "date-fns";

const AMBITO_API =
  "https://mercados.ambito.com/dolar/informal/historico-general";
const BLUELYTICS_API = "https://api.bluelytics.com.ar/v2/latest";
const COINGECKO_API = "https://api.coingecko.com/api/v3";
const now = new Date(Date.now());

export interface Price {
  date: Date;
  value: number;
}

export async function getUsdArs(
  from: Date = now,
  to: Date = now
): Promise<Price[]> {
  let fromFormatted = lightFormat(from, "dd-MM-yyyy");
  let toFormatted = lightFormat(to, "dd-MM-yyyy");
  let nowFormatted = lightFormat(now, "dd-MM-yyyy");
  let today = await fetch(BLUELYTICS_API)
    .then((res) => res.json())
    .then((res) => {
      let price: Price = {
        date: now,
        value: parseFloat(res.blue.value_sell),
      };
      return price;
    });
  if (fromFormatted === nowFormatted && toFormatted === nowFormatted) {
    return [today];
  } else {
    let url = `${AMBITO_API}/${fromFormatted}/${toFormatted}`;
    return await fetch(url)
      .then((res) => res.json())
      .then((res) => {
        res.shift();
        if (res.length === 0) {
          throw new Error("Invalid date arguments");
        }
        let prices = res.map((item: string[]) => {
          let price: Price = {
            date: parse(item[0], "dd-MM-yyyy", new Date()),
            value: parseFloat(item[2].replace(/,/g, ".")),
          };
          return price;
        });
        prices.unshift(today);
        // prices.forEach((actual: any, index: any) => {
        //   if (index !== prices.length - 1) {
        //     let tomorrow = addDays(actual.date, 1);
        //     let next = prices[index + 1].date;
        //     if (next !== tomorrow) {
        //       let nextPrice: Price = {
        //         date: tomorrow,
        //         value: actual.value,
        //       };
        //       prices.splice(index + 1, 0, nextPrice);
        //     }
        //   }
        // });
        return prices;
      });
  }
}

export async function getArsUsd(
  from: Date = now,
  to: Date = now
): Promise<Price[]> {
  const res = await getUsdArs(from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

export async function getBtcUsd(
  from: Date = now,
  to: Date = now
): Promise<Price[]> {
  let fromFormatted = lightFormat(from, "dd-MM-yyyy");
  let toFormatted = lightFormat(to, "dd-MM-yyyy");
  let nowFormatted = lightFormat(now, "dd-MM-yyyy");
  if (fromFormatted === nowFormatted && toFormatted === nowFormatted) {
    return await fetch(
      `${COINGECKO_API}/simple/price?ids=bitcoin&vs_currencies=usd`
    )
      .then((res) => res.json())
      .then((res) => {
        let price: Price = {
          date: from,
          value: parseFloat(res.bitcoin.usd),
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
            date: new Date(item[0]),
            value: item[1],
          };
          return price;
        });
        return prices;
      });
  }
}

export async function getUsdBtc(
  from: Date = now,
  to: Date = now
): Promise<Price[]> {
  const res = await getBtcUsd(from, to);
  res.forEach((price) => {
    price.value = 1 / price.value;
  });
  return res;
}

// export async function getBtcArs(
//   from: Date = now,
//   to: Date = now
// ): Promise<Price[]> {
//   const arsusd = await getUsdArs(from, to);
//   const btcusd = await getBtcUsd(from, to);
//   const btcars = arsusd.flatMap((arsusdPrice) => {
//     let buffer = btcusd.filter((btcusdPrice) =>
//       isSameDay(btcusdPrice.date, arsusdPrice.date)
//     );
//     console.log(buffer);
//     let prices = buffer.map((btcusdPrice) => {
//       let price: Price = {
//         date: btcusdPrice.date,
//         value: arsusdPrice.value * btcusdPrice.value,
//       };
//       return price;
//     });
//     return prices;
//   });
//   console.log(arsusd);
//   console.log(btcusd);
//   console.log(btcars);
//   return btcars;
// }

// export async function getBtcArs(
//   from: Date = now,
//   to: Date = now
// ): Promise<Price[]> {
//   const arsusd = await getUsdArs(from, to);
//   let btcusd = await getBtcUsd(from, to);
//   const btcars = arsusd.flatMap((arsusdPrice) => {
//     let buffer = btcusd.filter((btcusdPrice) =>
//       isSameDay(btcusdPrice.date, arsusdPrice.date)
//     );
//     let prices = buffer.map((btcusdPrice) => {
//       let price: Price = {
//         date: btcusdPrice.date,
//         value: arsusdPrice.value * btcusdPrice.value,
//       };
//       return price;
//     });
//     btcusd = btcusd.slice(0, -buffer.length);
//     return prices;
//   });
//   return btcars;
// }
