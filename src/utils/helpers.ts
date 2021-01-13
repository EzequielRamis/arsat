import {
  startOfYear,
  subDays,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from "date-fns";
import {
  ARS_MIN_DATE,
  BTC_MIN_DATE,
  Coin,
  isBtc,
  Pair,
  Price,
  TimeRange,
} from "./types";

export function step(s: number, p: Price[]) {
  return p.reverse().filter((_v, i, _a) => i % s === 0);
}

export function randomEnum<T>(anEnum: T): T[keyof T] {
  const enumValues = (Object.values(anEnum) as unknown) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
}

export function pChange(data: Price[]) {
  const [from, to] = [data[0]?.value, data[data.length - 1]?.value];
  return (to - from) / from;
}

export const includesBtc = (p: Pair) => isBtc.some((btc) => p.includes(btc));

export const isUsdArs = (p: Pair) =>
  p.includes(Coin.USD) && p.includes(Coin.ARS);

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
