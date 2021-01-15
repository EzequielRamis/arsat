import { Button, useModal, Modal, Col, Radio, Text } from "@geist-ui/react";
import { Settings as SettingsIcon } from "@geist-ui/react-icons";
import { btn } from "../utils/themes";
import { usePersistedState } from "../utils/hooks";
import { ReactText } from "react";

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

export function useSettingsTheme(initialValue: Theme) {
  return usePersistedState("theme", initialValue);
}

export function useSettingsInfoAlign(initialValue: InfoAlign) {
  return usePersistedState("info-justify", initialValue);
}

const themeOptions = Object.values(Theme).map((t: Theme) => (
  <Radio value={t}>{t}</Radio>
));

const infoAlignOptions = Object.values(InfoAlign).map((j: InfoAlign) => (
  <Radio value={j}>{j}</Radio>
));

type SettingsProps = {
  theme: [Theme, (t: Theme) => void];
  infoAlign: [InfoAlign, (j: InfoAlign) => void];
};

export function Settings({ theme, infoAlign }: SettingsProps) {
  const settings = useModal(),
    openSettings = () => settings.setVisible(true),
    closeSettings = () => settings.setVisible(false);

  const handleTheme = (value: ReactText) => {
    theme[1](value as Theme);
  };

  const handleInfoAlign = (value: ReactText) => {
    infoAlign[1](value as InfoAlign);
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
          </Col>
        </Modal.Content>
        <Modal.Action passive onClick={closeSettings}>
          Cerrar
        </Modal.Action>
      </Modal>
    </>
  );
}
