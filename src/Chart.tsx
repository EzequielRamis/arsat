import React from "react";
import { Price } from "./utils";
import { scaleLinear, scaleTime, scaleLog } from "@visx/scale";
import { AreaClosed } from "@visx/shape";
import { curveNatural } from "@visx/curve";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { PatternLines } from "@visx/pattern";
import { ClipPath } from "@visx/clip-path";
import { Spring } from "react-spring/renderprops";
import { extent } from "d3-array";

export type PriceChartProps = {
  width: number;
  height: number;
  data: Price[];
  yScaleType: yScaleT;
  theme: string;
};

export enum yScaleT {
  Linear,
  Log,
}

export enum Theme {
  Orange = "#F7931A",
  Red = "#E0245E",
  Blue = "#00AAFF",
  Green = "#00D588",
}

const lineWidth = 3;

export function Chart({
  width,
  height,
  data,
  yScaleType,
  theme,
}: PriceChartProps) {
  const x = (p: Price) => p.date;
  const y = (p: Price) => p.value;

  const xScale = scaleTime({
    range: [0, width],
    domain: extent(data, x) as [Date, Date],
  });

  const yScaleConfig = {
    range: [height, 0],
    domain: extent(data, y) as [number, number],
    nice: true,
  };

  const yScaleLinear = scaleLinear(yScaleConfig);
  const yScaleLog = scaleLog(yScaleConfig);

  const yScale = yScaleType === yScaleT.Linear ? yScaleLinear : yScaleLog;

  const animateData = (props: number[]) => {
    return data.map((p: Price, i: number) => ({
      ...p,
      value: props[i],
    }));
  };

  return (
    <svg width={width} height={height}>
      <ClipPath id='clip-pattern'>
        <rect x={0} y={0} width={width} height={height} />
      </ClipPath>
      <Spring to={{ theme }}>
        {(props) => (
          <>
            <PatternLines
              id='area-pattern'
              height={20}
              width={20}
              stroke={`${theme}0A`}
              strokeWidth={lineWidth}
              orientation={["diagonal"]}
              background='#241f3d'
            />
            <LinearGradient
              id='line-gradient'
              from={props.theme}
              to={props.theme}
              fromOpacity={0.2}
              toOpacity={1}
              vertical={false}
            />
            <LinearGradient
              id='area-gradient'
              from={props.theme}
              to={props.theme}
              fromOpacity={0.5}
              toOpacity={0}
            />
          </>
        )}
      </Spring>
      <Group>
        <Spring to={data.map(y)}>
          {(props) => (
            <>
              <AreaClosed
                id='chart'
                data={animateData(props)}
                yScale={yScale}
                x={(p) => xScale(p.date)}
                y={(p) => yScale(p.value)}
                stroke={"url(#line-gradient)"}
                strokeWidth={lineWidth}
                curve={curveNatural}
              />
            </>
          )}
        </Spring>
      </Group>
      <use
        clipPath='url(#clip-pattern)'
        xlinkHref='#chart'
        fill='url(#area-pattern)'
      />
      <use
        clipPath='url(#clip-pattern)'
        xlinkHref='#chart'
        fill={"url(#area-gradient)"}
      />
    </svg>
  );
}
