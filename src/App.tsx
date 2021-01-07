import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, Pair, TimeRange, step } from "./utils";
import get from "axios";
import { Chart, yScaleT, ChartTheme, Curve } from "./Chart";
import { genDateValue } from "@visx/mock-data";

async function getPrices(p: Pair, r: TimeRange): Promise<Price[]> {
  return await get(`/api/prices/${p}?from=${r}`).then((res) => res.data);
}

function randomEnum<T>(anEnum: T): T[keyof T] {
  const enumValues = (Object.values(anEnum) as unknown) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
}

function setPrices(
  p: Pair,
  r: TimeRange,
  s: number,
  setData: React.Dispatch<React.SetStateAction<Price[]>>
) {
  getPrices(p, r)
    .then((res) => {
      const prices = res.map((price) => {
        return {
          date: new Date(price.date),
          value: price.value,
        };
      });
      console.log(p, prices);
      setData(step(s, prices));
    })
    .catch((err) => console.error(err));
}

function App() {
  const [data, setData] = useState<Price[]>([]);
  const [chartTheme, setChartTheme] = useState<ChartTheme>(ChartTheme.Blue);
  // const [timerange, setTimerange] = useState<TimeRange>(TimeRange.Month);
  const [curve, setCurve] = useState<Curve>(Curve.Linear);
  const [scale, setScale] = useState<yScaleT>(yScaleT.Linear);
  const updateData = (n: number) => {
    const values = genDateValue(n);
    console.log(values);
    const prices = values.map((p) => {
      const price: Price = {
        date: p.date,
        value: p.value,
      };
      return price;
    });
    setData(step(1, prices));
  };

  useEffect(() => {
    const [pair, ts] = [Pair.BTCUSD, TimeRange.Month];
    setPrices(pair, ts, 20, setData);
  }, []);

  return (
    <>
      <button onClick={() => updateData(20)}>Update chart</button>
      <ParentSize>
        {({ width, height }) => (
          <Chart
            width={width}
            height={height}
            data={data}
            yScaleType={scale}
            chartTheme={chartTheme}
            margin={{
              bottom: height * 0.15,
              left: width * 0.15,
              right: width * 0.15,
              top: height * 0.15,
            }}
            curve={curve}
          />
        )}
      </ParentSize>
      <button onClick={() => setScale(yScaleT.Linear)}>Linear</button>
      <button onClick={() => setScale(yScaleT.Log)}>Log</button>
      <button onClick={() => setCurve(Curve.Linear)}>Curve Linear</button>
      <button onClick={() => setCurve(Curve.Natural)}>Curve Natural</button>
      <button onClick={() => setChartTheme(randomEnum(ChartTheme))}>
        Color
      </button>
    </>
  );
}

export default App;
