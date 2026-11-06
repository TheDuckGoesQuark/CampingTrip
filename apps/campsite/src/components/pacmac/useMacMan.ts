import { useCallback, useMemo, useReducer } from "react";

import { type Actions, actionsForPhase } from "./engine/actions";
import { reduce } from "./engine/reducer";
import { initialState, type Phase, type StateIn } from "./engine/state";
import { useFixedStep } from "./useFixedStep";

/** A state and the actions its phase allows, kept in step. */
export type MacManView = {
  [P in Phase]: { state: StateIn<P>; actions: Actions<P> };
}[Phase];

export function useMacMan(): MacManView {
  const [state, dispatch] = useReducer(reduce, undefined, initialState);
  useFixedStep(useCallback(() => dispatch({ type: "tick" }), []));
  // Per phase rather than per state: the actions only change when it does, so
  // the input adapters are not handed new functions sixty times a second.
  const { phase } = state;
  const actions = useMemo(() => actionsForPhase(phase, dispatch), [phase]);
  return { state, actions } as MacManView;
}
