import { GeistUIThemesPalette } from "@geist-ui/react";

const status = {
  successLighter: "#57ffcd",
  successLight: "#34e6b0",
  success: "#17cc96",
  successDark: "#00b37d",

  errorLighter: "#f7d4d6",
  errorLight: "#ff4d6a",
  error: "#ea3e5b",
  errorDark: "#a82138",

  warningLighter: "#ffa64d",
  warningLight: "#f7931a",
  warning: "#e28117",
  warningDark: "#cc7014",
};

const others = {
  cyan: "#50e3c2",
  cyanLighter: "#aaffec",
  cyanLight: "#79ffe1",
  cyanDark: "#29bc9b",
  violet: "#7928ca",
  violetLighter: "#e3d7fc",
  violetLight: "#8a63d2",
  violetDark: "#4c2889",
  purple: "#f81ce5",
  alert: "#ff0080",
  magenta: "#eb367f",
};

export const night: GeistUIThemesPalette = {
  ...status,
  ...others,
  accents_1: "#111",
  accents_2: "#333",
  accents_3: "#444",
  accents_4: "#666",
  accents_5: "#888",
  accents_6: "#999",
  accents_7: "#eaeaea",
  accents_8: "#fafafa",
  background: "#000",
  foreground: "#fff",
  selection: "#f81ce5",
  secondary: "#a82138",
  code: "#79ffe1",
  border: "#333",
  link: "#448aff",
};

export const sunset: GeistUIThemesPalette = {
  ...status,
  ...others,
  accents_1: "#2e294a",
  accents_2: "#403a60",
  accents_3: "#544d77",
  accents_4: "#6a638e",
  accents_5: "#827ba4",
  accents_6: "#9c96bb",
  accents_7: "#d5d1e8",
  accents_8: "#d5d1e8",
  background: "#1e1933",
  foreground: "#f4f2ff",
  selection: "#f81ce5",
  secondary: "#a82138",
  code: "#79ffe1",
  border: "#544d77",
  link: "#448aff",
};

export const day: GeistUIThemesPalette = {
  ...status,
  ...others,
  accents_1: "#fafafa",
  accents_2: "#eaeaea",
  accents_3: "#999",
  accents_4: "#888",
  accents_5: "#666",
  accents_6: "#444",
  accents_7: "#333",
  accents_8: "#111",
  background: "#fff",
  foreground: "#000",
  selection: "#79ffe1",
  secondary: "#a82138",
  code: "#f81ce5",
  border: "#eaeaea",
  link: "#0070f3",
};

export enum ChartTheme {
  Dynamic = "dyn",
  Orange = "#e28117",
  Red = " #ea3e5b",
  Blue = "#448aff",
  Green = " #17cc96",
}

export type CSS = Partial<React.CSSProperties>;

export const btn: CSS = {
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
