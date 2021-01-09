import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import {
  Price,
  Coin,
  TimeRange,
  lightPalette,
  darkPalette,
  step,
} from "./utils";
import get from "axios";
import { Chart, yScaleT, ChartTheme, Curve } from "./Chart";
import { Info } from "./Info";
import {
  Button,
  ButtonGroup,
  GeistProvider,
  CssBaseline,
} from "@geist-ui/react";

async function getPrices(
  base: Coin,
  quote: Coin,
  r: TimeRange
): Promise<Price[]> {
  return await get(`/api/prices/${base}${quote}?from=${r}`).then(
    (res) => res.data
  );
}

function App() {
  const [data, setData] = useState<Price[]>([]);
  const [niceData, setNiceData] = useState<Price[]>([]);
  const chartTheme = ChartTheme.Orange;
  const pair: [Coin, Coin] = [Coin.USD, Coin.ARS];
  const timerange = TimeRange.Year;
  const curve = Curve.Natural;
  const [scale, setScale] = useState<yScaleT>(yScaleT.Linear);
  const [theme, setTheme] = useState("light");
  // const [chartTheme, setChartTheme] = useState<ChartTheme>(ChartTheme.Orange);
  // const [pair, setPair] = useState<[Coin, Coin]>([Coin.USD, Coin.ARS]);
  // const [timerange, setTimerange] = useState<TimeRange>(TimeRange.Year);
  // const [curve, setCurve] = useState<Curve>(Curve.Natural);

  useEffect(() => {
    setPrices(pair[0], pair[1], timerange);
  }, []);

  function setPrices(base: Coin, quote: Coin, r: TimeRange) {
    getPrices(base, quote, r)
      .then((res) => {
        const prices = res.map((price) => {
          return {
            date: new Date(price.date),
            value: price.value,
          };
        });
        const nice = step(1, prices);
        setData(prices);
        setNiceData(nice);
      })
      .catch((err) => console.error(err));
  }

  return (
    <GeistProvider
      theme={{ palette: theme === "light" ? lightPalette : darkPalette }}>
      <CssBaseline />
      <main>
        <Info data={data} pair={pair} range={timerange} />
        <div className='chart'>
          <ParentSize className='chart-responsive'>
            {({ width, height }) => (
              <Chart
                width={width}
                height={height}
                data={niceData}
                yScaleType={scale}
                chartTheme={chartTheme}
                margin={{
                  bottom: 75,
                  top: 25,
                }}
                curve={curve}
              />
            )}
          </ParentSize>
        </div>
        <ButtonGroup>
          <Button onClick={() => setScale(yScaleT.Linear)}>Linear</Button>
          <Button onClick={() => setScale(yScaleT.Log)}>Log</Button>
          <Button onClick={() => setTheme("light")}>Light</Button>
          <Button onClick={() => setTheme("dark")}>Dark</Button>
        </ButtonGroup>
      </main>
    </GeistProvider>
  );
}

export default App;
