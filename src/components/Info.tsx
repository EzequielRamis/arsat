import {
  TimeRange,
  Price,
  Pair,
  BTC_MIN_DATE,
  ARS_MIN_DATE,
} from "../utils/types";
import { name, formatPrice, formatChange, formatRange } from "../utils/formats";
import { includesBtc, pChange } from "../utils/helpers";
import { useTheme, Text, Grid } from "@geist-ui/react";
import { InfoAlign } from "./Settings";

type InfoProps = {
  data: Price[];
  pair: Pair;
  range: TimeRange;
  align: InfoAlign;
};

export function Info({ data, pair, range, align }: InfoProps) {
  const { palette } = useTheme();
  const price = data.length === 0 ? 0 : data[data.length - 1].value;
  const priceFormatted = formatPrice(price);
  const change = pChange(data);
  const perChange = formatChange(change);
  const firstDate = (includesBtc(pair) ? BTC_MIN_DATE : ARS_MIN_DATE).getTime();
  const distance = range !== TimeRange.Max ? range : formatRange(firstDate);
  return (
    <Grid.Container
      className='info'
      direction='column'
      alignItems={
        align === InfoAlign.Left
          ? "flex-start"
          : align === InfoAlign.Center
          ? "center"
          : "flex-end"
      }>
      <Text h5 className='info-name'>
        {name(pair[0])}
      </Text>
      <Text h1 className='info-price'>
        {priceFormatted}
        <Text small b>
          {"  "}
          {pair[1]}
        </Text>
      </Text>
      <Text h4 type={change < 0 ? "error" : "success"} className='info-change'>
        {perChange}
        {"  "}
        <Text small b style={{ color: palette.accents_6 }}>
          {distance}
        </Text>
      </Text>
    </Grid.Container>
  );
}
