import { parse } from "date-fns";

export const ARS_MIN_DATE = parse("2002-01-11", "yyyy-MM-dd", new Date());
export const BTC_MIN_DATE = parse("2013-04-30", "yyyy-MM-dd", new Date());

export interface Price {
  date: Date;
  value: number;
}

export enum Coin {
  ARS = "ARS",
  USD = "USD",
  BTC = "BTC",
  SAT = "SAT",
}

export type Pair = [Coin, Coin];

export const isBtc = [Coin.BTC, Coin.SAT];

export enum TimeRange {
  Day = "24 horas",
  Week = "1 semana",
  Month = "1 mes",
  Quarter = "3 meses",
  Semester = "6 meses",
  Year = "1 año",
  TwoYears = "2 años",
  FiveYears = "5 años",
  TenYears = "10 años",
  Ytd = "YTD",
  Max = "Máximo",
}
