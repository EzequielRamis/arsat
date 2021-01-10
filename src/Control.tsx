import {
  Button,
  ButtonGroup,
  Modal,
  Row,
  Col,
  useModal,
  Select,
  Text,
  Spacer,
} from "@geist-ui/react";
import {
  Settings,
  RefreshCcw,
  TrendingUp,
  Info as About,
} from "@geist-ui/react-icons";

type CSS = Partial<React.CSSProperties>;

const btn: CSS = {
  minWidth: "auto",
  width: "2rem",
  height: "2rem",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  border: "none",
  padding: "1rem",
  boxSizing: "content-box",
  margin: "0 1rem",
};

export function Control() {
  const edit = useModal();
  const openEdit = () => edit.setVisible(true);
  const closeEdit = () => edit.setVisible(false);
  return (
    <>
      <Row justify='center' align='middle' className='control'>
        <Button icon={<Settings />} style={btn}>
          Ajustes
        </Button>
        <Button icon={<TrendingUp />} style={btn} onClick={openEdit}>
          Editar
        </Button>
        <ButtonGroup vertical={true} size='medium' type='success' ghost={true}>
          <Button>Log</Button>
          <Button>Linear</Button>
        </ButtonGroup>
      </Row>
      <Row justify='end' className='about'>
        <Button
          icon={<About />}
          style={{ ...btn, padding: "0.25rem", margin: 0 }}
        />
      </Row>
      <Modal {...edit.bindings}>
        <Modal.Title>Editar par</Modal.Title>
        <Modal.Content>
          <Row>
            <Col offset={1}>
              <Col className='edit-select'>
                <Text small={true}>Base</Text>
                <Select />
              </Col>
              <Col className='edit-select'>
                <Text small={true}>Cotización</Text>
                <Select />
              </Col>
            </Col>
            <Row align='middle' justify='center' gap={1}>
              <Button icon={<RefreshCcw />} style={btn}>
                Dar vuelta
              </Button>
            </Row>
          </Row>
          <Spacer />
          <Row
            align='top'
            justify='center'
            gap={1}
            style={{ flexDirection: "column" }}>
            <Text small={true}>Rango de tiempo</Text>
            <Select />
          </Row>
        </Modal.Content>
        <Modal.Action passive onClick={closeEdit}>
          Cancelar
        </Modal.Action>
        <Modal.Action>Aceptar</Modal.Action>
      </Modal>
    </>
  );
}
