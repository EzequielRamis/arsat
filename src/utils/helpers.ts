import {
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns";
import { ChartTheme } from "./themes";
import {
  ARS_MIN_DATE,
  BTC_MIN_DATE,
  Coin,
  isBtc,
  LiveCount,
  Pair,
  Price,
  TimeRange,
} from "./types";

export function step(s: number, p: Price[]) {
  return inverse(inverse(p).filter((_v, i, _a) => i % s === 0));
}

export function pChange(data: Price[]) {
  const [from, to] = [data[0]?.value, data[data.length - 1]?.value];
  return (to - from) / from;
}

export const includesBtc = (p: Pair) => isBtc.some((btc) => p.includes(btc));

export function getFromDate(p: Pair, t: TimeRange, now: number) {
  switch (t) {
    case TimeRange.Day:
      return subDays(now, 1);
    case TimeRange.Week:
      return subWeeks(now, 1);
    case TimeRange.Month:
      return subMonths(now, 1);
    case TimeRange.Quarter:
      return subQuarters(now, 1);
    case TimeRange.Semester:
      return subQuarters(now, 2);
    case TimeRange.Year:
      return subYears(now, 1);
    case TimeRange.TwoYears:
      return subYears(now, 2);
    case TimeRange.FiveYears:
      return subYears(now, 5);
    case TimeRange.TenYears:
      return subYears(now, 10);
    case TimeRange.Ytd:
      return startOfYear(now);
    case TimeRange.Max:
      return includesBtc(p) ? BTC_MIN_DATE : ARS_MIN_DATE;
  }
}

export function getPrices(pair: Pair, r: TimeRange, now: number) {
  const from = getFromDate(pair, r, now).getTime();
  return `/api/prices/${pair.join("")}?from=${from}`;
}

export function dynStep(pair: Pair, time: TimeRange) {
  if (includesBtc(pair) && time === TimeRange.Month) return 5;
  if (time === TimeRange.TwoYears) return 2;
  if (time === TimeRange.FiveYears) return 5;
  if (time === TimeRange.TenYears) return 10;
  if (time === TimeRange.Max)
    if (includesBtc(pair)) return 10;
    else return 25;
  return 1;
}

export function dynChartTheme(pair: Pair) {
  if (pair.includes(Coin.USD) && pair.includes(Coin.ARS))
    return ChartTheme.Blue;
  else if (pair.includes(Coin.SAT) && pair.includes(Coin.ARS))
    return ChartTheme.Red;
  else return ChartTheme.Orange;
}

export function inverse<T>(arr: T[]) {
  let newArray = [];
  for (let i = arr.length - 1; i >= 0; i--) {
    newArray.push(arr[i]);
  }
  return newArray;
}

export function getLiveType(pair: Pair, time: TimeRange) {
  if (
    time !== TimeRange.Day &&
    time !== TimeRange.Week &&
    time !== TimeRange.Month &&
    time !== TimeRange.Quarter
  )
    return LiveCount.None;
  else if (pair[0] === pair[1]) return LiveCount.None;
  else if (!includesBtc(pair)) return LiveCount.None;
  else if (time === TimeRange.Day) return LiveCount.Minute;
  else return LiveCount.Hour;
}
