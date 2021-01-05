import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, /*Pair, TimeRange,*/ step } from "./utils";
// import get from "axios";
import { Chart, yScaleT, Theme } from "./Chart";
import { genDateValue } from "@visx/mock-data";
// import { parseISO } from "date-fns";

// async function getPrices(p: Pair, r: TimeRange): Promise<Price[]> {
//   return await get(`/api/prices/${p}?from=${r}`).then((res) => res.data);
// }

function randomEnum<T>(anEnum: T): T[keyof T] {
  const enumValues = (Object.values(anEnum) as unknown) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
}

function App() {
  const [data, setData] = useState<Price[]>([]);
  const [theme, setTheme] = useState<Theme>(Theme.Blue);
  const updateData = (n: number) => {
    let prices = genDateValue(n).map((p) => {
      let price: Price = {
        date: p.date,
        value: p.value,
      };
      return price;
    });
    setTheme(randomEnum(Theme));
    setData(step(1, prices));
  };

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
    updateData(50);
  }, []);

  return (
    <>
      <button onClick={() => updateData(50)}>Update chart</button>
      <ParentSize>
        {({ width, height }) => (
          <Chart
            width={width}
            height={height}
            data={data}
            yScaleType={yScaleT.Log}
            theme={theme}
          />
        )}
      </ParentSize>
    </>
  );
}

export default App;
