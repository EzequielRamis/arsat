import { useState, useEffect, useRef } from "react";
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

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void | null>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  });

  // Set up the interval.
  useEffect(() => {
    function tick() {
      if (typeof savedCallback?.current !== "undefined") {
        savedCallback?.current();
      }
    }
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}
