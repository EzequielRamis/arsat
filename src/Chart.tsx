import React from "react";
import { Price } from "./utils";
import { extent } from "d3-array";
import { Spring } from "react-spring/renderprops";
import { AnimatedAxis, AnimatedGridRows } from "@visx/react-spring";
import { scaleLinear, scaleTime, scaleLog } from "@visx/scale";
import { AreaClosed, Area } from "@visx/shape";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { PatternLines } from "@visx/pattern";
import { ClipPath } from "@visx/clip-path";
import { curveLinear, curveNatural } from "@visx/curve";

export type ChartProps = {
  width: number;
  height: number;
  margin?: Margin;
  data: Price[];
  yScaleType: yScaleT;
  chartTheme: ChartTheme;
  curve?: Curve;
};

export enum yScaleT {
  Linear,
  Log,
}

export enum Curve {
  Linear,
  Natural,
}

type Margin = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

export enum ChartTheme {
  Orange = "#f7931a",
  Red = " #e0245e",
  Blue = "#00aaff",
  Green = " #00d588",
}

const lineWidth = 3;

export function Chart({
  width,
  height,
  margin = { top: 0, bottom: 0, left: 0, right: 0 },
  data,
  yScaleType = yScaleT.Linear,
  chartTheme,
  curve = Curve.Linear,
}: ChartProps) {
  margin.top = margin.top ?? 0;
  margin.bottom = margin.bottom ?? 0;
  margin.left = margin.left ?? 0;
  margin.right = margin.right ?? 0;

  const x = (p: Price) => p.date;
  const y = (p: Price) => p.value;

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [minX, maxX] = extent(data, x) as [Date, Date];
  const [minY, maxY] = extent(data, y) as [number, number];

  const xScale = scaleTime({
    range: [margin.left, innerWidth + margin.left],
    domain: [minX, maxX],
  });

  const yScaleConfig = {
    range: [innerHeight + margin.top, margin.top],
    domain: [minY, maxY],
    nice: true,
  };

  const yScaleLinear = scaleLinear(yScaleConfig);
  const yScaleLog = scaleLog(yScaleConfig);

  const yScaleLinearFormat = yScaleLinear.tickFormat(1, "s");
  const yScaleLogFormat = yScaleLog.tickFormat(0, ".0s");

  const [yScale, yScaleFormat] =
    yScaleType === yScaleT.Linear
      ? [yScaleLinear, yScaleLinearFormat]
      : [yScaleLog, yScaleLogFormat];

  const xA = (p: Price) => xScale(p.date);
  const yA = (p: Price) => yScale(p.value);

  const animateData = (props: number[]) => {
    return data.map((p: Price, i: number) => ({
      ...p,
      value: props[i],
    }));
  };

  const curveT = ((c: Curve) => {
    switch (curve) {
      case Curve.Linear:
        return curveLinear;
      case Curve.Natural:
        return curveNatural;
      default:
        return curveLinear;
    }
  })(curve);

  return (
    <svg width={width} height={height}>
      <ClipPath id='clip-pattern'>
        <rect x={0} y={0} width={width} height={height} />
      </ClipPath>
      <Spring to={{ chartTheme }}>
        {(props) => (
          <>
            <PatternLines
              id='area-pattern'
              height={20}
              width={20}
              stroke={`${chartTheme}0A`}
              strokeWidth={lineWidth}
              orientation={["diagonal"]}
              background='var(--color-01)'
            />
            <LinearGradient
              id='line-gradient'
              from={props.chartTheme}
              to={props.chartTheme}
              fromOpacity={0.2}
              toOpacity={1}
              vertical={false}
            />
            <LinearGradient
              id='area-gradient'
              from={props.chartTheme}
              to={props.chartTheme}
              fromOpacity={0.5}
              toOpacity={0}
            />
          </>
        )}
      </Spring>
      <Group>
        <Spring to={data.map(y)}>
          {(props) => {
            const animatedData = animateData(props);
            return (
              <>
                <AreaClosed
                  id='chart'
                  data={animatedData}
                  yScale={yScale}
                  x={xA}
                  y={yA}
                  curve={curveT}
                  shapeRendering='optimizeSpeed'
                />
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
                <Area
                  data={animatedData}
                  x={xA}
                  y={yA}
                  stroke={"url(#line-gradient)"}
                  strokeWidth={lineWidth}
                  curve={curveT}
                />
              </>
            );
          }}
        </Spring>
      </Group>
      <Group>
        <AnimatedAxis
          axisClassName='axis-y'
          scale={yScale}
          orientation='left'
          left={margin.left}
          hideAxisLine={true}
          hideTicks={true}
          animationTrajectory='min'
          numTicks={4}
          tickFormat={yScaleFormat}
        />
        <AnimatedAxis
          axisClassName='axis-x'
          scale={xScale}
          orientation='bottom'
          top={innerHeight + margin.top}
          hideAxisLine={true}
          hideTicks={true}
          animationTrajectory='max'
        />
        <AnimatedGridRows
          scale={yScale}
          width={innerWidth}
          stroke='var(--color-02)'
          strokeWidth={1}
          animationTrajectory='min'
          left={margin.left}
          numTicks={4}
        />
      </Group>
    </svg>
  );
}
