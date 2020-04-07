import React, { SyntheticEvent, useMemo } from "react";

import { BrowserRouter, Switch, Route, NavLink } from "react-router-dom";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";

import SettingsPage from "./pages/SettingsPage";
import { Layout } from "./atoms";
import useData, { StateProvider } from "./hooks/useData";
import OctoClient from "./OctoClient";

const activeStyle = { fontWeight: 700 };
const NavBar = () => {
  const { dispatch } = useData();
  const onClickLogout = (evt: SyntheticEvent<HTMLButtonElement>) => {
    evt.preventDefault();
    dispatch({ type: "LOGOUT" });
  };
  return (
    <div>
      <NavLink activeStyle={activeStyle} to="/">
        pulls
      </NavLink>
      {" | "}
      <NavLink activeStyle={activeStyle} to="/settings">
        settings
      </NavLink>
      {" | "}
      <button onClick={onClickLogout}>logout</button>
    </div>
  );
};

const getClient = (t?: string) => (t ? new OctoClient(t) : undefined);

function App() {
  const { state } = useData();
  const { token, repos = [] } = state;
  const client = useMemo(() => getClient(token), [token]);

  if (!client) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <NavBar />
      <Switch>
        <Route exact path="/">
          <MainPage repos={repos} client={client} />
        </Route>
        <Route to="/settings">
          <SettingsPage client={client} />
        </Route>
      </Switch>
    </Layout>
  );
}

export default () => {
  return (
    <BrowserRouter>
      <StateProvider>
        <App />
      </StateProvider>
    </BrowserRouter>
  );
};
