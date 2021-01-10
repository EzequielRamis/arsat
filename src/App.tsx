import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, Coin, TimeRange } from "./utils";
import { Chart, yScaleT, ChartTheme, Curve } from "./Chart";
import { Info } from "./Info";
import { GeistProvider, CssBaseline, Loading } from "@geist-ui/react";
import useAxios from "axios-hooks";
import { Control } from "./Control";

function getPrices(base: Coin, quote: Coin, r: TimeRange) {
  return `/api/prices/${base}${quote}?from=${r}`;
}

function App() {
  const [prices, setPrices] = useState<Price[]>([]);
  const pair: [Coin, Coin] = [Coin.BTC, Coin.USD],
    timerange = TimeRange.Year,
    scale = yScaleT.Linear,
    chartTheme = ChartTheme.Green,
    curve = Curve.Natural,
    step = 1;
  const [{ data, loading }] = useAxios(getPrices(pair[0], pair[1], timerange));

  useEffect(() => {
    data &&
      setPrices(
        data.map((price: Price) => {
          return {
            date: new Date(price.date),
            value: price.value,
          };
        })
      );
  }, [data]);

  return (
    <GeistProvider theme={{ type: "light" }}>
      <CssBaseline />
      <main>
        {loading && !data ? (
          <Loading />
        ) : (
          <>
            <Info data={data} pair={pair} range={timerange} />
            <div className='chart'>
              <ParentSize className='chart-responsive'>
                {({ width, height }) => (
                  <Chart
                    width={width}
                    height={height}
                    data={prices}
                    yScaleType={scale}
                    chartTheme={chartTheme}
                    margin={{
                      bottom: 90,
                    }}
                    curve={curve}
                    step={step}
                  />
                )}
              </ParentSize>
            </div>
            <Control />
          </>
        )}
      </main>
    </GeistProvider>
  );
}

export default App;
