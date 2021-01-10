import {
  Coin,
  TimeRange,
  Price,
  name,
  formatPrice,
  formatChange,
} from "./utils";
import { formatDistanceToNow } from "date-fns";
import { useTheme, Text, Grid } from "@geist-ui/react";
import { es } from "date-fns/esm/locale";

type InfoProps = {
  data: Price[];
  pair: [Coin, Coin];
  range: TimeRange;
};

export function Info({ data, pair, range }: InfoProps) {
  const { palette } = useTheme();
  const price = data[data.length - 1]?.value;
  const priceFormatted = formatPrice(price);
  const [from, to] = [data[0]?.value, price];
  const change = (to - from) / from;
  const perChange = formatChange(change);
  const distance = formatDistanceToNow(range, {
    locale: es,
    addSuffix: false,
  })
    .replace("alrededor de ", "")
    .replace("casi ", "")
    .replace("más de ", "");
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
