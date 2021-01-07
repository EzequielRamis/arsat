import {
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  startOfYear,
  parse,
} from "date-fns";

export const ARS_MIN_DATE = parse("2002-01-11", "yyyy-MM-dd", new Date());
export const BTC_MIN_DATE = parse("2013-04-30", "yyyy-MM-dd", new Date());
export const now = Date.now();

export interface Price {
  date: Date;
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
  Year = subYears(now, 1).getTime(),
  TwoYears = subYears(now, 2).getTime(),
  FiveYears = subYears(now, 5).getTime(),
  TenYears = subYears(now, 10).getTime(),
  Ytd = startOfYear(now).getTime(),
  ArsMax = ARS_MIN_DATE.getTime(),
  BtcMax = BTC_MIN_DATE.getTime(),
}

export function step(s: number, p: Price[]) {
  return p
    .reverse()
    .filter((v, i, a) => i % s === 0)
    .reverse();
}
