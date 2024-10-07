import { useCallback } from "react";
import { Action } from "./Types";

export const useDispatchHandler = (dispatch: (action: Action) => void) =>
  useCallback(
    (action: Action, stopProp = true) =>
      (event: React.MouseEvent) => {
        dispatch(action);
        if (stopProp) event.stopPropagation();
      },
    [dispatch]
  );
