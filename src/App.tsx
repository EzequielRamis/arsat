import { useState, useEffect } from "react";
import { getUsdArs, Price } from "./prices";
import { parse } from "date-fns";

function App() {
  const [data, setData] = useState<Price[]>([]);
  useEffect(() => {
    getUsdArs(parse("28-12-2020", "dd-MM-yyyy", new Date()))
      .then((res) => {
        console.log(res);
        setData(res);
      })
      .catch((err) => console.log(err));
  }, []);
  return (
    <>
      <p></p>
    </>
  );
}

export default App;
