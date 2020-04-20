import React, { SyntheticEvent } from "react";
import OctoClient, { RepoType } from "../OctoClient";
import _ from "lodash";

import useQuery from "../hooks/useQuery";

import useData from "../hooks/useData";

type PropsType = { client: OctoClient };

const UserInfo = ({ client }: PropsType) => {
  const { data } = useQuery(() => client.getCurrentUser());
  return (
    <div>
      <div>Logged in as {data?.login}</div>
    </div>
  );
};

const Repo = ({ repo }: { repo: RepoType }) => {
  const { state, dispatch } = useData();
  const { repos = [] } = state;
  const isSelected = _.some(repos, { full_name: repo.full_name });

  const onChange = (evt: SyntheticEvent<HTMLInputElement>) => {
    const { checked } = evt.currentTarget;
    const type = checked ? "ADD_REPO" : "REMOVE_REPO";
    dispatch({ type, repo });
  };

  return (
    <div>
      <input
        name="isGoing"
        type="checkbox"
        checked={isSelected}
        onChange={onChange}
      />
      {repo.full_name}
    </div>
  );
};

const AvailableRepos = ({ client }: PropsType) => {
  const { data, loading } = useQuery(() => client.listRepos());
  return (
    <div>
      {loading
        ? "loading"
        : data?.map((r) => <Repo key={r.full_name} repo={r} />)}
    </div>
  );
};

const SettingsPage = ({ client }: PropsType) => {
  return (
    <div>
      <UserInfo client={client} />
      <AvailableRepos client={client} />
    </div>
  );
};

export default SettingsPage;
