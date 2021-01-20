import { Button, useModal, Modal, Text, Link, Divider } from "@geist-ui/react";
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
            Arsat es un proyecto Open Source, cuyo código fuente e información
            adicional se puede ver acá:
          </Text>
          <Text>
            <Link
              block
              icon
              target='_blank'
              href='https://github.com/EzequielRamis/arsat'>
              Repositorio
            </Link>
          </Text>
          <Text>
            Este sitio funciona como una aplicación móvil nativa, asi que si no
            te lo descargaste aún, instalalo desde las opciones de tu navegador.
          </Text>
          <Divider />
          <Text>
            Arsat no pretende brindar consejo, recomendación, ni asesoramiento
            de ningún tipo. Asimismo, todas las fuentes de información son de
            público acceso, por lo que no se será responsable de la falta de
            precisión, veracidad, y/o exactitud de los datos.
          </Text>
        </Modal.Content>
        <Modal.Action passive onClick={closeAbout}>
          Cerrar
        </Modal.Action>
      </Modal>
    </>
  );
}
