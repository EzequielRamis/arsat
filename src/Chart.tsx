/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback } from "react";
import { Price, multiFormat, formatPrice } from "./utils";
import { extent, bisector } from "d3-array";
import { Axis } from "@visx/axis";
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
import { useTheme, Text } from "@geist-ui/react";
import { es } from "date-fns/esm/locale";

type TooltipData = Price;

const x = (p: Price) => p.date;
const y = (p: Price) => p.value;
const bisectDate = bisector<Price, Date>((p) => new Date(p.date)).left;

type ChartProps = {
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
  Red = " #ea3e5b",
  Blue = "#00aaff",
  Green = " #34e6b0",
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
  const { palette } = useTheme();
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
    nice: false,
  };

  const yScaleLinear = scaleLinear(yScaleConfig);
  const yScaleLog = scaleLog(yScaleConfig);

  const dateFormat = (d: Date) => format(d, "dd LLL yyyy", { locale: es });

  const xScaleFormat = (d: any) => multiFormat(d.getTime());
  const yScaleLinearFormat = yScaleLinear.tickFormat(10, "s");
  const yScaleLogFormat = yScaleLog.tickFormat(8, ".2s");

  const [yScale, yScaleFormat] =
    yScaleType === yScaleT.Linear
      ? [yScaleLinear, yScaleLinearFormat]
      : [yScaleLog, yScaleLogFormat];

  const xA = (p: Price) => xScale(p.date);
  const yA = (p: Price) => yScale(p.value);

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
    tooltipData: undefined,
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
      d = d ?? { date: new Date(Date.now()), value: 0 };
      showTooltip({
        tooltipData: d,
        tooltipLeft: x,
        tooltipTop: yScale(d.value),
      });
    },
    [showTooltip, xScale, yScale]
  );

  return (
    <div className='chart-wrapper'>
      <svg width={width} height={height}>
        <ClipPath id='clip-pattern'>
          <rect x={0} y={0} width={width} height={height} />
        </ClipPath>
        <PatternLines
          id='area-pattern'
          height={15}
          width={15}
          stroke={`${chartTheme}0A`}
          strokeWidth={lineWidth}
          orientation={["diagonal"]}
          background={palette.background}
        />
        <LinearGradient
          id='line-gradient'
          from={chartTheme}
          to={chartTheme}
          fromOpacity={0.2}
          toOpacity={1}
          vertical={false}
        />
        <LinearGradient
          id='area-gradient'
          from={chartTheme}
          to={chartTheme}
          fromOpacity={0.5}
          toOpacity={0}
        />
        <defs>
          <linearGradient id='date-gradient'>
            <stop offset='0%' stopColor={palette.background} stopOpacity='1' />
            <stop offset='30%' stopColor={palette.background} stopOpacity='0' />
            <stop offset='70%' stopColor={palette.background} stopOpacity='0' />
            <stop
              offset='100%'
              stopColor={palette.background}
              stopOpacity='1'
            />
          </linearGradient>
        </defs>
        <Group>
          <AreaClosed
            id='chart'
            data={data}
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
            data={data}
            x={xA}
            y={yA}
            stroke={"url(#line-gradient)"}
            strokeWidth={lineWidth}
            curve={curveT}
          />
        </Group>
        <Group>
          <Axis
            axisClassName='axis-x'
            scale={xScale}
            orientation='bottom'
            top={innerHeight + margin.top + 10}
            hideAxisLine={true}
            hideTicks={true}
            rangePadding={100}
            numTicks={3}
            tickFormat={xScaleFormat}
            tickClassName='tick-date'
            tickComponent={({ x, y, formattedValue }) => (
              <g>
                <text x={x} y={y} fill={palette.accents_6}>
                  {formattedValue}
                </text>
              </g>
            )}
          />
          <Bar
            x={margin.left}
            y={innerHeight + margin.top + 15}
            width={innerWidth}
            height={20}
            fill='url(#date-gradient)'
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
              stroke={palette.foreground}
              strokeWidth={2}
              pointerEvents='none'
              opacity={0.25}
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop - 1.5}
              r={6}
              fill={palette.background}
              stroke={chartTheme}
              strokeWidth={lineWidth}
              pointerEvents='none'
            />
          </Group>
        )}
      </svg>
      {tooltipData && (
        <div>
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop - 48}
            left={tooltipLeft + 4}
            style={defaultStyles}>
            {formatPrice(y(tooltipData))}
          </TooltipWithBounds>
          <Tooltip
            top={innerHeight + margin.bottom - 15}
            left={-10}
            style={{
              ...defaultStyles,
              textAlign: "center",
              background: "transparent",
              width: "100%",
              boxShadow: "none",
              padding: 0,
            }}>
            <Text h5={true} style={{ color: palette.accents_8 }}>
              {dateFormat(x(tooltipData))}
            </Text>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
