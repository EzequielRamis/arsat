import { useState, useEffect } from "react";
import { set, get } from "idb-keyval";

export function useIdb<T>(key: string, initialState: T) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    get(key).then((value) => value === undefined || setState(value));
  }, [key]);

  const setIdb = (value: T) => {
    setState(value);
    set(key, value);
  };

  return [state, setIdb] as const;
}
