import { yScaleT } from "./Chart";
import { Button, ButtonGroup, useTheme } from "@geist-ui/react";

type ScaleProps = {
  scale: [yScaleT, (s: yScaleT) => void];
};

export function Scale({ scale }: ScaleProps) {
  const { palette } = useTheme();

  const scaleSelected = (s: yScaleT) => {
    if (s === scale[0])
      return {
        color: palette.background,
        backgroundColor: palette.success,
      };
    else
      return {
        color: palette.success,
        backgroundColor: "transparent",
      };
  };
  return (
    <ButtonGroup vertical size='medium' type='success' ghost>
      <Button
        style={scaleSelected(yScaleT.Log)}
        onClick={() => scale[1](yScaleT.Log)}>
        Log
      </Button>
      <Button
        style={scaleSelected(yScaleT.Linear)}
        onClick={() => scale[1](yScaleT.Linear)}>
        Lineal
      </Button>
    </ButtonGroup>
  );
}
