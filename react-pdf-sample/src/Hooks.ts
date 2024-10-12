import { useAppStateValue } from "./State";
import { useCallback } from "react";
import { Action } from "./Types";

export enum DispatchBehavior {
  Always,
  UnlessAsyncing,
  UnlessError,
}
export const useDispatchHandler = (dispatch: (action: Action) => void) => {
  const { isAsyncing, isError } = useAsyncHelper();
  const dispatchHandler = useCallback(
    (
      action: Action,
      options?: {
        stopProp?: boolean;
        when?: DispatchBehavior;
      }
    ) => {
      const stopProp = options?.stopProp ?? true;
      const when = options?.when ?? DispatchBehavior.Always;
      return when == DispatchBehavior.UnlessAsyncing && isAsyncing || when == DispatchBehavior.UnlessError && isError
        ? undefined
        : (event: React.MouseEvent) => {
            dispatch(action);
            if (stopProp) event.stopPropagation();
          };
    },
    [isAsyncing, isError, dispatch]
  );

  return {
    dispatch: dispatchHandler,
    dispatchUnlessAsyncing: (action: Action) =>
      dispatchHandler(action, { when: DispatchBehavior.UnlessAsyncing }),
    dispatchUnlessError: (action: Action) =>
      dispatchHandler(action, { when: DispatchBehavior.UnlessError }),
  };
};

export const useAsyncHelper = () => {
  const { asyncState } = useAppStateValue();
  const isAsyncing = asyncState.status != "idle";
  const isError = isAsyncing && !!asyncState.uxAtError;
  return { isAsyncing, isError };
}