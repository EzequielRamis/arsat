import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, Pair, TimeRange, step } from "./utils";
import get from "axios";
import { Chart, yScaleT, Theme } from "./Chart";
import { appleStock } from "@visx/mock-data";
import { parseISO } from "date-fns";

async function getPrices(p: Pair, r: TimeRange): Promise<Price[]> {
  return await get(`/api/prices/${p}?from=${r}`).then((res) => res.data);
}

function App() {
  const [data, setData] = useState<Price[]>([]);
  useEffect(() => {
    // let [pair, ts] = [Pair.BTCUSD, TimeRange.Max];
    // getPrices(pair, ts)
    //   .then((res) => {
    //     let prices = res.map((price) => {
    //       return {
    //         date: new Date(price.date),
    //         value: price.value,
    //       };
    //     });
    //     console.log(pair, prices);
    //     setData(step(35, prices));
    //   })
    //   .catch((err) => console.error(err));
    let prices = appleStock.map((p) => {
      let price: Price = {
        date: parseISO(p.date),
        value: p.close,
      };
      return price;
    });
    console.log(step(2, prices));
    setData(step(10, prices));
  }, []);
  return (
    <ParentSize>
      {({ width, height }) => (
        <Chart
          width={width}
          height={height}
          data={data}
          yScaleType={yScaleT.Linear}
          theme={Theme.Blue}
        />
      )}
    </ParentSize>
  );
}

export default App;
