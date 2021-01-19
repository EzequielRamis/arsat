import { Theme } from "./components/Settings";
import { GeistProvider, CssBaseline } from "@geist-ui/react";
import { day, night, sunset } from "./utils/themes";
import { useIdb } from "./utils/hooks";
import Main from "./components/Main";

function App() {
  const [theme, setTheme] = useIdb("theme", Theme.Sunset);

  return (
    <GeistProvider
      theme={{
        palette:
          theme === Theme.Day ? day : theme === Theme.Sunset ? sunset : night,
      }}>
      <CssBaseline />
      <Main theme={[theme, setTheme]} />
    </GeistProvider>
  );
}

export default App;
