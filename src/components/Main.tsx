import { ParentSize } from "@visx/responsive";
import { useState, useEffect } from "react";
import { Price, Coin, TimeRange, Pair, LiveCount } from "../utils/types";
import {
  dynChartTheme,
  dynStep,
  getLiveType,
  getPrices,
  includesBtc,
} from "../utils/helpers";
import { Chart, yScaleT, Curve } from "./Chart";
import { Info } from "./Info";
import { InfoAlign, Settings, Theme } from "./Settings";
import {
  Loading,
  Note,
  Row,
  Button,
  useToasts,
  Dot,
  useTheme,
} from "@geist-ui/react";
import { Info as About } from "@geist-ui/react-icons";
import { btn, ChartTheme } from "../utils/themes";
import useAxios from "axios-hooks";
import { Control } from "./Control";
import { Scale } from "./Scale";
import { AxiosRequestConfig } from "axios";
import { useIdb, useInterval } from "../utils/hooks";

type MainProps = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const now = Date.now();

function Main({ theme, setTheme }: MainProps) {
  const [prices, setPrices] = useState<Price[]>([]);

  const [pairCache, setPairCache] = useIdb<Pair>("pair", [Coin.ARS, Coin.SAT]);
  const [timeCache, setTimeCache] = useIdb<TimeRange>("time", TimeRange.Day);

  const [pair, setPair] = useState<Pair>(pairCache);
  const [time, setTime] = useState<TimeRange>(timeCache);

  const [scale, setScale] = useIdb<yScaleT>("scale", yScaleT.Linear);

  const [infoAlign, setInfoAlign] = useIdb("info-align", InfoAlign.Center);
  const [minmax, setMinmax] = useIdb("min-max", false);
  const [grid, setGrid] = useIdb("grid", false);
  const [chartTheme, setChartTheme] = useIdb("chart-theme", ChartTheme.Dynamic);
  const [live, setLive] = useIdb<boolean>("live", true);

  const countdown = getLiveType(pairCache, timeCache);
  const [counter, setCounter] = useState<number>(countdown);

  const min = Math.floor(counter / 60);
  const sec = counter - min * 60;

  const curve = Curve.Smooth;
  const [, setToast] = useToasts();

  const { palette } = useTheme();

  const [{ loading, error }, refetch] = useAxios(
    getPrices(pairCache, timeCache, now)
  );

  const refetchPrices = () => {
    console.log("refetching");
    const now = Date.now();
    refetch(getPrices(pairCache, timeCache, now) as AxiosRequestConfig)
      .then(({ data }) => {
        setPrices(
          data.map((price: Price) => {
            return {
              date: new Date(price.date),
              value: price.value,
            };
          })
        );
        setPair(pairCache);
        setTime(timeCache);
        setCounter(countdown);
      })
      .catch((err) => {
        console.error(err);
        if (prices.length !== 0 && err.message !== undefined)
          setToast({
            type: "error",
            text: "No se pudo obtener información.",
            delay: 5000,
          });
      });
  };

  useEffect(() => {
    refetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairCache, timeCache]);

  useEffect(() => {
    if (!live) setCounter(countdown);
  }, [countdown, live]);

  useInterval(
    () => {
      if (counter <= 0) {
        refetchPrices();
      } else setCounter(counter - 1);
    },
    live && countdown !== LiveCount.None && !loading && !error ? 1000 : null
  );

  return (
    <main>
      {prices.length === 0 ? (
        loading ? (
          <Loading />
        ) : (
          error && (
            <Note type='error' label='error' filled className='fetch-error'>
              Ocurrió un problema con la conexión. Intentalo más tarde.
            </Note>
          )
        )
      ) : (
        <>
          <div className='header'>
            {live && countdown !== LiveCount.None && (
              <Dot
                type={countdown === LiveCount.Minute ? "success" : "warning"}
                style={{ color: palette.accents_7 }}>
                {min.toString().padStart(2, "0")}:
                {sec.toString().padStart(2, "0")}
              </Dot>
            )}
            {loading && <Loading />}
          </div>
          <Info data={prices} pair={pair} range={time} align={infoAlign} />
          <div className='chart'>
            <ParentSize className='chart-responsive'>
              {({ width, height }) => (
                <Chart
                  width={width}
                  height={height}
                  data={prices}
                  yScaleType={scale}
                  chartTheme={
                    chartTheme === ChartTheme.Dynamic
                      ? dynChartTheme(pair)
                      : chartTheme
                  }
                  margin={{
                    bottom: 90,
                    top: 25,
                  }}
                  curve={curve}
                  step={dynStep(pair, time)}
                  day={includesBtc(pair) && time === TimeRange.Day}
                  minmax={minmax}
                  grid={grid}
                />
              )}
            </ParentSize>
          </div>
          <Row justify='center' align='middle' className='control'>
            <Settings
              theme={[theme, setTheme]}
              infoAlign={[infoAlign, setInfoAlign]}
              minmax={[minmax, setMinmax]}
              grid={[grid, setGrid]}
              chartTheme={[chartTheme, setChartTheme]}
              live={[live, setLive]}
            />
            <Control
              pair={[pairCache, setPairCache]}
              time={[timeCache, setTimeCache]}
              isLive={live}
            />
            <Scale scale={[scale, setScale]} />
          </Row>
          <Row justify='end' className='about'>
            <Button
              icon={<About />}
              style={{ ...btn, padding: "0.25rem", margin: 0 }}
            />
          </Row>
        </>
      )}
    </main>
  );
}

export default Main;
