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

type InfoProps = {
  data: Price[];
  pair: Pair;
  range: TimeRange;
};

export function Info({
  data = [{ date: new Date(), value: 0 }],
  pair,
  range,
}: InfoProps) {
  const { palette } = useTheme();
  const price = data[data.length - 1]?.value;
  const priceFormatted = formatPrice(price);
  const change = pChange(data);
  const perChange = formatChange(change);
  const firstDate = (includesBtc(pair) ? BTC_MIN_DATE : ARS_MIN_DATE).getTime();
  const distance = range !== TimeRange.Max ? range : formatRange(firstDate);
  return (
    <Grid.Container className='info' direction='column' alignItems='center'>
      <Text h5={true} className='info-name'>
        {name(pair[0])}
      </Text>
      <Text h1={true} className='info-price'>
        {priceFormatted}
        <Text small={true} b={true}>
          {"  "}
          {pair[1]}
        </Text>
      </Text>
      <Text
        h4={true}
        type={change < 0 ? "error" : "success"}
        className='info-change'>
        {perChange}
        {"  "}
        <Text small={true} b={true} style={{ color: palette.accents_6 }}>
          {distance}
        </Text>
      </Text>
    </Grid.Container>
  );
}
