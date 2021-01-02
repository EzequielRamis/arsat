import { useState, useEffect } from "react";
import { getUsdArs, Price } from "./prices";
import { parse } from "date-fns";

function App() {
  const [data, setData] = useState<Price[]>([]);
  useEffect(() => {
    getUsdArs(
      parse("01-01-2019", "dd-MM-yyyy", new Date()),
      parse("31-12-2019", "dd-MM-yyyy", new Date())
    )
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
