/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback } from "react";
import { Price } from "./utils";
import { extent, bisector } from "d3-array";
import { Spring } from "react-spring/renderprops";
import { AnimatedAxis, AnimatedGridRows } from "@visx/react-spring";
import { scaleLinear, scaleTime, scaleLog } from "@visx/scale";
import { AreaClosed, Area, Line, Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { PatternLines } from "@visx/pattern";
import { ClipPath } from "@visx/clip-path";
import { curveLinear, curveNatural } from "@visx/curve";
import {
  useTooltip,
  TooltipWithBounds,
  Tooltip,
  defaultStyles,
} from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { format as d3Format } from "d3-format";
import * as d3T from "d3-time";

type TooltipData = Price;

const x = (p: Price) => p.date;
const y = (p: Price) => p.value;
const bisectDate = bisector<Price, Date>((p) => new Date(p.date)).left;

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

const formatMillisecond = ".SS",
  formatSecond = ":ss",
  formatMinute = "HH:mm",
  formatHour = "HH 'hs'",
  formatDay = "dd LLL",
  formatWeek = "dd LLL",
  formatMonth = "LLL",
  formatYear = "yyyy";

function multiFormat(date: Date) {
  return format(
    date,
    d3T.timeSecond(date) < date
      ? formatMillisecond
      : d3T.timeMinute(date) < date
      ? formatSecond
      : d3T.timeHour(date) < date
      ? formatMinute
      : d3T.timeDay(date) < date
      ? formatHour
      : d3T.timeMonth(date) < date
      ? d3T.timeWeek(date) < date
        ? formatDay
        : formatWeek
      : d3T.timeYear(date) < date
      ? formatMonth
      : formatYear,
    { locale: es }
  );
}

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

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [minX, maxX] = extent(data, x) as [Date, Date];
  const [minY, maxY] = extent(data, y) as [number, number];

  const xScale = scaleTime({
    range: [margin.left, innerWidth + (margin.left ?? 0)],
    domain: [minX, maxX],
  });

  const yScaleConfig = {
    range: [innerHeight + (margin.top ?? 0), margin.top],
    domain: [minY, maxY],
    nice: true,
  };

  const yScaleLinear = scaleLinear(yScaleConfig);
  const yScaleLog = scaleLog(yScaleConfig);

  const dateFormat = (d: Date) => format(d, "dd LLL yyyy", { locale: es });

  const xScaleFormat = (d: any) => multiFormat(d.getTime());
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

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip<TooltipData>({
    tooltipOpen: true,
    tooltipLeft: width / 3,
    tooltipTop: height / 3,
    tooltipData: { date: new Date(), value: 0 },
  });

  const handleTooltip = useCallback(
    (
      event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>
    ) => {
      const { x } = localPoint(event) || { x: 0 };
      const x0 = xScale.invert(x);
      const index = bisectDate(data, x0, 1);
      const d0 = data[index - 1];
      const d1 = data[index];
      let d = d0;
      if (d1 && d1.date) {
        d =
          x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf()
            ? d1
            : d0;
      }
      showTooltip({
        tooltipData: d,
        tooltipLeft: x,
        tooltipTop: yScale(d.value),
      });
    },
    [showTooltip, xScale, yScale]
  );

  return (
    <div>
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
            tickFormat={xScaleFormat}
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
        <Bar
          x={margin.left}
          y={margin.top}
          width={innerWidth}
          height={innerHeight}
          fill='transparent'
          rx={14}
          onTouchStart={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseMove={handleTooltip}
          onMouseLeave={() => hideTooltip()}
        />
        {tooltipData && (
          <Group>
            <Line
              from={{ x: tooltipLeft, y: margin.top }}
              to={{ x: tooltipLeft, y: innerHeight + margin.top }}
              stroke='var(--color-02)'
              strokeWidth={2}
              pointerEvents='none'
              strokeDasharray='5,2'
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop}
              r={4}
              fill='black'
              fillOpacity={0.1}
              stroke='black'
              strokeOpacity={0.1}
              strokeWidth={2}
              pointerEvents='none'
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop}
              r={4}
              fill='var(--color-02)'
              stroke='white'
              strokeWidth={2}
              pointerEvents='none'
            />
          </Group>
        )}
      </svg>
      {tooltipData && (
        <div>
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop - 12}
            left={tooltipLeft + 12}
            style={defaultStyles}>
            {d3Format(".0f")(y(tooltipData))}
          </TooltipWithBounds>
          <Tooltip
            top={innerHeight + margin.top - 14}
            left={tooltipLeft}
            style={{
              ...defaultStyles,
              minWidth: 72,
              textAlign: "center",
              transform: "translateX(-50%)",
            }}>
            {dateFormat(x(tooltipData))}
          </Tooltip>
        </div>
      )}
    </div>
  );
}
