import { Button, useModal, Modal, Text, Link } from "@geist-ui/react";
import { Info } from "@geist-ui/react-icons";
import { btn } from "../utils/themes";

export default function About() {
  const about = useModal(),
    openAbout = () => about.setVisible(true),
    closeAbout = () => about.setVisible(false);
  return (
    <>
      <Button
        icon={<Info />}
        style={{ ...btn, padding: "0.25rem", margin: 0 }}
        onClick={openAbout}
      />
      <Modal {...about.bindings} wrapClassName='about-modal'>
        <Modal.Title>Acerca de</Modal.Title>
        <Modal.Content>
          <Text>
            Arsat es un proyecto Open Source, cuyo código fuente se puede ver
            acá:
          </Text>
          <Text>
            <Link block icon href='https://github.com/EzequielRamis/arsat'>
              Repositorio
            </Link>
          </Text>
          <Text>Para saber más, hacé click en:</Text>
          <Text>
            <Link block icon href='https://github.com/EzequielRamis/arsat'>
              Más información
            </Link>
          </Text>
          <Text>
            Aclaración: Este sitio funciona como una aplicación nativa, asi que
            si no te lo descargaste aún, instalalo haciendo click en las
            opciones de tu navegador, y en "Agregar a la pantalla principal".
          </Text>
        </Modal.Content>
        <Modal.Action passive onClick={closeAbout}>
          Cerrar
        </Modal.Action>
      </Modal>
    </>
  );
}
