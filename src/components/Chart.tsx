import React, { useCallback, useMemo } from "react";
import { Price } from "../utils/types";
import { multiFormat, formatPrice } from "../utils/formats";
import { step as skip } from "../utils/helpers";
import { ChartTheme } from "../utils/themes";
import { extent, bisector } from "d3-array";
import { format } from "date-fns";
import { useTheme, Text as GText } from "@geist-ui/react";
import { es } from "date-fns/esm/locale";
import { Axis } from "@visx/axis";
import { GridRows } from "@visx/grid";
import { scaleLinear, scaleTime, scaleLog } from "@visx/scale";
import { AreaClosed, Area, Line, Bar } from "@visx/shape";
import { Group } from "@visx/group";
import { LinearGradient } from "@visx/gradient";
import { PatternLines } from "@visx/pattern";
import { ClipPath } from "@visx/clip-path";
import { curveStep, curveMonotoneX, curveLinear } from "@visx/curve";
import {
  useTooltip,
  TooltipWithBounds,
  Tooltip,
  defaultStyles,
} from "@visx/tooltip";
import { localPoint } from "@visx/event";
import { Text } from "@visx/text";

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
  step?: number;
  day?: boolean;
  minmax?: boolean;
  grid?: boolean;
};

export enum yScaleT {
  Linear,
  Log,
}

export enum Curve {
  Linear,
  Smooth,
  Step,
}

type Margin = {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
};

const lineWidth = 3;

export function Chart({
  width,
  height,
  margin = { top: 0, bottom: 0, left: 0, right: 0 },
  data,
  yScaleType = yScaleT.Linear,
  chartTheme,
  curve = Curve.Linear,
  step = 1,
  day = false,
  minmax = false,
  grid = false,
}: ChartProps) {
  const { palette } = useTheme();
  margin.top = margin.top ?? 0;
  margin.bottom = margin.bottom ?? 0;
  margin.left = margin.left ?? 0;
  margin.right = margin.right ?? 0;

  const stepped = useMemo(() => (step <= 1 ? data : skip(step, data)), [
    data,
    step,
  ]);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [minX, maxX] = extent(stepped, x) as [Date, Date];
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
  const dayFormat = (d: Date) => format(d, "HH:mm", { locale: es });

  const xScaleFormat = (d: any) => multiFormat(d.getTime());

  const yScale = yScaleType === yScaleT.Linear ? yScaleLinear : yScaleLog;

  const xA = (p: Price) => xScale(p.date);
  const yA = (p: Price) => yScale(p.value);

  const curveT = ((c: Curve) => {
    switch (c) {
      case Curve.Linear:
        return curveLinear;
      case Curve.Smooth:
        return curveMonotoneX;
      case Curve.Step:
        return curveStep;
      default:
        break;
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
      const index = bisectDate(stepped, x0, 1);
      const d0 = stepped[index - 1];
      const d1 = stepped[index];
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
    [showTooltip, xScale, yScale, stepped]
  );

  const [minPrice, maxPrice] = [yScale(minY), yScale(maxY)];

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
          id='area-gradient'
          from={chartTheme}
          to={chartTheme}
          fromOpacity={0.5}
          toOpacity={0}
        />
        <defs>
          <linearGradient id='date-gradient'>
            <stop offset='0%' stopColor={palette.background} stopOpacity='1' />
            <stop offset='20%' stopColor={palette.background} stopOpacity='0' />
            <stop offset='80%' stopColor={palette.background} stopOpacity='0' />
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
            data={stepped}
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
            data={stepped}
            x={xA}
            y={yA}
            stroke={chartTheme}
            strokeWidth={lineWidth}
            curve={curveT}
          />
        </Group>
        <Group>
          {grid && (
            <GridRows
              scale={yScale}
              width={innerWidth}
              stroke={palette.accents_3}
              strokeWidth={1}
              strokeDasharray='4'
              left={margin.left}
              numTicks={4}
            />
          )}
          {minmax && (
            <Group>
              <Group>
                <Line
                  from={{ x: 0, y: maxPrice }}
                  to={{ x: width, y: maxPrice }}
                  stroke={palette.accents_4}
                  strokeWidth={1}
                  strokeDasharray={4}
                />
                <Line
                  from={{ x: 0, y: minPrice }}
                  to={{ x: width, y: minPrice }}
                  stroke={palette.accents_4}
                  strokeWidth={1}
                  strokeDasharray={4}
                />
              </Group>
              <Group>
                <Text
                  x={10}
                  y={maxPrice - 10}
                  fill={palette.accents_6}
                  fontSize={14}>
                  {formatPrice(maxY)}
                </Text>
                <Text
                  x={10}
                  y={minPrice + 25}
                  fill={palette.accents_6}
                  fontSize={14}>
                  {formatPrice(minY)}
                </Text>
              </Group>
            </Group>
          )}
          <Axis
            axisClassName='axis-x'
            scale={xScale}
            orientation='bottom'
            top={innerHeight + margin.top + 30}
            hideAxisLine
            hideTicks
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
            x={0}
            y={innerHeight + margin.top + 35}
            width={width}
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
              from={{ x: tooltipLeft, y: maxPrice }}
              to={{ x: tooltipLeft, y: minPrice }}
              pointerEvents='none'
              stroke={palette.accents_3}
              strokeWidth={1}
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
            left={tooltipLeft + 1}
            style={{
              ...defaultStyles,
              color: palette.foreground,
              background: palette.background,
              border: "1px solid",
              borderColor: palette.accents_3,
            }}>
            {formatPrice(y(tooltipData))}
          </TooltipWithBounds>
          <Tooltip
            top={innerHeight + margin.top + 60}
            left={-10}
            style={{
              ...defaultStyles,
              textAlign: "center",
              background: "transparent",
              width: "100%",
              boxShadow: "none",
              padding: 0,
            }}>
            <GText h5 style={{ color: palette.accents_8 }}>
              {day ? dayFormat(x(tooltipData)) : dateFormat(x(tooltipData))}
            </GText>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
