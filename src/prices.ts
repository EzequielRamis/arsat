import { lightFormat, parse } from "date-fns";

const AMBITO_API =
  "https://mercados.ambito.com/dolar/informal/historico-general";
const BLUELYTICS_API = "https://api.bluelytics.com.ar/v2/latest";
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
  if (fromFormatted === nowFormatted && toFormatted === nowFormatted) {
    return await fetch(BLUELYTICS_API)
      .then((res) => res.json())
      .then((res) => {
        let price: Price = {
          date: from,
          value: parseFloat(res.blue.value_sell),
        };
        return [price];
      });
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
