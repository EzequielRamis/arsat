import { format, formatDistanceToNow } from "date-fns";
import * as d3T from "d3-time";
import { es } from "date-fns/locale";
import { formatDefaultLocale, format as d3Format } from "d3-format";
import { Coin } from "./types";

export function formatRange(r: number) {
  return formatDistanceToNow(r, {
    locale: es,
    addSuffix: false,
  })
    .replace("alrededor de ", "")
    .replace("casi ", "")
    .replace("más de ", "");
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

export function name(c: Coin) {
  switch (c) {
    case Coin.ARS:
      return "Peso";
    case Coin.USD:
      return "Dólar";
    case Coin.BTC:
      return "Bitcoin";
    case Coin.SAT:
      return "Satoshi";
  }
}
