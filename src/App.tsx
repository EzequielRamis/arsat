import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, Coin, TimeRange, Pair } from "./utils/types";
import { getPrices } from "./utils/helpers";
import { Chart, yScaleT, ChartTheme, Curve } from "./components/Chart";
import { Info } from "./components/Info";
import {
  GeistProvider,
  CssBaseline,
  Loading,
  Note,
  Row,
  Button,
  ButtonGroup,
} from "@geist-ui/react";
import { Settings, Info as About } from "@geist-ui/react-icons";
import { btn } from "./utils/themes";
import useAxios from "axios-hooks";
import { Control } from "./components/Control";
import { AxiosRequestConfig } from "axios";

const now = Date.now();

function App() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [pair, setPair] = useState<Pair>([Coin.ARS, Coin.USD]);
  const [time, setTime] = useState<TimeRange>(TimeRange.Month);
  const scale = yScaleT.Linear,
    chartTheme = ChartTheme.Green,
    curve = Curve.Smooth,
    step = 1;
  const [{ data, loading, error }, refetch] = useAxios(
    getPrices(pair, time, now)
  );

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

  useEffect(() => {
    refetch(
      getPrices(pair, time, Date.now()) as AxiosRequestConfig
    ).catch((err) => console.error(err));
  }, [pair, time, refetch]);

  return (
    <GeistProvider theme={{ type: "dark" }}>
      <CssBaseline />
      <main>
        {loading ? (
          <Loading />
        ) : error ? (
          <Note type='error' label='error' filled className='fetch-error'>
            Ocurrió un problema. Intentalo más tarde.
          </Note>
        ) : (
          <>
            <Info data={data} pair={pair} range={time} />
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
                      top: 20,
                    }}
                    curve={curve}
                    step={step}
                  />
                )}
              </ParentSize>
            </div>
          </>
        )}
        <Row justify='center' align='middle' className='control'>
          <Button icon={<Settings />} style={btn}>
            Ajustes
          </Button>
          <Control setPair={setPair} setTime={setTime} />
          <ButtonGroup
            vertical={true}
            size='medium'
            type='success'
            ghost={true}>
            <Button>Log</Button>
            <Button>Linear</Button>
          </ButtonGroup>
        </Row>
        <Row justify='end' className='about'>
          <Button
            icon={<About />}
            style={{ ...btn, padding: "0.25rem", margin: 0 }}
          />
        </Row>
      </main>
    </GeistProvider>
  );
}

export default App;
