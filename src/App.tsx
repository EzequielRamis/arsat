// import { useState, useEffect } from "react";
// import { Price, Pair, TimeRange } from "./utils";
// import get from "axios";
// import { AreaClosed, scaleLinear } from "@visx/visx";

// const w = 500;
// const h = 500;

// const x = (p: Price) => p.date;
// const y = (p: Price) => p.value;

// const values = (d: Price[]) => d.map((p) => p.value);
// const dates = (d: Price[]) => d.map((p) => p.date);

// const minmaxX = (d: Price[]) => [d[0].date, d[d.length - 1].date];
// const minmaxY = (d: Price[]) => [
//   Math.min(...values(d)),
//   Math.min(...values(d)),
// ];

// const yScale = scaleLinear({
//   range: [h, 0],
//   domain: minmaxY(data),
// });

// async function getPrices(p: Pair, r: TimeRange): Promise<Price[]> {
//   return await get(`/api/prices/${p}?from=${r}`).then((res) => res.data);
// }

function App() {
  // const [data, setData] = useState<Object[]>([]);
  // useEffect(() => {
  //   let [pair, ts] = [Pair.USDARS, TimeRange.FiveYears];
  //   getPrices(pair, ts)
  //     .then((res) => {
  //       let prices = res.map((price: Price) => {
  //         return {
  //           date: new Date(price.date),
  //           value: price.value,
  //         };
  //       });
  //       console.log(pair, prices);
  //       setData(prices);
  //     })
  //     .catch((err) => console.error(err));
  // }, []);
  return <>{/* <AreaClosed yScale={}></AreaClosed> */}</>;
}
export default App;
