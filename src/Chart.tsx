import React from "react";
import { Price } from "./utils";
import { scaleLinear, scaleTime, scaleLog } from "@visx/scale";
import { AreaClosed, Area } from "@visx/shape";
import { curveNatural } from "@visx/curve";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { PatternLines } from "@visx/pattern";
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

  return (
    <svg width={width} height={height}>
      <Group>
        <PatternLines
          id='area-pattern'
          height={20}
          width={20}
          stroke={`${theme}0A`}
          strokeWidth={lineWidth}
          orientation={["diagonal"]}
        />
        <LinearGradient
          id='line-gradient'
          from={theme}
          to={theme}
          fromOpacity={0.5}
          toOpacity={1}
          vertical={false}
        />
        <LinearGradient
          id='area-gradient'
          from={theme}
          to={theme}
          fromOpacity={0.5}
          toOpacity={0}
        />
        <AreaClosed
          data={data}
          yScale={yScale}
          x={(p) => xScale(p.date)}
          y={(p) => yScale(p.value)}
          fill={"url(#area-pattern)"}
          curve={curveNatural}
        />
        <Area
          data={data}
          x={(p) => xScale(p.date)}
          y={(p) => yScale(p.value)}
          stroke={"url(#line-gradient)"}
          strokeWidth={lineWidth}
          curve={curveNatural}
        />
        <AreaClosed
          data={data}
          yScale={yScale}
          x={(p) => xScale(p.date)}
          y={(p) => yScale(p.value)}
          fill={"url(#area-gradient)"}
          curve={curveNatural}
        />
      </Group>
    </svg>
  );
}
