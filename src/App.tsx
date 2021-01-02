import { useState, useEffect } from "react";
import { parse, subWeeks } from "date-fns";
import { Price } from "./utils";
import axios from "axios";

function App() {
  useEffect(() => {
    axios
      .get("/api/prices/usdars?from=1608336000")
      .then((res) => res.data)
      .then((res) => {
        let prices = res.map((price: Price) => {
          return {
            date: new Date(price.date),
            value: price.value,
          };
        });
        console.log("arsat", prices);
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
