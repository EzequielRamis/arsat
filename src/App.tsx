import { useState, useEffect } from "react";
import { getArsSat, Price } from "./prices";
import { parse, subWeeks } from "date-fns";

function App() {
  const [data, setData] = useState<Price[]>([]);
  useEffect(() => {
    getArsSat(11, subWeeks(Date.now(), 1).getTime())
      .then((res) => {
        let prices = res.map((price) => {
          return {
            date: new Date(price.date),
            value: price.value,
          };
        });
        console.log("arsat", prices);
        // setData(res);
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
