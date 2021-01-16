import {
  Button,
  useModal,
  Modal,
  Col,
  Row,
  Radio,
  Text,
  Toggle,
  Select,
} from "@geist-ui/react";
import { Settings as SettingsIcon } from "@geist-ui/react-icons";
import { btn, ChartTheme } from "../utils/themes";
import { ReactText } from "react";
import { ToggleEvent } from "@geist-ui/react/dist/toggle/toggle";

export enum Theme {
  Day = "Día",
  Sunset = "Ocaso",
  Night = "Noche",
}

export enum InfoAlign {
  Left = "Izquierda",
  Center = "Centro",
  Right = "Derecha",
}

const themeOptions = Object.values(Theme).map((t: Theme) => (
  <Radio value={t} key={t}>
    {t}
  </Radio>
));

const infoAlignOptions = Object.values(InfoAlign).map((j: InfoAlign) => (
  <Radio value={j} key={j}>
    {j}
  </Radio>
));

const chartThemeOptions = Object.entries(ChartTheme).map(([k, c]) => (
  <Select.Option value={c} key={k}>
    {color(k)}
  </Select.Option>
));

function color(c: string) {
  switch (c) {
    case "Dynamic":
      return "Dinámico";
    case "Orange":
      return "Naranja";
    case "Red":
      return "Rojo";
    case "Blue":
      return "Azul";
    case "Green":
      return "Verde";
  }
}

type SettingsProps = {
  theme: [Theme, (t: Theme) => void];
  infoAlign: [InfoAlign, (a: InfoAlign) => void];
  minmax: [boolean, (m: boolean) => void];
  grid: [boolean, (m: boolean) => void];
  chartTheme: [ChartTheme, (m: ChartTheme) => void];
};

export function Settings({
  theme,
  infoAlign,
  minmax,
  grid,
  chartTheme,
}: SettingsProps) {
  const settings = useModal(),
    openSettings = () => settings.setVisible(true),
    closeSettings = () => settings.setVisible(false);

  const handleTheme = (value: ReactText) => {
    theme[1](value as Theme);
  };

  const handleInfoAlign = (value: ReactText) => {
    infoAlign[1](value as InfoAlign);
  };

  const handleMinMax = (event: ToggleEvent) => {
    minmax[1](event.target.checked);
  };

  const handleGrid = (event: ToggleEvent) => {
    grid[1](event.target.checked);
  };

  const handleChartTheme = (val: string | string[]) => {
    chartTheme[1](val as ChartTheme);
  };

  return (
    <>
      <Button icon={<SettingsIcon />} style={btn} onClick={openSettings}>
        Ajustes
      </Button>
      <Modal {...settings.bindings} wrapClassName='settings-modal'>
        <Modal.Title>Ajustes</Modal.Title>
        <Modal.Content>
          <Col>
            <Col className='settings-option'>
              <Text h5>Tema</Text>
              <Radio.Group
                useRow
                value={theme[0]}
                onChange={handleTheme}
                size='medium'>
                {themeOptions}
              </Radio.Group>
            </Col>
            <Col className='settings-option'>
              <Text h5>Alinear información</Text>
              <Radio.Group
                useRow
                value={infoAlign[0]}
                onChange={handleInfoAlign}
                size='medium'>
                {infoAlignOptions}
              </Radio.Group>
            </Col>
            <Col className='settings-option'>
              <Row justify='space-between' align='middle'>
                <Text h5>Mostrar precio máximo y mínimo</Text>
                <Toggle
                  size='large'
                  checked={minmax[0]}
                  onChange={handleMinMax}
                />
              </Row>
            </Col>
            <Col className='settings-option'>
              <Row justify='space-between' align='middle'>
                <Text h5>Mostrar escala</Text>
                <Toggle size='large' checked={grid[0]} onChange={handleGrid} />
              </Row>
            </Col>
            <Col className='settings-option'>
              <Row justify='space-between' align='middle'>
                <Text h5>Color del gráfico</Text>
                <Select value={chartTheme[0]} onChange={handleChartTheme}>
                  {chartThemeOptions}
                </Select>
              </Row>
            </Col>
          </Col>
        </Modal.Content>
        <Modal.Action passive onClick={closeSettings}>
          Cerrar
        </Modal.Action>
      </Modal>
    </>
  );
}
