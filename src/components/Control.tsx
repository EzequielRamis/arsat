import {
  Button,
  Modal,
  Row,
  Col,
  useModal,
  useToasts,
  Select,
  Text,
  Spacer,
  Dot,
} from "@geist-ui/react";
import { RefreshCcw, TrendingUp } from "@geist-ui/react-icons";
import { Coin, TimeRange, Pair, BTC_MIN_DATE, LiveCount } from "../utils/types";
import { btn } from "../utils/themes";
import { name } from "../utils/formats";
import { useState } from "react";
import { getFromDate, getLiveType, includesBtc } from "../utils/helpers";
import { isBefore } from "date-fns";

type ControlProps = {
  pair: [Pair, (p: Pair) => void];
  time: [TimeRange, (t: TimeRange) => void];
  isLive: boolean;
};

const pairOptions = Object.values(Coin).map((c: Coin) => (
  <Select.Option value={c} key={c}>
    {name(c)}
  </Select.Option>
));

const timeOptions = Object.values(TimeRange).map((t: TimeRange) => (
  <Select.Option value={t} key={t}>
    {t}
  </Select.Option>
));

export function Control({ pair, time, isLive }: ControlProps) {
  const edit = useModal(),
    openEdit = () => edit.setVisible(true),
    closeEdit = () => edit.setVisible(false);

  const [, setToast] = useToasts();

  const [actualPair, setActualPair] = useState<Pair>(pair[0]),
    [actualTime, setActualTime] = useState<TimeRange>(time[0]);

  const live = getLiveType(actualPair, actualTime);

  const handleBaseSelect = (val: string | string[]) => {
    const p = [val as Coin, actualPair[1]] as Pair;
    setActualPair(p);
  };

  const handleQuoteSelect = (val: string | string[]) => {
    const p = [actualPair[0], val as Coin] as Pair;
    setActualPair(p);
  };

  const handleInterchange = () =>
    setActualPair([actualPair[1], actualPair[0]] as Pair);

  const handleTimeSelect = (val: string | string[]) =>
    setActualTime(val as TimeRange);

  const handleSubmit = () => {
    if (actualPair.includes(Coin.BTC) && actualPair.includes(Coin.SAT)) {
      setToast({
        delay: 5000,
        text: "Elegí otro par, porque un bitcoin siempre vale 10^8 satoshis.",
        type: "secondary",
      });
    } else if (actualPair[0] === actualPair[1]) {
      let c = name(actualPair[0]).toLowerCase();
      setToast({
        delay: 5000,
        text: `Elegí otro par, porque un ${c} siempre vale un ${c}.`,
        type: "secondary",
      });
    } else if (
      actualPair.includes(Coin.USD) &&
      actualPair.includes(Coin.ARS) &&
      (actualTime === TimeRange.Day || actualTime === TimeRange.Week)
    ) {
      setToast({
        delay: 5000,
        text:
          "No hay datos suficientes de este par en un rango menor a un mes.",
        type: "secondary",
      });
    } else if (
      includesBtc(actualPair) &&
      actualTime === TimeRange.TenYears &&
      isBefore(getFromDate(actualPair, actualTime, Date.now()), BTC_MIN_DATE)
    ) {
      setToast({
        delay: 5000,
        text:
          "No es posible obtener datos sobre bitcoin de hace 10 años. Elegí otro rango.",
        type: "secondary",
      });
    } else {
      closeEdit();
      pair[1](actualPair);
      time[1](actualTime);
    }
  };

  return (
    <>
      <Button icon={<TrendingUp />} style={btn} onClick={openEdit}>
        Modificar
      </Button>
      <Modal {...edit.bindings}>
        <Modal.Title>Modificar variables</Modal.Title>
        <Modal.Content>
          {isLive && (
            <Row gap={1.5}>
              {live === LiveCount.Minute ? (
                <Dot type='success'>Actualización en vivo disponible</Dot>
              ) : live === LiveCount.Hour ? (
                <Dot type='warning'>Actualización a cada hora disponible</Dot>
              ) : (
                <Dot type='error'>Actualización en vivo no disponible</Dot>
              )}
            </Row>
          )}
          <Spacer />
          <Row
            align='top'
            justify='center'
            gap={1}
            style={{ flexDirection: "column" }}>
            <Text small>Rango de tiempo</Text>
            <Select value={actualTime} onChange={handleTimeSelect}>
              {timeOptions}
            </Select>
          </Row>
          <Spacer y={0.5} />
          <Row>
            <Col offset={1}>
              <Col className='edit-select'>
                <Text small>Base</Text>
                <Select value={actualPair[0]} onChange={handleBaseSelect}>
                  {pairOptions}
                </Select>
              </Col>
              <Col className='edit-select'>
                <Text small>Cotización</Text>
                <Select value={actualPair[1]} onChange={handleQuoteSelect}>
                  {pairOptions}
                </Select>
              </Col>
            </Col>
            <Row align='middle' justify='center' gap={1} className='flip-pair'>
              <Button
                icon={<RefreshCcw />}
                style={btn}
                onClick={handleInterchange}>
                Dar vuelta
              </Button>
            </Row>
          </Row>
        </Modal.Content>
        <Modal.Action passive onClick={closeEdit}>
          Cancelar
        </Modal.Action>
        <Modal.Action onClick={handleSubmit}>Aceptar</Modal.Action>
      </Modal>
    </>
  );
}
