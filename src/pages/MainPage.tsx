import React from "react";
import _ from "lodash";
import useQuery from "../hooks/useQuery";
import styled from "styled-components";
import PullRequestCard from "../components/PullRequestCard";
import OctoClient, {
  PullRequestStateType,
  PullRequest,
  RepoType,
} from "../OctoClient";
import { Section, SectionTitle, SectionBody } from "../atoms";

const Loading = styled.div``;

const ORDER: PullRequestStateType[] = [
  "MUST_RE_REVIEW",
  "NEEDS_REVIEW",
  "WAITING_ON_AUTHOR",
  "REQUIRES_RE_REVIEW",
  "READY_TO_LAND",
  "UNKNOWN",
  "ABANDONED",
  "MERGED",
];

const SubSection = ({
  title,
  items = [],
}: {
  title: string;
  items?: PullRequest[];
}) => {
  return (
    <Section>
      <SectionTitle>{title}</SectionTitle>
      <SectionBody>
        {items.map((pr) => {
          return <PullRequestCard key={String(pr.item.id)} pr={pr} />;
        })}
      </SectionBody>
    </Section>
  );
};

const Content = ({ items = [] }: { items?: PullRequest[] }) => {
  const grouped = _.groupBy(items, (pr) => pr.state);

  return (
    <>
      {ORDER.map((key) => {
        return <SubSection key={key} title={key} items={grouped[key]} />;
      })}
    </>
  );
};

export default ({
  repos,
  client,
}: {
  repos: RepoType[];
  client: OctoClient;
}) => {
  if (repos.length === 0) {
    return <div>Go to settings page to select repos</div>;
  }

  const { loading, data } = useQuery(() => client.getDashboardData(repos));

  return loading ? <Loading>loading</Loading> : <Content items={data} />;
};
