import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, Coin, TimeRange, Pair } from "./utils/types";
import { getPrices } from "./utils/helpers";
import { Chart, yScaleT, Curve } from "./components/Chart";
import { Info } from "./components/Info";
import {
  GeistProvider,
  CssBaseline,
  Loading,
  Note,
  Row,
  Button,
  ButtonGroup,
  useTheme,
} from "@geist-ui/react";
import { Settings, Info as About } from "@geist-ui/react-icons";
import { btn, ChartTheme } from "./utils/themes";
import useAxios from "axios-hooks";
import { Control } from "./components/Control";
import { AxiosRequestConfig } from "axios";

const now = Date.now();

function App() {
  const { palette } = useTheme();

  const [pairBuffer, setPairBuffer] = useState<Pair>([Coin.USD, Coin.ARS]);
  const [timeBuffer, setTimeBuffer] = useState<TimeRange>(TimeRange.Month);

  const [prices, setPrices] = useState<Price[]>([]);
  const [pair, setPair] = useState<Pair>(pairBuffer);
  const [time, setTime] = useState<TimeRange>(timeBuffer);

  const [scale, setScale] = useState<yScaleT>(yScaleT.Linear);

  const chartTheme = ChartTheme.Green,
    curve = Curve.Smooth,
    step = 1;
  const [{ loading, error }, refetch] = useAxios(
    getPrices(pairBuffer, timeBuffer, now)
  );

  useEffect(() => {
    refetch(getPrices(pairBuffer, timeBuffer, Date.now()) as AxiosRequestConfig)
      .then(({ data }) => {
        setPrices(
          data.map((price: Price) => {
            return {
              date: new Date(price.date),
              value: price.value,
            };
          })
        );
        setPair(pairBuffer);
        setTime(timeBuffer);
      })
      .catch((err) => console.error(err));
  }, [pairBuffer, timeBuffer, refetch]);

  const scaleSelected = (s: yScaleT) => {
    if (s === scale)
      return {
        color: palette.background,
        backgroundColor: palette.success,
      };
    else
      return {
        color: palette.success,
        backgroundColor: "transparent",
      };
  };

  return (
    <GeistProvider theme={{ type: "light" }}>
      <CssBaseline />
      <main>
        {loading && prices.length === 0 ? (
          <Loading />
        ) : error ? (
          <Note type='error' label='error' filled className='fetch-error'>
            Ocurrió un problema. Intentalo más tarde.
          </Note>
        ) : (
          <>
            {loading && (
              <div className='refetch-loading'>
                <Loading />
              </div>
            )}
            <Info data={prices} pair={pair} range={time} />
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
          <Control
            updatePair={setPairBuffer}
            updateTime={setTimeBuffer}
            initialPair={pairBuffer}
            initialTime={timeBuffer}
          />
          <ButtonGroup
            vertical={true}
            size='medium'
            type='success'
            ghost={true}>
            <Button
              style={scaleSelected(yScaleT.Log)}
              onClick={() => setScale(yScaleT.Log)}>
              Log
            </Button>
            <Button
              style={scaleSelected(yScaleT.Linear)}
              onClick={() => setScale(yScaleT.Linear)}>
              Linear
            </Button>
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
