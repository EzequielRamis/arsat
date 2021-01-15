import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, Coin, TimeRange, Pair } from "./utils/types";
import {
  dynChartTheme,
  dynStep,
  getPrices,
  includesBtc,
} from "./utils/helpers";
import { Chart, yScaleT, Curve } from "./components/Chart";
import { Info } from "./components/Info";
import {
  InfoAlign,
  Settings,
  Theme,
  useSettingsInfoAlign,
  useSettingsTheme,
} from "./components/Settings";
import {
  GeistProvider,
  CssBaseline,
  Loading,
  Note,
  Row,
  Button,
} from "@geist-ui/react";
import { Info as About } from "@geist-ui/react-icons";
import { btn, day, night, sunset } from "./utils/themes";
import useAxios from "axios-hooks";
import { Control } from "./components/Control";
import { Scale } from "./components/Scale";
import { AxiosRequestConfig } from "axios";

const now = Date.now();

function App() {
  const [pairBuffer, setPairBuffer] = useState<Pair>([Coin.USD, Coin.ARS]);
  const [timeBuffer, setTimeBuffer] = useState<TimeRange>(TimeRange.Month);

  const [prices, setPrices] = useState<Price[]>([]);
  const [pair, setPair] = useState<Pair>(pairBuffer);
  const [time, setTime] = useState<TimeRange>(timeBuffer);

  const [scale, setScale] = useState<yScaleT>(yScaleT.Linear);

  const [theme, setTheme] = useSettingsTheme(Theme.Day);
  const [infoAlign, setInfoAlign] = useSettingsInfoAlign(InfoAlign.Center);

  const curve = Curve.Smooth;
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

  return (
    <GeistProvider
      theme={{
        palette:
          theme === Theme.Day ? day : theme === Theme.Sunset ? sunset : night,
      }}>
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
            <Info data={prices} pair={pair} range={time} align={infoAlign} />
            <div className='chart'>
              <ParentSize className='chart-responsive'>
                {({ width, height }) => (
                  <Chart
                    width={width}
                    height={height}
                    data={prices}
                    yScaleType={scale}
                    chartTheme={dynChartTheme(pair)}
                    margin={{
                      bottom: 90,
                      top: 25,
                    }}
                    curve={curve}
                    step={dynStep(pair, time)}
                    day={includesBtc(pair) && time === TimeRange.Day}
                  />
                )}
              </ParentSize>
            </div>
          </>
        )}
        <Row justify='center' align='middle' className='control'>
          <Settings
            theme={[theme, setTheme]}
            infoAlign={[infoAlign, setInfoAlign]}
          />
          <Control
            pair={[pairBuffer, setPairBuffer]}
            time={[timeBuffer, setTimeBuffer]}
          />
          <Scale scale={[scale, setScale]} />
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
