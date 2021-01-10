import {
  subDays,
  subWeeks,
  subMonths,
  subQuarters,
  subYears,
  startOfYear,
  parse,
  format,
} from "date-fns";
import { GeistUIThemesPalette } from "@geist-ui/react";
import * as d3T from "d3-time";
import { es } from "date-fns/locale";
import { formatDefaultLocale, format as d3Format } from "d3-format";

export const ARS_MIN_DATE = parse("2002-01-11", "yyyy-MM-dd", new Date());
export const BTC_MIN_DATE = parse("2013-04-30", "yyyy-MM-dd", new Date());
export const now = Date.now();

export interface Price {
  date: Date;
  value: number;
}

export enum Coin {
  USD = "USD",
  ARS = "ARS",
  BTC = "BTC",
  SAT = "SAT",
}

export function name(c: Coin) {
  switch (c) {
    case Coin.ARS:
      return "Peso";
    case Coin.USD:
      return "Dólar";
    case Coin.BTC:
      return "Bitcoin";
    case Coin.SAT:
      return "Bitcoin (Satoshi)";
  }
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
  return p.reverse().filter((v, i, a) => i % s === 0);
}

export function randomEnum<T>(anEnum: T): T[keyof T] {
  const enumValues = (Object.values(anEnum) as unknown) as T[keyof T][];
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex];
}

export const locale = formatDefaultLocale({
  currency: ["$", ""],
  decimal: ",",
  thousands: ".",
  grouping: [3],
});

export function formatPrice(p: number) {
  let spec = ",.2f";
  if (p < 1) {
    spec = ",.4";
  } else if (p >= Math.pow(10, 6)) {
    spec = ",.4s";
  }
  return d3Format(spec)(p);
}

export function formatChange(p: number) {
  let spec = "+,.2%";
  if (p >= 100) {
    return d3Format("+,.3s")(p * 100) + "%";
  }
  return d3Format(spec)(p);
}

export const formatMillisecond = ".SS",
  formatSecond = ":ss",
  formatMinute = "HH:mm",
  formatHour = "HH 'hs'",
  formatDay = "dd LLL",
  formatWeek = "dd LLL",
  formatMonth = "LLL",
  formatYear = "yyyy";

export function multiFormat(date: Date) {
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

export const lightPalette: Partial<GeistUIThemesPalette> = {
  background: "#faf9ff",
  accents_1: "#d9d6e8",
  accents_2: "#bbb6d2",
  accents_3: "#9e99bb",
  accents_4: "#847ea4",
  accents_5: "#6c658e",
  accents_6: "#554e77",
  accents_7: "#413a60",
  accents_8: "#2e294a",
  foreground: "#1e1933",

  successLighter: "#57ffcd",
  successLight: "#34e6b0",
  success: "#17cc96",
  successDark: "#00b37d",

  errorLighter: "#ff4d6a",
  errorLight: "#ea3e5b",
  error: "#d5324d",
  errorDark: "#bf2640",

  warningLighter: "#ffa64d",
  warningLight: "#f7931a",
  warning: "#e28117",
  warningDark: "#cc7014",
};

export const darkPalette: Partial<GeistUIThemesPalette> = {
  background: "#1e1933",
  accents_1: "#2e294a",
  accents_2: "#413a60",
  accents_3: "#554e77",
  accents_4: "#6c658e",
  accents_5: "#847ea4",
  accents_6: "#9e99bb",
  accents_7: "#bbb6d2",
  accents_8: "#d9d6e8",
  foreground: "#faf9ff",

  successDark: "#57ffcd",
  success: "#34e6b0",
  successLight: "#17cc96",
  successLighter: "#00b37d",

  errorDark: "#ff4d6a",
  error: "#ea3e5b",
  errorLight: "#d5324d",
  errorLighter: "#bf2640",

  warningDark: "#ffa64d",
  warning: "#f7931a",
  warningLight: "#e28117",
  warningLighter: "#cc7014",
};
