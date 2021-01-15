import { useState, useEffect, useCallback } from "react";
import { set, get } from "idb-keyval";

export function usePersistedState<TState>(
  keyToPersistWith: string,
  defaultState: TState
) {
  const [state, setState] = useState<TState>(defaultState);

  useEffect(() => {
    get<TState>(keyToPersistWith).then((retrievedState) =>
      // If a value is retrieved then use it; otherwise default to defaultValue
      setState(retrievedState ?? defaultState)
    );
  }, [keyToPersistWith, setState, defaultState]);

  const setPersistedValue = useCallback(
    (newValue: TState) => {
      setState(newValue);
      set(keyToPersistWith, newValue);
    },
    [keyToPersistWith, setState]
  );

  return [state, setPersistedValue] as const;
}

// export function usePersistedState<TState>(
//   keyToPersistWith: string,
//   defaultState: TState
// ) {
//   const [state, setState] = useState<TState | undefined>(undefined);

//   useEffect(() => {
//     get<TState>(keyToPersistWith).then((retrievedState) =>
//       // If a value is retrieved then use it; otherwise default to defaultValue
//       setState(retrievedState ?? defaultState)
//     );
//   }, [keyToPersistWith, setState, defaultState]);

//   const setPersistedValue = useCallback(
//     (newValue: TState) => {
//       setState(newValue);
//       set(keyToPersistWith, newValue);
//     },
//     [keyToPersistWith, setState]
//   );

//   return [state, setPersistedValue] as const;
// }
