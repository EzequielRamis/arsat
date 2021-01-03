import {
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  startOfYear,
  parse,
} from "date-fns";

export const MIN_DATE = parse("2013-04-30", "yyyy-MM-dd", new Date());
export const now = Date.now();

export interface Price {
  date: number;
  value: number;
}

export enum Pair {
  USDARS = "USDARS",
  USDBTC = "USDBTC",
  USDSAT = "USDSAT",
  ARSUSD = "ARSUSD",
  ARSBTC = "ARSBTC",
  ARSSAT = "ARSSAT",
  BTCUSD = "BTCUSD",
  BTCARS = "BTCARS",
  SATUSD = "SATUSD",
  SATARS = "SATARS",
}

export enum TimeRange {
  Day = subDays(now, 1).getTime(),
  Week = subWeeks(now, 1).getTime(),
  Month = subMonths(now, 1).getTime(),
  Quarter = subQuarters(now, 1).getTime(),
  Semester = subQuarters(now, 2).getTime(),
  Ytd = startOfYear(now).getTime(),
  Year = subYears(now, 1).getTime(),
  FiveYears = subYears(now, 5).getTime(),
  Max = MIN_DATE.getTime(),
}

export function skip(s: number, p: Price[]) {
  if (s === 1) return p;
  let f: Price[] = [];
  for (var i = p.length - 1; i >= 0; i -= s) {
    f.unshift(p[i]);
  }
  f = f.filter((e) => e !== undefined);
  return f;
}
