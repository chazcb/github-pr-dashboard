import React, { useContext, createContext, useReducer, useEffect } from "react";
import _ from "lodash";
import { RepoType } from "../OctoClient";
import { setItem, getItem } from "../storage";

type StateType = Partial<{
  repos: RepoType[];
  token: string;
}>;

const KEY = "__DATA__";

const StateContext = createContext<{
  dispatch: React.Dispatch<ActionType>;
  state: StateType;
}>({ dispatch: () => null, state: {} });

type ActionType =
  | { type: "LOGIN"; token: string }
  | { type: "LOGOUT" }
  | { type: "ADD_REPO"; repo: RepoType }
  | { type: "REMOVE_REPO"; repo: RepoType };

const reducer = (state: StateType, action: ActionType): StateType => {
  switch (action.type) {
    case "LOGIN":
      return { ...state, token: action.token };
    case "LOGOUT":
      return {};
    case "ADD_REPO": {
      const { repos = [] } = state;
      const { repo } = action;
      const exists = _.some(repos, { full_name: repo.full_name });

      if (exists) {
        return state;
      }

      return {
        ...state,
        repos: exists ? repos : [...repos, repo],
      };
    }

    case "REMOVE_REPO": {
      const { repos = [] } = state;
      const { repo } = action;
      const exists = _.some(repos, { full_name: repo.full_name });

      if (!exists) {
        return state;
      }

      const next = _.reject(repos, { full_name: repo.full_name });
      return {
        ...state,
        repos: next,
      };
    }

    default:
      return state;
  }
};

const safeParse = (json: string | null) => {
  try {
    return JSON.parse(json || "{}") || {};
  } catch (e) {}
  return {};
};

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, safeParse(getItem(KEY)));

  useEffect(() => {
    setItem(KEY, JSON.stringify(state));
  }, [state]);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
}

export default () => {
  return useContext(StateContext);
};
